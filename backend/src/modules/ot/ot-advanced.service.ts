import { logger } from '../../utils/logger';

export interface TheatreInput {
  hospitalId: string;
  theatreNumber: string;
  name: string;
  specialty?: string;
  isLaminarAirflow?: boolean;
  branchId?: string;
}

export interface SurgeryRequestInput {
  hospitalId: string;
  patientId: string;
  patientName?: string;
  requestingSurgeonId: string;
  proposedProcedure: string;
  preopDiagnosis: string;
  priority?: 'ELECTIVE' | 'URGENT' | 'STAT_EMERGENCY';
  estimatedDurationMins?: number;
  requestedDate: string;
}

export interface SurgeryScheduleInput {
  hospitalId: string;
  requestId?: string;
  theatreId: string;
  patientId: string;
  primarySurgeonId: string;
  assistantSurgeonId?: string;
  anaesthetistId: string;
  scrubNurseId?: string;
  circulatingNurseId?: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface PreopAssessmentInput {
  hospitalId: string;
  scheduleId: string;
  patientId: string;
  anaesthetistId: string;
  asaClass: 'ASA_I' | 'ASA_II' | 'ASA_III' | 'ASA_IV' | 'ASA_V' | 'ASA_VI' | 'ASA_E';
  mallampatiScore: 'I' | 'II' | 'III' | 'IV';
  fastingHoursSolid: number;
  fastingHoursClearFluids: number;
  airwayAssessment?: string;
  isClearedForSurgery?: boolean;
  rejectionReason?: string;
}

export interface SurgicalConsentInput {
  hospitalId: string;
  scheduleId: string;
  patientId: string;
  procedureName: string;
  risksDisclosed: string;
  witnessName: string;
  patientSigned?: boolean;
  guardianSigned?: boolean;
}

export interface WhoChecklistInput {
  hospitalId: string;
  scheduleId: string;
  phase: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';
  verifiedBy: string;
  details: Record<string, any>;
}

export interface SurgicalCountInput {
  hospitalId: string;
  scheduleId: string;
  countCategory: 'SPONGES_GAUZE' | 'SHARPS_NEEDLES' | 'SURGICAL_INSTRUMENTS';
  initialCount: number;
  intraopAddedCount?: number;
  closingCount: number;
  scrubNurseId: string;
  circulatingNurseId: string;
}

export interface AldreteScoreInput {
  hospitalId: string;
  pacuRecordId: string;
  activityScore: number;
  respirationScore: number;
  circulationScore: number;
  consciousnessScore: number;
  o2SaturationScore: number;
  evaluatedByUserId: string;
}

export class OTAdvancedService {
  private theatres: Map<string, any> = new Map();
  private surgeryRequests: Map<string, any> = new Map();
  private schedules: Map<string, any> = new Map();
  private preopAssessments: Map<string, any> = new Map();
  private consents: Map<string, any> = new Map();
  private whoChecklists: Map<string, any> = new Map();
  private anaesthesiaRecords: Map<string, any> = new Map();
  private intraopVitals: Map<string, any[]> = new Map();
  private surgicalCounts: Map<string, any[]> = new Map();
  private pacuRecords: Map<string, any> = new Map();
  private aldreteScores: Map<string, any[]> = new Map();

  // 1. Theatre Master
  public async registerTheatre(input: TheatreInput): Promise<any> {
    const id = `theatre-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const theatre = {
      id,
      ...input,
      specialty: input.specialty || 'GENERAL',
      isLaminarAirflow: input.isLaminarAirflow !== undefined ? input.isLaminarAirflow : true,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };
    this.theatres.set(id, theatre);
    logger.info('Operation Theatre registered', { theatreId: id, theatreNumber: input.theatreNumber });
    return theatre;
  }

  public async getTheatres(hospitalId: string): Promise<any[]> {
    return Array.from(this.theatres.values()).filter((t) => t.hospitalId === hospitalId);
  }

  // 2. Surgery Requests
  public async createSurgeryRequest(input: SurgeryRequestInput): Promise<any> {
    const id = `req-surg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const request = {
      id,
      ...input,
      priority: input.priority || 'ELECTIVE',
      estimatedDurationMins: input.estimatedDurationMins || 60,
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };
    this.surgeryRequests.set(id, request);
    logger.info('Surgery request submitted', { requestId: id, priority: request.priority });
    return request;
  }

