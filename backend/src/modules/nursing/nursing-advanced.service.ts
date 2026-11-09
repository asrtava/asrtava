import { logger } from '../../utils/logger';

export interface PatientAssignmentInput {
  hospitalId: string;
  wardId: string;
  bedId: string;
  admissionId: string;
  patientId: string;
  nurseUserId: string;
  shiftId?: string;
  assignedByUserId: string;
  assignmentRole?: 'PRIMARY' | 'SECONDARY' | 'BUDDY' | 'SUPERVISOR';
  acuityLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface VitalSignsInput {
  hospitalId: string;
  admissionId: string;
  patientId: string;
  recordedByNurseId: string;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  respiratoryRate: number;
  temperatureCelsius: number;
  spo2Percent: number;
  isSupplementalO2?: boolean;
  o2FlowLitersMin?: number;
  painScore?: number;
  bloodGlucoseMgDl?: number;
  consciousnessLevel?: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
}

export interface AssessmentInput {
  hospitalId: string;
  admissionId: string;
  patientId: string;
  templateCode: 'BRADEN_SCALE' | 'MORSE_FALL' | 'GCS_NEURO' | 'MUST_NUTRITION' | 'PAIN_NRS';
  assessedByNurseId: string;
  assessmentData: Record<string, any>;
  clinicalFindings?: string;
  recommendedInterventions?: string[];
}

export interface EMARAdminInput {
  hospitalId: string;
  admissionId: string;
  patientId: string;
  prescriptionItemId?: string;
  drugId?: string;
  batchId?: string;
  scheduledTime: string;
  actualAdminTime?: string;
  administrationStatus: 'ADMINISTERED' | 'OMITTED' | 'REFUSED' | 'DELAYED' | 'HELD';
  omissionReason?: string;
  administeringNurseId: string;
  cosigningNurseId?: string;
  doseAdministered: string;
  routeUsed: string;
  siteOfAdministration?: string;
  isHighAlertOrNarcotic?: boolean;
  preAdminPulse?: number;
  preAdminBpSystolic?: number;
}

export interface SBARHandoverInput {
  hospitalId: string;
  wardId: string;
  shiftId?: string;
  outgoingNurseId: string;
  incomingNurseId: string;
  censusOccupiedBeds: number;
  censusVacantBeds: number;
  situationSummary: string;
  backgroundSummary: string;
  assessmentSummary: string;
  recommendationsSummary: string;
  criticalPatients?: any[];
  pendingTasks?: any[];
}

export interface SafetyIncidentInput {
  hospitalId: string;
  patientId?: string;
  admissionId?: string;
  wardId?: string;
  incidentCategory: 'PATIENT_FALL' | 'MEDICATION_INCIDENT' | 'NEAR_MISS' | 'ID_ERROR' | 'PRESSURE_INJURY_ACQUIRED' | 'EQUIPMENT_MALFUNCTION' | 'IV_EXTRAVASATION' | 'CLINICAL_DETERIORATION';
  severityIndex: 'CAT_A_NO_HARM' | 'CAT_B_NEAR_MISS' | 'CAT_C_MONITORING_REQUIRED' | 'CAT_D_TEMPORARY_HARM' | 'CAT_E_PERMANENT_HARM' | 'CAT_F_SENTINEL_EVENT';
  incidentTime: string;
  reportedByUserId: string;
  description: string;
  immediateActionsTaken: string;
  physicianNotifiedId?: string;
}

export class NursingAdvancedService {
  private assignments: Map<string, any> = new Map();
  private vitalsObservations: Map<string, any> = new Map();
  private observationAlerts: Map<string, any> = new Map();
  private assessments: Map<string, any> = new Map();
  private emarRecords: Map<string, any> = new Map();
  private doctorOrders: Map<string, any> = new Map();
  private carePlans: Map<string, any> = new Map();
  private fluidBalances: Map<string, any> = new Map();
  private woundAssessments: Map<string, any> = new Map();
  private bedsideTasks: Map<string, any> = new Map();
  private sbarHandovers: Map<string, any> = new Map();
  private icuFlowsheets: Map<string, any> = new Map();
  private safetyIncidents: Map<string, any> = new Map();
  private dischargeEducations: Map<string, any> = new Map();

