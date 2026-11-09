import { logger } from '../../utils/logger';

export interface ModalityInput {
  hospitalId: string;
  modalityCode: string;
  modalityType: 'CT' | 'MR' | 'XR' | 'US' | 'MG' | 'FL' | 'NM' | 'DX';
  name: string;
  aeTitle: string;
  ipAddress: string;
  portNumber?: number;
  locationRoom: string;
}

export interface ProcedureInput {
  hospitalId: string;
  procedureCode: string;
  procedureName: string;
  modalityType: 'CT' | 'MR' | 'XR' | 'US' | 'MG' | 'FL' | 'NM' | 'DX';
  bodyRegion: string;
  contrastRequirement?: 'NONE' | 'IV_IODINATED' | 'IV_GADOLINIUM' | 'ORAL' | 'RECTAL';
  expectedDurationMins?: number;
  preparationInstructions?: string;
}

export interface ImagingOrderInput {
  hospitalId: string;
  patientId: string;
  orderingDoctorId: string;
  procedureId: string;
  priority?: 'ROUTINE' | 'URGENT' | 'STAT';
  clinicalIndication: string;
  relevantDiagnosis?: string;
  requiresContrast?: boolean;
}

export interface AppointmentInput {
  hospitalId: string;
  orderId: string;
  modalityId: string;
  scheduledStart: string;
  scheduledEnd: string;
  radiographerUserId?: string;
}

export interface ScreeningInput {
  hospitalId: string;
  appointmentId: string;
  patientId: string;
  egfrValue?: number;
  isContrastAllergyHistory?: boolean;
  isPacemakerOrFerrousImplant?: boolean;
  isPregnant?: boolean;
  fastingHoursCompleted?: number;
  screeningNotes?: string;
  screenedByUserId: string;
}

export interface ReportInput {
  hospitalId: string;
  studyId: string;
  reportingRadiologistId: string;
  techniqueNotes: string;
  comparisonNotes?: string;
  findings: string;
  impression: string;
  recommendations?: string;
  isCriticalFinding?: boolean;
  criticalCondition?: string;
}

export class RISAdvancedService {
  private modalities: Map<string, any> = new Map();
  private procedures: Map<string, any> = new Map();
  private orders: Map<string, any> = new Map();
  private appointments: Map<string, any> = new Map();
  private screenings: Map<string, any> = new Map();
  private pacsStudies: Map<string, any> = new Map();
  private reports: Map<string, any> = new Map();
  private criticalFindings: Map<string, any> = new Map();
  private contrastAdministrations: Map<string, any> = new Map();