  // 3. Multi-Resource Conflict-Free Scheduling (Room, Surgeon, Anaesthetist)
  public async scheduleSurgery(input: SurgeryScheduleInput): Promise<any> {
    const startNew = new Date(input.scheduledStart).getTime();
    const endNew = new Date(input.scheduledEnd).getTime();

    for (const s of this.schedules.values()) {
      if (s.hospitalId === input.hospitalId && s.status !== 'CANCELLED') {
        const startExisting = new Date(s.scheduledStart).getTime();
        const endExisting = new Date(s.scheduledEnd).getTime();
        const overlaps = Math.max(startNew, startExisting) < Math.min(endNew, endExisting);

        if (overlaps) {
          if (s.theatreId === input.theatreId) {
            throw new Error('OT_ROOM_COLLISION: Selected Operation Theatre is already booked for an overlapping surgery.');
          }
          if (s.primarySurgeonId === input.primarySurgeonId) {
            throw new Error('SURGEON_COLLISION: Primary surgeon is already scheduled for another surgery during this time block.');
          }
          if (s.anaesthetistId === input.anaesthetistId) {
            throw new Error('ANAESTHETIST_COLLISION: Consultant anaesthetist is already assigned to another theatre during this time.');
          }
        }
      }
    }

    const id = `sched-surg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const schedule = {
      id,
      ...input,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };
    this.schedules.set(id, schedule);
    logger.info('Surgery scheduled successfully', { scheduleId: id, theatreId: input.theatreId });
    return schedule;
  }

  // 4. Preoperative Assessment & PAC
  public async recordPreopAssessment(input: PreopAssessmentInput): Promise<any> {
    let isCleared = input.isClearedForSurgery !== undefined ? input.isClearedForSurgery : true;
    let rejectionReason = input.rejectionReason;

    // Strict fasting rule check: Solids minimum 6 hours
    if (input.fastingHoursSolid < 6) {
      isCleared = false;
      rejectionReason = `Inadequate NPO fasting: solid food fasting is ${input.fastingHoursSolid}h (minimum 6h required to prevent pulmonary aspiration).`;
    }

    const id = `pac-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const assessment = {
      id,
      ...input,
      isClearedForSurgery: isCleared,
      rejectionReason,
      assessedAt: new Date().toISOString(),
    };
    this.preopAssessments.set(id, assessment);
    logger.info('Pre-anaesthetic checkup (PAC) documented', { pacId: id, isCleared });
    return assessment;
  }

  // 5. Informed Surgical Consent
  public async recordSurgicalConsent(input: SurgicalConsentInput): Promise<any> {
    const id = `consent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const consentHash = `SHA256-CONSENT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const consent = {
      id,
      ...input,
      patientSigned: input.patientSigned !== undefined ? input.patientSigned : true,
      guardianSigned: input.guardianSigned || false,
      consentSignatureHash: consentHash,
      signedAt: new Date().toISOString(),
    };
    this.consents.set(id, consent);
    logger.info('Surgical informed consent recorded', { consentId: id, hash: consentHash });
    return consent;
  }

  // 6. Three-Phase WHO Surgical Safety Checklist
  public async recordWhoChecklistPhase(input: WhoChecklistInput): Promise<any> {
    let checklist = this.whoChecklists.get(input.scheduleId);
    if (!checklist) {
      checklist = {
        scheduleId: input.scheduleId,
        hospitalId: input.hospitalId,
        signInCompleted: false,
        timeOutCompleted: false,
        signOutCompleted: false,
      };
    }

    const now = new Date().toISOString();
    if (input.phase === 'SIGN_IN') {
      checklist.signInCompleted = true;
      checklist.signInTimestamp = now;
      checklist.signInVerifiedBy = input.verifiedBy;
      checklist.patientIdentityConfirmed = !!input.details.patientIdentityConfirmed;
      checklist.siteMarked = !!input.details.siteMarked;
      checklist.pulseOximeterOperating = !!input.details.pulseOximeterOperating;
      checklist.knownAllergyChecked = !!input.details.knownAllergyChecked;
      checklist.airwayAspirationRisk = !!input.details.airwayAspirationRisk;
      checklist.anticipatedBloodLossMl = input.details.anticipatedBloodLossMl || 0;
    } else if (input.phase === 'TIME_OUT') {
      if (!checklist.signInCompleted) {
        throw new Error('WHO_CHECKLIST_SEQUENCE_ERROR: Sign-In phase must be completed before Time-Out.');
      }
      checklist.timeOutCompleted = true;
      checklist.timeOutTimestamp = now;
      checklist.timeOutVerifiedBy = input.verifiedBy;
      checklist.teamMembersIntroduced = !!input.details.teamMembersIntroduced;
      checklist.antibioticGivenWithin60m = !!input.details.antibioticGivenWithin60m;
      checklist.imagingDisplayed = !!input.details.imagingDisplayed;
    } else if (input.phase === 'SIGN_OUT') {
      if (!checklist.timeOutCompleted) {
        throw new Error('WHO_CHECKLIST_SEQUENCE_ERROR: Time-Out phase must be completed before Sign-Out.');
      }
      checklist.signOutCompleted = true;
      checklist.signOutTimestamp = now;
      checklist.signOutVerifiedBy = input.verifiedBy;
      checklist.procedureNameRecorded = !!input.details.procedureNameRecorded;
      checklist.countsReconciled = !!input.details.countsReconciled;
      checklist.specimenLabeled = !!input.details.specimenLabeled;
    }

    this.whoChecklists.set(input.scheduleId, checklist);
    logger.info('WHO Surgical Safety Checklist phase recorded', { scheduleId: input.scheduleId, phase: input.phase });
    return checklist;
  }

