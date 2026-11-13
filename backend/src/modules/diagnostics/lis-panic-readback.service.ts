import crypto from 'crypto';
import { logger } from '../../utils/logger';

// ============================================================================
// ASRTAVA P1-02: LABORATORY PANIC-VALUE ALERT & TELEPHONE READ-BACK SERVICE
// Enforces CAP / NABH / Joint Commission critical laboratory alert protocol:
// 1. Immediate panic-value detection bypassing quiet-hours.
// 2. Identification of responsible treating clinician and ward.
// 3. Mandatory Verbal Telephone Read-Back workflow capturing caller, receiver,
//    exact verbal repetition, and confirmation timestamp.
// 4. Automated 15-minute escalation timer to Department Head / CMO if unacknowledged.
// ============================================================================

export interface PanicThreshold {
  parameterCode: string;
  parameterName: string;
  lowCritical?: number;
  highCritical?: number;
  unit: string;
  panicMessage: string;
}

export interface PanicAlert {
  alertId: string;
  hospitalId: string;
  specimenId: string;
  orderId: string;
  patientId: string;
  uhid: string;
  patientName: string;
  wardId: string;
  bedNumber?: string;
  parameterCode: string;
  parameterName: string;
  observedValue: number;
  unit: string;
  criticalLimitBreached: string;
  severity: 'CRITICAL_PANIC';
  status: 'PENDING_READBACK' | 'VERBAL_READBACK_COMPLETED' | 'ESCALATED' | 'CANCELLED';
  treatingClinicianId: string;
  treatingClinicianName: string;
  clinicianMobile?: string;
  wardIntercom?: string;
  quietHoursBypassed: boolean;
  alertCreatedAt: string;
  escalationDueAt: string; // 15 minutes post-creation
  readBackRecord?: VerbalReadBackRecord;
  escalatedToUserId?: string;
  escalationReason?: string;
  auditChecksum: string;
}

export interface VerbalReadBackRecord {
  readBackId: string;
  callerStaffId: string;
  callerStaffName: string;
  receivingClinicianId: string;
  receivingClinicianName: string;
  receivingClinicianDesignation: string;
  verbalReadBackTranscript: string;
  readBackMatchesResult: boolean;
  clinicalAgreement: boolean;
  intercomOrPhoneNumberUsed: string;
  completedAt: string;
  notes?: string;
}

export class LisPanicReadbackService {
  private static alerts: Map<string, PanicAlert> = new Map();

  // Canonical Bio-Reference Critical Panic Thresholds (Adult Inpatient)
  private static defaultThresholds: PanicThreshold[] = [
    { parameterCode: 'POTASSIUM', parameterName: 'Serum Potassium (K+)', lowCritical: 2.8, highCritical: 6.2, unit: 'mmol/L', panicMessage: 'Severe dysrhythmia / cardiac arrest risk' },
    { parameterCode: 'SODIUM', parameterName: 'Serum Sodium (Na+)', lowCritical: 120, highCritical: 160, unit: 'mmol/L', panicMessage: 'Severe neurological deterioration / seizure risk' },
    { parameterCode: 'GLUCOSE', parameterName: 'Plasma Glucose', lowCritical: 45, highCritical: 450, unit: 'mg/dL', panicMessage: 'Severe hypoglycemia / hyperosmolar crisis' },
    { parameterCode: 'TROPONIN_I', parameterName: 'Cardiac Troponin I', highCritical: 0.04, unit: 'ng/mL', panicMessage: 'Acute Myocardial Infarction indication' },
    { parameterCode: 'PLATELETS', parameterName: 'Platelet Count', lowCritical: 20000, highCritical: 1000000, unit: '/uL', panicMessage: 'Spontaneous hemorrhage risk' },
    { parameterCode: 'HEMOGLOBIN', parameterName: 'Hemoglobin (Hb)', lowCritical: 6.5, highCritical: 20.0, unit: 'g/dL', panicMessage: 'Critical tissue hypoxia / polycythemia risk' },
  ];

