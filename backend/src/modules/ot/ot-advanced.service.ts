import { logger } from '../../utils/logger';
import { db } from '../../database';

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_theatres').insert({
          id: theatre.id,
          hospital_id: theatre.hospitalId,
          theatre_number: theatre.theatreNumber,
          name: theatre.name,
          specialty: theatre.specialty,
          is_laminar_airflow: theatre.isLaminarAirflow,
          status: theatre.status,
          branch_id: theatre.branchId || null,
          created_at: theatre.createdAt,
          updated_at: theatre.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_theatres DB persistence fallback to memory', { error: err.message });
    }

    logger.info('Operation Theatre registered', { theatreId: id, theatreNumber: input.theatreNumber });
    return theatre;
  }

  public async getTheatres(hospitalId: string): Promise<any[]> {
    try {
      const rows = await db('ot_theatres').where({ hospital_id: hospitalId });
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          hospitalId: r.hospital_id,
          theatreNumber: r.theatre_number,
          name: r.name,
          specialty: r.specialty,
          isLaminarAirflow: r.is_laminar_airflow,
          status: r.status,
          branchId: r.branch_id,
          createdAt: r.created_at,
        }));
      }
    } catch {}
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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_surgery_requests').insert({
          id: request.id,
          hospital_id: request.hospitalId,
          patient_id: request.patientId,
          requesting_surgeon_id: request.requestingSurgeonId,
          proposed_procedure: request.proposedProcedure,
          preop_diagnosis: request.preopDiagnosis,
          priority: request.priority,
          estimated_duration_mins: request.estimatedDurationMins,
          requested_date: request.requestedDate,
          status: request.status,
          created_at: request.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_surgery_requests DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_schedules').insert({
          id: schedule.id,
          hospital_id: schedule.hospitalId,
          request_id: schedule.requestId || null,
          theatre_id: schedule.theatreId,
          patient_id: schedule.patientId,
          primary_surgeon_id: schedule.primarySurgeonId,
          assistant_surgeon_id: schedule.assistantSurgeonId || null,
          anaesthetist_id: schedule.anaesthetistId,
          scrub_nurse_id: schedule.scrubNurseId || null,
          circulating_nurse_id: schedule.circulatingNurseId || null,
          scheduled_start: schedule.scheduledStart,
          scheduled_end: schedule.scheduledEnd,
          status: schedule.status,
          created_at: schedule.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_schedules DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_preop_assessments').insert({
          id: assessment.id,
          hospital_id: assessment.hospitalId,
          schedule_id: assessment.scheduleId,
          patient_id: assessment.patientId,
          anaesthetist_id: assessment.anaesthetistId,
          asa_class: assessment.asaClass,
          mallampati_score: assessment.mallampatiScore,
          fasting_hours_solid: assessment.fastingHoursSolid,
          fasting_hours_clear_fluids: assessment.fastingHoursClearFluids,
          airway_assessment: assessment.airwayAssessment || null,
          is_cleared_for_surgery: assessment.isClearedForSurgery,
          rejection_reason: assessment.rejectionReason || null,
          assessed_at: assessment.assessedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_preop_assessments DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_surgical_consents').insert({
          id: consent.id,
          hospital_id: consent.hospitalId,
          schedule_id: consent.scheduleId,
          patient_id: consent.patientId,
          procedure_name: consent.procedureName,
          risks_disclosed: consent.risksDisclosed,
          patient_signed: consent.patientSigned,
          guardian_signed: consent.guardianSigned,
          witness_name: consent.witnessName,
          consent_signature_hash: consent.consentSignatureHash,
          signed_at: consent.signedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_surgical_consents DB persistence fallback to memory', { error: err.message });
    }

    logger.info('Surgical informed consent recorded', { consentId: id, hash: consentHash });
    return consent;
  }

  // 6. Three-Phase WHO Surgical Safety Checklist
  public async recordWhoChecklistPhase(input: WhoChecklistInput): Promise<any> {
    let checklist = this.whoChecklists.get(input.scheduleId);
    if (!checklist) {
      checklist = {
        id: `who-${input.scheduleId}`,
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

    try {
      await db.transaction(async (trx) => {
        const existing = await trx('ot_who_checklists').where({ schedule_id: input.scheduleId }).first();
        if (existing) {
          await trx('ot_who_checklists').where({ schedule_id: input.scheduleId }).update({
            sign_in_completed: checklist.signInCompleted,
            sign_in_timestamp: checklist.signInTimestamp || null,
            sign_in_verified_by: checklist.signInVerifiedBy || null,
            patient_identity_confirmed: checklist.patientIdentityConfirmed || false,
            site_marked: checklist.siteMarked || false,
            pulse_oximeter_operating: checklist.pulseOximeterOperating || false,
            known_allergy_checked: checklist.knownAllergyChecked || false,
            airway_aspiration_risk: checklist.airwayAspirationRisk || false,
            anticipated_blood_loss_ml: checklist.anticipatedBloodLossMl || 0,
            time_out_completed: checklist.timeOutCompleted,
            time_out_timestamp: checklist.timeOutTimestamp || null,
            time_out_verified_by: checklist.timeOutVerifiedBy || null,
            team_members_introduced: checklist.teamMembersIntroduced || false,
            antibiotic_given_within_60m: checklist.antibioticGivenWithin60m || false,
            imaging_displayed: checklist.imagingDisplayed || false,
            sign_out_completed: checklist.signOutCompleted,
            sign_out_timestamp: checklist.signOutTimestamp || null,
            sign_out_verified_by: checklist.signOutVerifiedBy || null,
            procedure_name_recorded: checklist.procedureNameRecorded || false,
            counts_reconciled: checklist.countsReconciled || false,
            specimen_labeled: checklist.specimenLabeled || false,
          });
        } else {
          await trx('ot_who_checklists').insert({
            id: checklist.id || `who-${input.scheduleId}`,
            hospital_id: checklist.hospitalId,
            schedule_id: checklist.scheduleId,
            sign_in_completed: checklist.signInCompleted,
            sign_in_timestamp: checklist.signInTimestamp || null,
            sign_in_verified_by: checklist.signInVerifiedBy || null,
            patient_identity_confirmed: checklist.patientIdentityConfirmed || false,
            site_marked: checklist.siteMarked || false,
            pulse_oximeter_operating: checklist.pulseOximeterOperating || false,
            known_allergy_checked: checklist.knownAllergyChecked || false,
            airway_aspiration_risk: checklist.airwayAspirationRisk || false,
            anticipated_blood_loss_ml: checklist.anticipatedBloodLossMl || 0,
            time_out_completed: checklist.timeOutCompleted,
            time_out_timestamp: checklist.timeOutTimestamp || null,
            time_out_verified_by: checklist.timeOutVerifiedBy || null,
            team_members_introduced: checklist.teamMembersIntroduced || false,
            antibiotic_given_within_60m: checklist.antibioticGivenWithin60m || false,
            imaging_displayed: checklist.imagingDisplayed || false,
            sign_out_completed: checklist.signOutCompleted,
            sign_out_timestamp: checklist.signOutTimestamp || null,
            sign_out_verified_by: checklist.signOutVerifiedBy || null,
            procedure_name_recorded: checklist.procedureNameRecorded || false,
            counts_reconciled: checklist.countsReconciled || false,
            specimen_labeled: checklist.specimenLabeled || false,
            created_at: now,
          });
        }
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_who_checklists DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_anaesthesia_records').insert({
          id: record.id,
          hospital_id: record.hospitalId,
          schedule_id: record.scheduleId,
          anaesthetist_id: record.anaesthetistId,
          anaesthesia_type: record.anaesthesiaType,
          airway_type: record.airwayType,
          induction_timestamp: record.inductionTimestamp,
          created_at: record.createdAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_anaesthesia_records DB persistence fallback to memory', { error: err.message });
    }

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
      id: `vit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...input,
      recordedAt: new Date().toISOString(),
    };
    const list = this.intraopVitals.get(input.scheduleId) || [];
    list.push(log);
    this.intraopVitals.set(input.scheduleId, list);

    try {
      await db.transaction(async (trx) => {
        await trx('ot_intraop_vitals').insert({
          id: log.id,
          hospital_id: log.hospitalId,
          schedule_id: log.scheduleId,
          recorded_at: log.recordedAt,
          heart_rate: log.heartRate,
          systolic_bp: log.systolicBp,
          diastolic_bp: log.diastolicBp,
          spo2_percent: log.spo2Percent,
          etco2_mmhg: log.etco2Mmhg || null,
          temperature_celsius: log.temperatureCelsius || null,
          administered_drugs: JSON.stringify(log.administeredDrugs || []),
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_intraop_vitals DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_surgical_counts').insert({
          id: record.id,
          hospital_id: record.hospitalId,
          schedule_id: record.scheduleId,
          count_category: record.countCategory,
          initial_count: record.initialCount,
          intraop_added_count: record.intraopAddedCount,
          closing_count: record.closingCount,
          is_count_correct: record.isCountCorrect,
          scrub_nurse_id: record.scrubNurseId,
          circulating_nurse_id: record.circulatingNurseId,
          verified_at: record.verifiedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_surgical_counts DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_pacu_records').insert({
          id: record.id,
          hospital_id: record.hospitalId,
          schedule_id: record.scheduleId,
          patient_id: record.patientId,
          admission_timestamp: record.admissionTimestamp,
          assigned_nurse_id: record.assignedNurseId,
          status: record.status,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_pacu_records DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_aldrete_scores').insert({
          id: scoreRecord.id,
          hospital_id: scoreRecord.hospitalId,
          pacu_record_id: scoreRecord.pacuRecordId,
          evaluated_at: scoreRecord.evaluatedAt,
          activity_score: scoreRecord.activityScore,
          respiration_score: scoreRecord.respirationScore,
          circulation_score: scoreRecord.circulationScore,
          consciousness_score: scoreRecord.consciousnessScore,
          o2_saturation_score: scoreRecord.o2SaturationScore,
          total_score: scoreRecord.totalScore,
          is_fit_for_discharge: scoreRecord.isFitForDischarge,
          evaluated_by_user_id: scoreRecord.evaluatedByUserId,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_aldrete_scores DB persistence fallback to memory', { error: err.message });
    }

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

    try {
      await db.transaction(async (trx) => {
        await trx('ot_pacu_records').where({ id: input.pacuRecordId }).update({
          status: 'DISCHARGED',
          discharge_timestamp: pacu.dischargeTimestamp,
          discharge_destination: pacu.dischargeDestination,
          discharge_physician_id: pacu.dischargePhysicianId,
        });
      });
    } catch (err: any) {
      logger.warn('[OTAdvancedService] ot_pacu_records update fallback to memory', { error: err.message });
    }

    logger.info('Patient safely discharged from PACU', { pacuRecordId: input.pacuRecordId, score: latestScore.totalScore });
    return pacu;
  }
}

export const otAdvancedService = new OTAdvancedService();