  // 7. Anaesthesia Record & Intraoperative Vitals
  public async recordAnaesthesia(input: {
    hospitalId: string;
    scheduleId: string;
    anaesthetistId: string;
    anaesthesiaType: 'GENERAL' | 'SPINAL' | 'EPIDURAL' | 'REGIONAL' | 'LOCAL' | 'MAC';
    airwayType: 'ETT' | 'LMA' | 'MASK' | 'TRACHEOSTOMY' | 'NONE';
    inductionTimestamp?: string;
  }): Promise<any> {
    const id = `anaesth-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id,
      ...input,
      inductionTimestamp: input.inductionTimestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.anaesthesiaRecords.set(input.scheduleId, record);
    return record;
  }

  public async logIntraopVitals(input: {
    hospitalId: string;
    scheduleId: string;
    heartRate: number;
    systolicBp: number;
    diastolicBp: number;
    spo2Percent: number;
    etco2Mmhg?: number;
    temperatureCelsius?: number;
    administeredDrugs?: Array<{ drug: string; dose: string; time: string }>;
  }): Promise<any> {
    const log = {
      ...input,
      recordedAt: new Date().toISOString(),
    };
    const list = this.intraopVitals.get(input.scheduleId) || [];
    list.push(log);
    this.intraopVitals.set(input.scheduleId, list);
    return log;
  }

  // 8. Surgical Count Reconciliation (Sponges, Sharps, Instruments)
  public async reconcileSurgicalCount(input: SurgicalCountInput): Promise<any> {
    const expected = input.initialCount + (input.intraopAddedCount || 0);
    const isCorrect = expected === input.closingCount;
    const discrepancy = expected - input.closingCount;

    const id = `count-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id,
      ...input,
      intraopAddedCount: input.intraopAddedCount || 0,
      expectedCount: expected,
      isCountCorrect: isCorrect,
      discrepancyCount: discrepancy,
      verifiedAt: new Date().toISOString(),
    };

    if (!isCorrect) {
      logger.error('CRITICAL SURGICAL COUNT MISMATCH DETECTED', {
        scheduleId: input.scheduleId,
        category: input.countCategory,
        discrepancy,
      });
    }

    const list = this.surgicalCounts.get(input.scheduleId) || [];
    list.push(record);
    this.surgicalCounts.set(input.scheduleId, list);
    return record;
  }

  // 9. PACU Admission & Aldrete Recovery Scoring
  public async admitToPacu(input: {
    hospitalId: string;
    scheduleId: string;
    patientId: string;
    assignedNurseId: string;
  }): Promise<any> {
    const id = `pacu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id,
      ...input,
      admissionTimestamp: new Date().toISOString(),
      status: 'IN_RECOVERY',
    };
    this.pacuRecords.set(id, record);
    return record;
  }

  public async evaluateAldreteScore(input: AldreteScoreInput): Promise<any> {
    const pacu = this.pacuRecords.get(input.pacuRecordId);
    if (!pacu) throw new Error('PACU admission record not found');

    const total =
      input.activityScore +
      input.respirationScore +
      input.circulationScore +
      input.consciousnessScore +
      input.o2SaturationScore;

    const id = `aldrete-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const scoreRecord = {
      id,
      ...input,
      totalScore: total,
      evaluatedAt: new Date().toISOString(),
      isFitForDischarge: total >= 9,
    };

    const list = this.aldreteScores.get(input.pacuRecordId) || [];
    list.push(scoreRecord);
    this.aldreteScores.set(input.pacuRecordId, list);
    return scoreRecord;
  }

  public async dischargeFromPacu(input: {
    hospitalId: string;
    pacuRecordId: string;
    dischargeDestination: 'SURGICAL_WARD' | 'ICU' | 'HDU' | 'DAY_CARE_LOUNGE' | 'HOME';
    dischargePhysicianId: string;
  }): Promise<any> {
    const pacu = this.pacuRecords.get(input.pacuRecordId);
    if (!pacu) throw new Error('PACU admission record not found');

    const scores = this.aldreteScores.get(input.pacuRecordId) || [];
    const latestScore = scores[scores.length - 1];

    if (!latestScore || latestScore.totalScore < 9) {
      throw new Error(
        `PACU_DISCHARGE_BLOCKED: Patient Modified Aldrete Score is ${
          latestScore?.totalScore || 0
        }/10. Minimum score of 9 is strictly required for safe transfer to ward.`
      );
    }

    pacu.status = 'DISCHARGED';
    pacu.dischargeTimestamp = new Date().toISOString();
    pacu.dischargeDestination = input.dischargeDestination;
    pacu.dischargePhysicianId = input.dischargePhysicianId;
    logger.info('Patient safely discharged from PACU', { pacuRecordId: input.pacuRecordId, score: latestScore.totalScore });
    return pacu;
  }
}

export const otAdvancedService = new OTAdvancedService();