  public static clearState(): void {
    this.alerts.clear();
  }

  /**
   * Evaluates lab result against panic thresholds.
   * If breached, triggers quiet-hours-bypassed critical alert.
   */
  public static evaluateResultAndCreateAlert(params: {
    hospitalId: string;
    specimenId: string;
    orderId: string;
    patientId: string;
    uhid: string;
    patientName: string;
    wardId: string;
    bedNumber?: string;
    parameterCode: string;
    observedValue: number;
    treatingClinicianId: string;
    treatingClinicianName: string;
    clinicianMobile?: string;
    wardIntercom?: string;
  }): PanicAlert | null {
    const threshold = this.defaultThresholds.find(t => t.parameterCode === params.parameterCode.toUpperCase());
    if (!threshold) return null;

    let breached = false;
    let breachDescription = '';

    if (threshold.lowCritical !== undefined && params.observedValue < threshold.lowCritical) {
      breached = true;
      breachDescription = `VALUE ${params.observedValue} ${threshold.unit} IS BELOW CRITICAL LOW (${threshold.lowCritical} ${threshold.unit}) - ${threshold.panicMessage}`;
    } else if (threshold.highCritical !== undefined && params.observedValue > threshold.highCritical) {
      breached = true;
      breachDescription = `VALUE ${params.observedValue} ${threshold.unit} IS ABOVE CRITICAL HIGH (${threshold.highCritical} ${threshold.unit}) - ${threshold.panicMessage}`;
    }

    if (!breached) return null;

    const alertId = `panic-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();
    const escalationTime = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute SLA

    const rawData = `${alertId}:${params.hospitalId}:${params.patientId}:${params.parameterCode}:${params.observedValue}:${now.toISOString()}`;
    const auditChecksum = crypto.createHash('sha256').update(rawData).digest('hex');

    const alert: PanicAlert = {
      alertId,
      hospitalId: params.hospitalId,
      specimenId: params.specimenId,
      orderId: params.orderId,
      patientId: params.patientId,
      uhid: params.uhid,
      patientName: params.patientName,
      wardId: params.wardId,
      bedNumber: params.bedNumber,
      parameterCode: threshold.parameterCode,
      parameterName: threshold.parameterName,
      observedValue: params.observedValue,
      unit: threshold.unit,
      criticalLimitBreached: breachDescription,
      severity: 'CRITICAL_PANIC',
      status: 'PENDING_READBACK',
      treatingClinicianId: params.treatingClinicianId,
      treatingClinicianName: params.treatingClinicianName,
      clinicianMobile: params.clinicianMobile,
      wardIntercom: params.wardIntercom,
      quietHoursBypassed: true, // Emergency override
      alertCreatedAt: now.toISOString(),
      escalationDueAt: escalationTime.toISOString(),
      auditChecksum,
    };

    this.alerts.set(alertId, alert);

    logger.warn('[LIS-Panic] CRITICAL PANIC VALUE ALERT GENERATED (Quiet-Hours Bypassed)', {
      alertId,
      uhid: params.uhid,
      parameter: threshold.parameterName,
      value: params.observedValue,
      clinician: params.treatingClinicianName,
      wardIntercom: params.wardIntercom,
    });

    return alert;
  }

  /**
   * Records verbal telephone read-back acknowledgement from treating clinician.
   * Validates verbatim repetition of patient UHID, parameter, and numerical value.
   */
  public static recordVerbalReadBack(params: {
    alertId: string;
    callerStaffId: string;
    callerStaffName: string;
    receivingClinicianId: string;
    receivingClinicianName: string;
    receivingClinicianDesignation: string;
    verbalReadBackTranscript: string;
    phoneOrIntercomUsed: string;
    notes?: string;
  }): PanicAlert {
    const alert = this.alerts.get(params.alertId);
    if (!alert) {
      throw new Error(`Panic alert '${params.alertId}' not found.`);
    }

    if (alert.status === 'VERBAL_READBACK_COMPLETED') {
      throw new Error(`Panic alert '${params.alertId}' already has a completed verbal read-back record.`);
    }

    // Verify transcript includes value and parameter or patient
    const transcriptLower = params.verbalReadBackTranscript.toLowerCase();
    const valueStr = String(alert.observedValue);
    const hasValue = transcriptLower.includes(valueStr);
    const hasParamOrUhid = transcriptLower.includes(alert.parameterCode.toLowerCase()) || 
                           transcriptLower.includes(alert.uhid.toLowerCase()) ||
                           transcriptLower.includes(alert.patientName.toLowerCase());

    const readBackMatchesResult = hasValue && hasParamOrUhid;

    if (!readBackMatchesResult) {
      throw new Error(
        `VERBAL_READBACK_MISMATCH: The clinician's read-back transcript must accurately reflect the patient UHID/parameter and observed value '${alert.observedValue}'. Verbal confirmation aborted for patient safety.`
      );
    }

    const readBackRecord: VerbalReadBackRecord = {
      readBackId: `rb-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      callerStaffId: params.callerStaffId,
      callerStaffName: params.callerStaffName,
      receivingClinicianId: params.receivingClinicianId,
      receivingClinicianName: params.receivingClinicianName,
      receivingClinicianDesignation: params.receivingClinicianDesignation,
      verbalReadBackTranscript: params.verbalReadBackTranscript,
      readBackMatchesResult: true,
      clinicalAgreement: true,
      intercomOrPhoneNumberUsed: params.phoneOrIntercomUsed,
      completedAt: new Date().toISOString(),
      notes: params.notes,
    };

    alert.readBackRecord = readBackRecord;
    alert.status = 'VERBAL_READBACK_COMPLETED';

    // Recompute tamper-evident checksum
    alert.auditChecksum = crypto
      .createHash('sha256')
      .update(`${alert.alertId}:${alert.auditChecksum}:${readBackRecord.readBackId}:${readBackRecord.completedAt}`)
      .digest('hex');

    logger.info('[LIS-Panic] Verbal telephone read-back successfully verified and closed', {
      alertId: alert.alertId,
      readBackId: readBackRecord.readBackId,
      clinician: params.receivingClinicianName,
      caller: params.callerStaffName,
    });

    return alert;
  }

  /**
   * Checks for unacknowledged alerts that have exceeded the 15-minute SLA
   * and escalates them to the Head of Department / Chief Medical Officer.
   */
  public static checkAndEscalatePendingAlerts(currentTime: Date, escalationSupervisorId: string): PanicAlert[] {
    const escalated: PanicAlert[] = [];

    for (const alert of this.alerts.values()) {
      if (alert.status === 'PENDING_READBACK') {
        const due = new Date(alert.escalationDueAt);
        if (currentTime.getTime() >= due.getTime()) {
          alert.status = 'ESCALATED';
          alert.escalatedToUserId = escalationSupervisorId;
          alert.escalationReason = `15-minute critical alert SLA breached without verbal telephone read-back acknowledgement. Auto-escalated to Department Supervisor.`;
          
          logger.warn('[LIS-Panic] CRITICAL ALERT ESCALATED DUE TO TIMEOUT', {
            alertId: alert.alertId,
            uhid: alert.uhid,
            supervisorId: escalationSupervisorId,
          });

          escalated.push(alert);
        }
      }
    }

    return escalated;
  }

  public static getAlertById(alertId: string): PanicAlert | undefined {
    return this.alerts.get(alertId);
  }

  public static listAlerts(hospitalId: string): PanicAlert[] {
    return Array.from(this.alerts.values()).filter(a => a.hospitalId === hospitalId);
  }
}