  // 1. Modality & Procedure Master
  public async registerModality(input: ModalityInput): Promise<any> {
    const id = `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mod = {
      id,
      ...input,
      portNumber: input.portNumber || 104,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.modalities.set(id, mod);
    logger.info('Radiology Modality Registered', { modalityId: id, aeTitle: input.aeTitle });
    return mod;
  }

  public async registerProcedure(input: ProcedureInput): Promise<any> {
    const id = `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const proc = {
      id,
      ...input,
      contrastRequirement: input.contrastRequirement || 'NONE',
      expectedDurationMins: input.expectedDurationMins || 30,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.procedures.set(id, proc);
    return proc;
  }

  // 2. Imaging Order Management
  public async createImagingOrder(input: ImagingOrderInput): Promise<any> {
    const id = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const orderNumber = `RAD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const order = {
      id,
      orderNumber,
      ...input,
      priority: input.priority || 'ROUTINE',
      requiresContrast: input.requiresContrast || false,
      orderStatus: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    this.orders.set(id, order);
    logger.info('Radiology Imaging Order Placed', { orderNumber, priority: order.priority });
    return order;
  }

  // 3. Modality Appointment Scheduling with Conflict Detection
  public async scheduleAppointment(input: AppointmentInput): Promise<any> {
    const startNew = new Date(input.scheduledStart).getTime();
    const endNew = new Date(input.scheduledEnd).getTime();

    // Check anti-collision on same modality station
    for (const appt of this.appointments.values()) {
      if (appt.hospitalId === input.hospitalId && appt.modalityId === input.modalityId && appt.appointmentStatus !== 'CANCELLED') {
        const startExisting = new Date(appt.scheduledStart).getTime();
        const endExisting = new Date(appt.scheduledEnd).getTime();

        const overlaps = Math.max(startNew, startExisting) < Math.min(endNew, endExisting);
        if (overlaps) {
          throw new Error('MODALITY_SCHEDULE_COLLISION: Selected time slot overlaps with an existing scan appointment on this equipment.');
        }
      }
    }

    const id = `appt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appointment = {
      id,
      ...input,
      appointmentStatus: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };
    this.appointments.set(id, appointment);
    logger.info('Modality appointment scheduled', { apptId: id, modalityId: input.modalityId });
    return appointment;
  }

  // 4. Pre-Imaging Patient Screening
  public async recordPatientScreening(input: ScreeningInput): Promise<any> {
    let clearedForScan = true;
    let clearanceStatus: 'CLEARED' | 'REQUIRES_NEPHROLOGY_CLEARANCE' | 'CONTRAINDICATED' = 'CLEARED';
    const reasons: string[] = [];

    if (input.isPacemakerOrFerrousImplant) {
      clearedForScan = false;
      clearanceStatus = 'CONTRAINDICATED';
      reasons.push('Ferrous Pacemaker / Implant contraindicated for high-field MRI');
    }
    if (input.egfrValue !== undefined && input.egfrValue < 30) {
      clearedForScan = false;
      clearanceStatus = 'REQUIRES_NEPHROLOGY_CLEARANCE';
      reasons.push('eGFR < 30 mL/min/1.73m2: High risk of Contrast-Induced Nephropathy');
    }
    if (input.isPregnant) {
      clearedForScan = false;
      clearanceStatus = 'CONTRAINDICATED';
      reasons.push('Fetal radiation hazard: Non-emergent ionizing radiation contraindicated in pregnancy');
    }

    const id = `screen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const screening = {
      id,
      screeningId: id,
      ...input,
      clearedForScan,
      clearanceStatus,
      warnings: reasons,
      contraindicationReasons: reasons,
      screenedAt: new Date().toISOString(),
    };
    this.screenings.set(id, screening);
    logger.info('Patient pre-imaging screening documented', { screeningId: id, clearedForScan, clearanceStatus });
    return screening;
  }

  // 5. PACS Study Indexing
  public async indexPACSStudy(input: {
    hospitalId: string;
    studyInstanceUid: string;
    accessionNumber: string;
    patientId: string;
    orderId?: string;
    studyDate: string;
    studyTime: string;
    studyDescription: string;
    modality: string;
    totalSeries?: number;
    totalInstances?: number;
    storageUri: string;
  }): Promise<any> {
    const id = `study-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const study = {
      id,
      ...input,
      totalSeries: input.totalSeries || 1,
      totalInstances: input.totalInstances || 1,
      createdAt: new Date().toISOString(),
    };
    this.pacsStudies.set(id, study);
    logger.info('PACS Study Indexed', { studyUid: input.studyInstanceUid, accession: input.accessionNumber });
    return study;
  }

  // 6. Structured Radiology Reporting
  public async createRadiologyReport(input: ReportInput): Promise<any> {
    const id = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const report = {
      id,
      ...input,
      reportStatus: 'DRAFT',
      isAmended: false,
      createdAt: new Date().toISOString(),
    };
    this.reports.set(id, report);

    let criticalAlert = null;
    if (input.isCriticalFinding && input.criticalCondition) {
      const alertId = `crit-rad-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      criticalAlert = {
        id: alertId,
        hospitalId: input.hospitalId,
        reportId: id,
        criticalCondition: input.criticalCondition,
        notificationChannel: 'TELEPHONE_READ_BACK',
        notifiedAt: new Date().toISOString(),
        readBackConfirmed: false,
      };
      this.criticalFindings.set(alertId, criticalAlert);
      logger.error('CRITICAL RADIOLOGY FINDING DETECTED', { condition: input.criticalCondition, reportId: id });
    }

    return { report, criticalAlert };
  }

  public async authorizeReport(reportId: string, radiologistId: string): Promise<any> {
    const rep = this.reports.get(reportId);
    if (!rep) throw new Error('Radiology report not found');
    rep.reportStatus = 'AUTHORIZED';
    rep.reportingRadiologistId = radiologistId;
    rep.authorizedAt = new Date().toISOString();
    rep.digitalSignatureHash = `SHA256-RAD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    logger.info('Radiology report authorized with digital seal', { reportId, radiologistId });
    return rep;
  }

  public async updateRadiologyReportContent(input: {
    hospitalId: string;
    reportId: string;
    findings?: string;
    impression?: string;
  }): Promise<any> {
    const rep = this.reports.get(input.reportId);
    if (!rep) throw new Error('Radiology report not found');
    if (rep.reportStatus === 'AUTHORIZED' || rep.reportStatus === 'FINALIZED') {
      throw new Error('IMMUTABLE_REPORT_LOCK: Authorized radiology reports cannot be overwritten directly. Use amendReport() to attach a signed legal addendum.');
    }
    if (input.findings) rep.findings = input.findings;
    if (input.impression) rep.impression = input.impression;
    return rep;
  }

  public async amendReport(reportId: string, radiologistId: string, addendumNotes: string): Promise<any> {
    const rep = this.reports.get(reportId);
    if (!rep) throw new Error('Radiology report not found');
    rep.isAmended = true;
    rep.reportStatus = 'AMENDED';
    rep.amendmentReason = addendumNotes;
    rep.authorizedAt = new Date().toISOString();
    logger.warn('Radiology report addendum filed', { reportId, radiologistId });
    return rep;
  }

  // 7. Modality Worklist (MWL) & DICOM Series
  public async queryModalityWorklist(query: { hospitalId: string; modalityAeTitle?: string; scheduledDate?: string }): Promise<any[]> {
    const results: any[] = [];
    for (const appt of this.appointments.values()) {
      if (appt.hospitalId === query.hospitalId && appt.appointmentStatus === 'SCHEDULED') {
        const mod = this.modalities.get(appt.modalityId);
        if (!query.modalityAeTitle || (mod && mod.aeTitle === query.modalityAeTitle)) {
          results.push({
            appointmentId: appt.id,
            orderId: appt.orderId,
            modalityId: appt.modalityId,
            scheduledStationAETitle: mod?.aeTitle || 'GENERIC_AE',
            scheduledStart: appt.scheduledStart,
            scheduledEnd: appt.scheduledEnd,
            patientId: appt.patientId || 'pat-demo',
          });
        }
      }
    }
    return results;
  }

  public async recordSeriesAndInstances(input: {
    hospitalId: string;
    studyId: string;
    seriesInstanceUid: string;
    seriesNumber: number;
    seriesDescription: string;
    bodyPartExamined: string;
    sliceThicknessMm: number;
    windowCenter: number;
    windowWidth: number;
    numberOfInstances: number;
  }): Promise<any> {
    const id = `series-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const series = {
      id,
      ...input,
      createdAt: new Date().toISOString(),
    };
    return series;
  }

  public async confirmCriticalFindingReadBack(alertId: string, verifiedBy: string): Promise<any> {
    const alert = this.criticalFindings.get(alertId);
    if (!alert) throw new Error('Critical finding alert not found');
    alert.readBackConfirmed = true;
    alert.readBackVerifiedBy = verifiedBy;
    alert.confirmedAt = new Date().toISOString();
    return alert;
  }

  // 7. Contrast Administration Log
  public async recordContrastAdministration(input: {
    hospitalId: string;
    appointmentId: string;
    contrastName: string;
    batchLotNumber: string;
    volumeAdministeredMl: number;
    flowRateMlSec?: number;
    injectionSite: string;
    administeredByUserId: string;
    adverseReactionObserved?: boolean;
    adverseReactionNotes?: string;
  }): Promise<any> {
    const id = `contrast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id,
      ...input,
      flowRateMlSec: input.flowRateMlSec || 2.0,
      adverseReactionObserved: input.adverseReactionObserved || false,
      administeredAt: new Date().toISOString(),
    };
    this.contrastAdministrations.set(id, record);
    logger.info('Contrast media injection documented', { contrast: input.contrastName, volume: input.volumeAdministeredMl });
    return record;
  }
}

export const risAdvancedService = new RISAdvancedService();