  // =========================================================================
  // 1. PATIENT ASSIGNMENTS & WORKLOAD
  // =========================================================================
  public async assignNurseToPatient(input: PatientAssignmentInput): Promise<any> {
    const id = `assign-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const assignment = {
      id,
      ...input,
      assignmentRole: input.assignmentRole || 'PRIMARY',
      acuityLevel: input.acuityLevel || 'MODERATE',
      assignedAt: new Date().toISOString(),
      isActive: true,
    };
    this.assignments.set(id, assignment);
    logger.info('Patient assigned to nurse', { assignmentId: id, nurseId: input.nurseUserId, patientId: input.patientId });
    return assignment;
  }

  public async reassignPatient(assignmentId: string, newNurseId: string, reason: string): Promise<any> {
    const active = this.assignments.get(assignmentId);
    if (!active) throw new Error('Assignment not found');
    active.isActive = false;
    active.endedAt = new Date().toISOString();
    active.reassignmentReason = reason;

    const newAssignment = await this.assignNurseToPatient({
      hospitalId: active.hospitalId,
      wardId: active.wardId,
      bedId: active.bedId,
      admissionId: active.admissionId,
      patientId: active.patientId,
      nurseUserId: newNurseId,
      shiftId: active.shiftId,
      assignedByUserId: active.assignedByUserId,
      assignmentRole: active.assignmentRole,
      acuityLevel: active.acuityLevel,
    });
    return { previousAssignment: active, newAssignment };
  }

  public async getAssignedWorkload(hospitalId: string, nurseUserId: string): Promise<any> {
    const activeList = Array.from(this.assignments.values()).filter(
      (a) => a.hospitalId === hospitalId && a.nurseUserId === nurseUserId && a.isActive
    );
    const acuityWeights: Record<string, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 5 };
    const totalAcuityScore = activeList.reduce((acc, curr) => acc + (acuityWeights[curr.acuityLevel] || 2), 0);

    return {
      nurseUserId,
      assignedPatientCount: activeList.length,
      totalAcuityScore,
      assignments: activeList,
    };
  }

  // =========================================================================
  // 2. CLINICAL OBSERVATIONS & NEWS2 EARLY WARNING SYSTEM
  // =========================================================================
  public calculateNEWS2Score(v: VitalSignsInput): { score: number; risk: 'LOW' | 'MEDIUM' | 'HIGH'; individualScores: Record<string, number> } {
    let score = 0;
    const scores: Record<string, number> = {};

    // Respiratory Rate
    if (v.respiratoryRate <= 8) scores.rr = 3;
    else if (v.respiratoryRate >= 9 && v.respiratoryRate <= 11) scores.rr = 1;
    else if (v.respiratoryRate >= 12 && v.respiratoryRate <= 20) scores.rr = 0;
    else if (v.respiratoryRate >= 21 && v.respiratoryRate <= 24) scores.rr = 2;
    else scores.rr = 3;

    // SpO2 Scale 1
    if (v.spo2Percent <= 91) scores.spo2 = 3;
    else if (v.spo2Percent >= 92 && v.spo2Percent <= 93) scores.spo2 = 2;
    else if (v.spo2Percent >= 94 && v.spo2Percent <= 95) scores.spo2 = 1;
    else scores.spo2 = 0;

    // Supplemental Oxygen
    scores.o2 = v.isSupplementalO2 ? 2 : 0;

    // Systolic BP
    if (v.systolicBp <= 90) scores.sbp = 3;
    else if (v.systolicBp >= 91 && v.systolicBp <= 100) scores.sbp = 2;
    else if (v.systolicBp >= 101 && v.systolicBp <= 110) scores.sbp = 1;
    else if (v.systolicBp >= 111 && v.systolicBp <= 219) scores.sbp = 0;
    else scores.sbp = 3;

    // Heart Rate
    if (v.heartRate <= 40) scores.hr = 3;
    else if (v.heartRate >= 41 && v.heartRate <= 50) scores.hr = 1;
    else if (v.heartRate >= 51 && v.heartRate <= 90) scores.hr = 0;
    else if (v.heartRate >= 91 && v.heartRate <= 110) scores.hr = 1;
    else if (v.heartRate >= 111 && v.heartRate <= 130) scores.hr = 2;
    else scores.hr = 3;

    // Consciousness Level
    scores.consciousness = (v.consciousnessLevel && v.consciousnessLevel !== 'ALERT') ? 3 : 0;

    // Temperature Celsius
    if (v.temperatureCelsius <= 35.0) scores.temp = 3;
    else if (v.temperatureCelsius >= 35.1 && v.temperatureCelsius <= 36.0) scores.temp = 1;
    else if (v.temperatureCelsius >= 36.1 && v.temperatureCelsius <= 38.0) scores.temp = 0;
    else if (v.temperatureCelsius >= 38.1 && v.temperatureCelsius <= 39.0) scores.temp = 1;
    else scores.temp = 2;

    score = scores.rr + scores.spo2 + scores.o2 + scores.sbp + scores.hr + scores.consciousness + scores.temp;

    let risk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const hasSingleRed = Object.values(scores).some((s) => s === 3);

    if (score >= 7) risk = 'HIGH';
    else if (score >= 5 || hasSingleRed) risk = 'MEDIUM';
    else risk = 'LOW';

    return { score, risk, individualScores: scores };
  }

  public async recordVitalSigns(input: VitalSignsInput): Promise<any> {
    const { score, risk, individualScores } = this.calculateNEWS2Score(input);
    const id = `vital-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let monitoringFrequencyMinutes = 240; // 4 hours for Low
    if (risk === 'MEDIUM') monitoringFrequencyMinutes = 60; // 1 hour for Medium
    if (risk === 'HIGH') monitoringFrequencyMinutes = 15; // 15 mins for High

    const record = {
      id,
      ...input,
      news2Score: score,
      news2RiskCategory: risk,
      individualScores,
      monitoringFrequencyMinutes,
      recordedAt: new Date().toISOString(),
    };
    this.vitalsObservations.set(id, record);

    // If abnormal (MEDIUM or HIGH), trigger alert
    let alertRecord = null;
    if (risk !== 'LOW') {
      const alertId = `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      alertRecord = {
        id: alertId,
        hospitalId: input.hospitalId,
        observationId: id,
        admissionId: input.admissionId,
        patientId: input.patientId,
        alertSeverity: risk === 'HIGH' ? 'EMERGENCY_MET' : 'URGENT',
        triggerReason: `NEWS2 Score: ${score} (${risk} Clinical Deterioration Risk)`,
        deliveryStatus: 'DELIVERED',
        acknowledgedByUserId: null,
        acknowledgedAt: null,
        actionTakenNotes: null,
        createdAt: new Date().toISOString(),
      };
      this.observationAlerts.set(alertId, alertRecord);
      logger.warn('Vital observation alert triggered', { alertId, news2Score: score, risk });
    }

    return { vitalRecord: record, alert: alertRecord };
  }

  public async acknowledgeVitalAlert(alertId: string, acknowledgedByUserId: string, actionNotes: string): Promise<any> {
    const alert = this.observationAlerts.get(alertId);
    if (!alert) throw new Error('Observation alert not found');
    alert.acknowledgedByUserId = acknowledgedByUserId;
    alert.acknowledgedAt = new Date().toISOString();
    alert.actionTakenNotes = actionNotes;
    logger.info('Observation alert acknowledged', { alertId, acknowledgedByUserId });
    return alert;
  }

  // =========================================================================
  // 3. STRUCTURED NURSING ASSESSMENTS
  // =========================================================================
  public async recordStructuredAssessment(input: AssessmentInput): Promise<any> {
    const id = `assess-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    let calculatedScore = 0;
    let riskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL' = 'LOW';
    const recommendedInterventions: string[] = input.recommendedInterventions || [];

    if (input.templateCode === 'BRADEN_SCALE') {
      // Braden scale ranges from 6 to 23
      const { sensory = 4, moisture = 4, activity = 4, mobility = 4, nutrition = 4, friction = 3 } = input.assessmentData;
      calculatedScore = Number(sensory) + Number(moisture) + Number(activity) + Number(mobility) + Number(nutrition) + Number(friction);
      if (calculatedScore <= 9) {
        riskTier = 'VERY_HIGH';
        recommendedInterventions.push('Air loss alternating pressure mattress', 'Strict Q2H turning schedule', 'Barrier cream on pressure points');
      } else if (calculatedScore <= 12) {
        riskTier = 'HIGH';
        recommendedInterventions.push('Foam mattress overlay', 'Q2H turning schedule', 'Heel protector suspension boots');
      } else if (calculatedScore <= 14) {
        riskTier = 'MODERATE';
        recommendedInterventions.push('Active repositioning encouragement', 'Moisture barrier skin care');
      } else if (calculatedScore <= 18) {
        riskTier = 'LOW';
      } else {
        riskTier = 'LOW';
      }
    } else if (input.templateCode === 'MORSE_FALL') {
      // Morse Fall Scale ranges 0 to 125
      const { fallHistory = 0, secondaryDiagnosis = 0, ambulatoryAid = 0, ivTherapy = 0, gait = 0, mentalStatus = 0 } = input.assessmentData;
      calculatedScore = Number(fallHistory) + Number(secondaryDiagnosis) + Number(ambulatoryAid) + Number(ivTherapy) + Number(gait) + Number(mentalStatus);
      if (calculatedScore >= 45) {
        riskTier = 'HIGH';
        recommendedInterventions.push('Yellow fall-risk wristband', 'Bed rails elevated x 2', 'Nonslip socks', 'Bed alarm activated');
      } else if (calculatedScore >= 25) {
        riskTier = 'MODERATE';
        recommendedInterventions.push('Call light within reach', 'Assisted ambulation');
      } else {
        riskTier = 'LOW';
      }
    } else if (input.templateCode === 'GCS_NEURO') {
      const { eye = 4, verbal = 5, motor = 6 } = input.assessmentData;
      calculatedScore = Number(eye) + Number(verbal) + Number(motor);
      if (calculatedScore <= 8) riskTier = 'CRITICAL'; // Severe coma
      else if (calculatedScore <= 12) riskTier = 'MODERATE'; // Moderate injury
      else riskTier = 'LOW'; // Mild
    } else {
      calculatedScore = Number(input.assessmentData.score || 0);
      riskTier = calculatedScore > 5 ? 'MODERATE' : 'LOW';
    }

    const assessment = {
      id,
      ...input,
      calculatedScore,
      riskTier,
      recommendedInterventions,
      assessedAt: new Date().toISOString(),
    };
    this.assessments.set(id, assessment);
    logger.info('Nursing assessment recorded', { assessmentId: id, template: input.templateCode, score: calculatedScore, riskTier });
    return assessment;
  }

  // =========================================================================
  // 4. BEDSIDE eMAR MEDICATION ADMINISTRATION
  // =========================================================================
  public async administerMedicationEMAR(input: EMARAdminInput): Promise<any> {
    const id = `emar-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // High-alert or narcotic medication validation
    if (input.isHighAlertOrNarcotic && input.administrationStatus === 'ADMINISTERED') {
      if (!input.cosigningNurseId) {
        throw new Error('DUAL_COSIGN_REQUIRED: High-Alert / Narcotic medication requires second nurse cosign.');
      }
      if (input.cosigningNurseId === input.administeringNurseId) {
        throw new Error('CO_SIGN_IDENTITY_ERROR: Administering nurse and cosigning nurse must be distinct individuals.');
      }
    }

    // Pre-administration vital checks
    if (input.preAdminPulse && input.preAdminPulse < 60 && input.administrationStatus === 'ADMINISTERED') {
      // In clinical practice, negative chronotropes like Digoxin/Beta-blockers require explicit confirmation
      logger.warn('Pre-administration bradycardia flagged', { pulse: input.preAdminPulse });
    }

    // If omitted, refused, or held, omission reason is required
    if (['OMITTED', 'REFUSED', 'HELD'].includes(input.administrationStatus) && !input.omissionReason) {
      throw new Error('OMISSION_REASON_REQUIRED: A valid clinical or patient reason must be documented for non-administration.');
    }

    const record = {
      id,
      ...input,
      actualAdminTime: input.actualAdminTime || (input.administrationStatus === 'ADMINISTERED' ? new Date().toISOString() : null),
      createdAt: new Date().toISOString(),
    };
    this.emarRecords.set(id, record);
    logger.info('eMAR dose recorded', { emarId: id, status: input.administrationStatus, dose: input.doseAdministered });
    return record;
  }

  // =========================================================================
  // 5. DOCTOR ORDERS ACKNOWLEDGEMENT & EXECUTION
  // =========================================================================
  public async acknowledgeDoctorOrder(orderId: string, nurseId: string, notes?: string): Promise<any> {
    let order = this.doctorOrders.get(orderId);
    if (!order) {
      order = {
        id: orderId,
        executionStatus: 'PENDING',
      };
      this.doctorOrders.set(orderId, order);
    }
    order.acknowledgedByNurseId = nurseId;
    order.acknowledgedAt = new Date().toISOString();
    order.executionStatus = 'ACKNOWLEDGED';
    if (notes) order.executionNotes = notes;
    logger.info('Doctor order acknowledged by nurse', { orderId, nurseId });
    return order;
  }

  public async completeDoctorOrder(orderId: string, nurseId: string, completionNotes: string): Promise<any> {
    const order = this.doctorOrders.get(orderId);
    if (!order) throw new Error('Doctor order not found');
    order.executionStatus = 'COMPLETED';
    order.completedAt = new Date().toISOString();
    order.completedByNurseId = nurseId;
    order.executionNotes = completionNotes;
    logger.info('Doctor order executed and completed', { orderId, nurseId });
    return order;
  }

  // =========================================================================
  // 6. NURSING CARE PLANS
  // =========================================================================
  public async createCarePlan(input: {
    hospitalId: string;
    admissionId: string;
    patientId: string;
    nursingDiagnosis: string;
    relatedTo?: string;
    asEvidencedBy?: string;
    measurableGoals: string;
    plannedInterventions: string[];
    frequencyHours?: number;
    createdByNurseId: string;
    targetDate?: string;
  }): Promise<any> {
    const id = `careplan-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const plan = {
      id,
      ...input,
      frequencyHours: input.frequencyHours || 4,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.carePlans.set(id, plan);
    logger.info('Nursing care plan established', { carePlanId: id, diagnosis: input.nursingDiagnosis });
    return plan;
  }

  // =========================================================================
  // 7. FLUID INTAKE, OUTPUT & BALANCE
  // =========================================================================
  public async recordFluidBalance(input: {
    hospitalId: string;
    admissionId: string;
    patientId: string;
    recordedByNurseId: string;
    entryTime?: string;
    oralIntakeMl?: number;
    ivFluidIntakeMl?: number;
    enteralIntakeMl?: number;
    bloodProductsIntakeMl?: number;
    urineOutputMl?: number;
    surgicalDrainOutputMl?: number;
    vomitusOutputMl?: number;
    bloodLossOutputMl?: number;
    notes?: string;
  }): Promise<any> {
    const id = `fluid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const oral = Number(input.oralIntakeMl || 0);
    const iv = Number(input.ivFluidIntakeMl || 0);
    const enteral = Number(input.enteralIntakeMl || 0);
    const bloodIn = Number(input.bloodProductsIntakeMl || 0);

    const urine = Number(input.urineOutputMl || 0);
    const drain = Number(input.surgicalDrainOutputMl || 0);
    const vomit = Number(input.vomitusOutputMl || 0);
    const bloodOut = Number(input.bloodLossOutputMl || 0);

    const totalIntake = oral + iv + enteral + bloodIn;
    const totalOutput = urine + drain + vomit + bloodOut;
    const netBalance = totalIntake - totalOutput;

    const record = {
      id,
      ...input,
      entryTime: input.entryTime || new Date().toISOString(),
      totalIntakeMl: totalIntake,
      totalOutputMl: totalOutput,
      netBalanceMl: netBalance,
      createdAt: new Date().toISOString(),
    };
    this.fluidBalances.set(id, record);
    logger.info('Fluid intake/output recorded', { fluidId: id, netBalance });
    return record;
  }

  // =========================================================================
  // 8. WOUND CARE & DRESSING MANAGEMENT
  // =========================================================================
  public async recordWoundAssessment(input: {
    hospitalId: string;
    admissionId: string;
    patientId: string;
    assessedByNurseId: string;
    woundIdentifier: string;
    anatomicalLocation: string;
    woundStaging: string;
    lengthCm: number;
    widthCm: number;
    depthCm: number;
    exudateAmount?: string;
    exudateType?: string;
    granulationPercent?: number;
    sloughPercent?: number;
    escharPercent?: number;
    dressingTypeApplied: string;
    nextChangeDueHours?: number;
    healingStatus?: 'IMPROVING' | 'STATIC' | 'DETERIORATING';
    notes?: string;
  }): Promise<any> {
    const id = `wound-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const hours = input.nextChangeDueHours || 24;
    const nextChangeDue = new Date(Date.now() + hours * 3600000).toISOString();

    const record = {
      id,
      ...input,
      surfaceAreaSqCm: Number((input.lengthCm * input.widthCm).toFixed(2)),
      nextChangeDue,
      healingStatus: input.healingStatus || 'IMPROVING',
      recordedAt: new Date().toISOString(),
    };
    this.woundAssessments.set(id, record);
    logger.info('Wound assessment documented', { woundId: id, location: input.anatomicalLocation, stage: input.woundStaging });
    return record;
  }

  // =========================================================================
  // 9. BEDSIDE TASKS
  // =========================================================================
  public async createBedsideTask(input: {
    hospitalId: string;
    admissionId: string;
    patientId: string;
    taskCategory: string;
    taskDescription: string;
    priority?: 'ROUTINE' | 'URGENT' | 'STAT';
    dueTime: string;
    assignedNurseId?: string;
  }): Promise<any> {
    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const task = {
      id,
      ...input,
      priority: input.priority || 'ROUTINE',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.bedsideTasks.set(id, task);
    return task;
  }

  public async completeBedsideTask(taskId: string, completedByNurseId: string, notes?: string): Promise<any> {
    const task = this.bedsideTasks.get(taskId);
    if (!task) throw new Error('Bedside task not found');
    task.status = 'COMPLETED';
    task.completedByNurseId = completedByNurseId;
    task.completedAt = new Date().toISOString();
    task.completionNotes = notes || null;
    return task;
  }

  // =========================================================================
  // 10. SBAR SHIFT HANDOVER
  // =========================================================================
  public async submitSBARHandover(input: SBARHandoverInput): Promise<any> {
    const id = `sbar-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const handover = {
      id,
      ...input,
      outgoingSignedAt: new Date().toISOString(),
      incomingAcknowledgedAt: null,
      status: 'SUBMITTED',
    };
    this.sbarHandovers.set(id, handover);
    logger.info('SBAR shift handover submitted', { handoverId: id, wardId: input.wardId });
    return handover;
  }

  public async acknowledgeSBARHandover(handoverId: string, incomingNurseId: string): Promise<any> {
    const handover = this.sbarHandovers.get(handoverId);
    if (!handover) throw new Error('SBAR handover record not found');
    if (handover.incomingNurseId !== incomingNurseId) {
      throw new Error('RECIPIENT_MISMATCH: Only the designated incoming nurse can acknowledge this handover.');
    }
    handover.incomingAcknowledgedAt = new Date().toISOString();
    handover.status = 'ACKNOWLEDGED_SIGNED';
    logger.info('SBAR shift handover acknowledged and signed', { handoverId, incomingNurseId });
    return handover;
  }

  // =========================================================================
  // 11. ICU FLOWSHEET TELEMETRY
  // =========================================================================
  public async recordICUFlowsheet(input: {
    hospitalId: string;
    admissionId: string;
    recordedByNurseId: string;
    ventilatorMode?: string;
    fio2Percent?: number;
    peepCmh2o?: number;
    tidalVolumeMl?: number;
    arterialLineBp?: string;
    cvpMmhg?: number;
    inotropeInfusions?: any[];
    sedationInfusions?: any[];
    pupilRightSizeMm?: number;
    pupilRightReaction?: string;
    pupilLeftSizeMm?: number;
    pupilLeftReaction?: string;
    gcsEye?: number;
    gcsVerbal?: number;
    gcsMotor?: number;
  }): Promise<any> {
    const id = `icu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const totalGcs = Number(input.gcsEye || 0) + Number(input.gcsVerbal || 0) + Number(input.gcsMotor || 0);

    const record = {
      id,
      ...input,
      totalGcs,
      recordedAt: new Date().toISOString(),
    };
    this.icuFlowsheets.set(id, record);
    logger.info('ICU flowsheet telemetry recorded', { icuId: id, ventilatorMode: input.ventilatorMode, totalGcs });
    return record;
  }

  // =========================================================================
  // 12. PATIENT SAFETY INCIDENT REPORTING
  // =========================================================================
  public async reportSafetyIncident(input: SafetyIncidentInput): Promise<any> {
    const id = `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const incidentNumber = `INC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const incident = {
      id,
      incidentNumber,
      ...input,
      investigationStatus: 'LOGGED',
      isImmutable: true,
      createdAt: new Date().toISOString(),
    };
    this.safetyIncidents.set(id, incident);
    logger.warn('Patient safety incident reported', { incidentNumber, category: input.incidentCategory, severity: input.severityIndex });
    return incident;
  }

  // =========================================================================
  // 13. DISCHARGE EDUCATION
  // =========================================================================
  public async recordDischargeEducation(input: {
    hospitalId: string;
    admissionId: string;
    patientId: string;
    educatedByNurseId: string;
    topicsCovered: string[];
    patientUnderstandingVerified: boolean;
    caregiverName?: string;
    caregiverRelationship?: string;
    followUpInstructions: string;
    emergencyContactGiven: string;
  }): Promise<any> {
    const id = `disch-edu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id,
      ...input,
      completedAt: new Date().toISOString(),
    };
    this.dischargeEducations.set(id, record);
    logger.info('Patient discharge education completed', { educationId: id, patientId: input.patientId });
    return record;
  }
}

export const nursingAdvancedService = new NursingAdvancedService();

