import { logger } from '../../utils/logger';
import { db } from '../../database';

export interface EmergencyEncounterInput {
  hospitalId: string;
  patientId?: string;
  patientName?: string;
  isUnknownIdentity?: boolean;
  arrivalMode?: 'WALK_IN' | 'AMBULANCE' | 'POLICE_BRING_IN' | 'HELICOPTER';
  presentingComplaint: string;
  isMedicoLegal?: boolean;
  branchId?: string;
}

export interface TriageAssessmentInput {
  hospitalId: string;
  encounterId: string;
  triagedByUserId: string;
  esiLevel?: number; // 1 to 5
  heartRate: number;
  systolicBp: number;
  diastolicBp: number;
  respiratoryRate: number;
  spo2Percent: number;
  gcsScore: number;
  temperatureCelsius?: number;
  painScore?: number;
  triageNotes?: string;
}

export interface TraumaActivationInput {
  hospitalId: string;
  encounterId: string;
  activationType: 'TRAUMA_TEAM_CODE_RED' | 'CODE_BLUE_CARDIAC_ARREST' | 'STROKE_CODE' | 'STEMI_CODE';
  teamLeaderId: string;
}

export interface ResuscitationChecklistInput {
  hospitalId: string;
  encounterId: string;
  airwayStatus: 'PATENT' | 'THREATENED' | 'INTUBATED_ETT';
  cSpineImmobilized?: boolean;
  breathingStatus: 'NORMAL' | 'TACHYPNEIC' | 'TENSION_PNEUMOTHORAX' | 'ASSISTED_VENTILATION';
  bilateralBreathSounds?: boolean;
  circulationPulse: 'PALPABLE' | 'WEAK_THREADY' | 'CARDIAC_ARREST';
  ivAccessGauge: string;
  disabilityGcs: number;
  pupilsReactive?: boolean;
  exposureHypothermiaPrevention?: boolean;
  fastScanPositive?: boolean;
  massiveTransfusionActivated?: boolean;
}

export interface StatOrderInput {
  hospitalId: string;
  encounterId: string;
  orderType: 'IMAGING_STAT' | 'LAB_STAT' | 'BLOOD_CROSSMATCH_STAT' | 'PHARMACY_STAT';
  orderDetails: string;
  orderedByUserId: string;
  clinicalOverrideReason?: string;
}

export interface MedicoLegalCaseInput {
  hospitalId: string;
  encounterId: string;
  incidentType: 'RTA_ROAD_TRAFFIC_ACCIDENT' | 'ASSAULT' | 'POISONING' | 'BURNS' | 'WORKPLACE_INJURY' | 'FIREARM' | 'OTHER';
  injuryDescription: string;
  policeStationName: string;
  policeIntimationNumber?: string;
  policeConstableName?: string;
}

export interface AmbulanceDispatchInput {
  hospitalId: string;
  ambulanceId: string;
  callerName: string;
  callerPhone: string;
  pickupLocation: string;
  patientName?: string;
}

export interface MobilePcrInput {
  hospitalId: string;
  tripId: string;
  paramedicUserId: string;
  chiefComplaint: string;
  initialVitals: {
    heartRate: number;
    bloodPressure: string;
    spo2Percent: number;
    gcs: number;
  };
  administeredPrehospitalDrugs?: Array<{ drug: string; dose: string; time: string }>;
}

export interface DispositionInput {
  hospitalId: string;
  encounterId: string;
  dispositionType: 'ICU_ADMISSION' | 'EMERGENCY_OT' | 'INPATIENT_WARD' | 'DISCHARGED' | 'LAMA_AGAINST_MEDICAL_ADVICE' | 'MORTUARY';
  authorizedByDoctorId: string;
  destinationUnit?: string;
  dischargeSummary?: string;
}

export class EmergencyAdvancedService {
  private encounters: Map<string, any> = new Map();
  private triageRecords: Map<string, any> = new Map();
  private traumaActivations: Map<string, any> = new Map();
  private resuscitationChecklists: Map<string, any> = new Map();
  private statOrders: Map<string, any[]> = new Map();
  private mlcCases: Map<string, any> = new Map();
  private ambulances: Map<string, any> = new Map();
  private trips: Map<string, any> = new Map();
  private pcrRecords: Map<string, any> = new Map();
  private observationBeds: Map<string, any> = new Map();
  private dispositions: Map<string, any> = new Map();

  // 1. Emergency Ingestion & Temporary Emergency UHID
  public async registerEmergencyEncounter(input: EmergencyEncounterInput): Promise<any> {
    const id = `ed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const encNumber = `ED-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let patientId = input.patientId;
    let tempUhid = undefined;
    if (input.isUnknownIdentity || !patientId) {
      tempUhid = `TEMP-UHID-ED-${Date.now().toString().slice(-6)}`;
      patientId = `unknown-${tempUhid}`;
    }

    const encounter = {
      id,
      encounterNumber: encNumber,
      hospitalId: input.hospitalId,
      patientId,
      patientName: input.patientName || (input.isUnknownIdentity ? `Unidentified Emergency Patient (${tempUhid})` : 'Registered Patient'),
      isUnknownIdentity: !!input.isUnknownIdentity,
      temporaryUhid: tempUhid,
      arrivalMode: input.arrivalMode || 'WALK_IN',
      presentingComplaint: input.presentingComplaint,
      isMedicoLegal: !!input.isMedicoLegal,
      status: 'TRIAGING',
      arrivalTimestamp: new Date().toISOString(),
    };

    this.encounters.set(id, encounter);

    try {
      await db.transaction(async (trx) => {
        await trx('ed_encounters').insert({
          id: encounter.id,
          hospital_id: encounter.hospitalId,
          patient_id: encounter.patientId,
          patient_name: encounter.patientName,
          is_unknown_identity: encounter.isUnknownIdentity,
          arrival_mode: encounter.arrivalMode,
          presenting_complaint: encounter.presentingComplaint,
          is_medico_legal: encounter.isMedicoLegal,
          status: encounter.status,
          created_at: encounter.arrivalTimestamp,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_encounters DB persistence fallback', { error: err.message });
    }

    logger.info('Emergency encounter registered', { encounterNumber: encNumber, isUnknown: encounter.isUnknownIdentity, tempUhid });
    return encounter;
  }

  // 2. ESI 5-Level Triage Engine
  public async performTriage(input: TriageAssessmentInput): Promise<any> {
    const encounter = this.encounters.get(input.encounterId);
    if (!encounter) throw new Error('Emergency encounter not found');

    let esi = input.esiLevel;
    let zone: 'RED_RESUS' | 'YELLOW_ACUTE' | 'GREEN_FAST_TRACK' = 'YELLOW_ACUTE';

    if (!esi) {
      if (input.gcsScore < 9 || input.spo2Percent < 85 || input.heartRate < 40 || input.heartRate > 140) {
        esi = 1;
        zone = 'RED_RESUS';
      } else if ((input.painScore && input.painScore >= 8) || input.spo2Percent < 92 || input.systolicBp < 90) {
        esi = 2;
        zone = 'YELLOW_ACUTE';
      } else if (input.respiratoryRate > 24 || (input.temperatureCelsius && input.temperatureCelsius > 39.0)) {
        esi = 3;
        zone = 'YELLOW_ACUTE';
      } else {
        esi = 4;
        zone = 'GREEN_FAST_TRACK';
      }
    } else {
      zone = esi === 1 ? 'RED_RESUS' : esi <= 3 ? 'YELLOW_ACUTE' : 'GREEN_FAST_TRACK';
    }

    const id = `triage-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      id,
      ...input,
      esiLevel: esi,
      assignedZone: zone,
      triagedAt: new Date().toISOString(),
    };

    this.triageRecords.set(input.encounterId, record);
    encounter.status = 'IN_ZONE';
    encounter.assignedZone = zone;
    encounter.esiLevel = esi;

    try {
      await db.transaction(async (trx) => {
        await trx('ed_triage_records').insert({
          id: record.id,
          hospital_id: record.hospitalId,
          encounter_id: record.encounterId,
          triaged_by_user_id: record.triagedByUserId,
          esi_level: record.esiLevel,
          heart_rate: record.heartRate,
          systolic_bp: record.systolicBp,
          diastolic_bp: record.diastolicBp,
          respiratory_rate: record.respiratoryRate,
          spo2_percent: record.spo2Percent,
          gcs_score: record.gcsScore,
          temperature_celsius: record.temperatureCelsius || null,
          pain_score: record.painScore || null,
          triage_notes: record.triageNotes || null,
          triaged_at: record.triagedAt,
        });

        await trx('ed_encounters').where({ id: input.encounterId }).update({
          triage_esi_level: record.esiLevel,
          status: 'IN_ZONE',
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_triage_records DB persistence fallback', { error: err.message });
    }

    logger.info('Patient triaged with ESI score', { encounterId: input.encounterId, esi, zone });
    return record;
  }

  // 3. Trauma Activation (Code Red / Code Blue)
  public async activateTraumaTeam(input: TraumaActivationInput): Promise<any> {
    const id = `code-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const activation = {
      id,
      ...input,
      activatedAt: new Date().toISOString(),
      responseTimeSeconds: 45,
      outcome: 'IN_PROGRESS',
    };
    this.traumaActivations.set(id, activation);

    try {
      await db.transaction(async (trx) => {
        await trx('ed_trauma_activations').insert({
          id: activation.id,
          hospital_id: activation.hospitalId,
          encounter_id: activation.encounterId,
          activation_type: activation.activationType,
          team_leader_id: activation.teamLeaderId,
          activated_at: activation.activatedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_trauma_activations DB persistence fallback', { error: err.message });
    }

    logger.error('EMERGENCY CODE BROADCAST ACTIVATED', { type: input.activationType, encounterId: input.encounterId });
    return activation;
  }

  // 4. ATLS Resuscitation Checklist
  public async recordResuscitationChecklist(input: ResuscitationChecklistInput): Promise<any> {
    const id = `atls-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const checklist = {
      id,
      ...input,
      cSpineImmobilized: input.cSpineImmobilized !== undefined ? input.cSpineImmobilized : true,
      bilateralBreathSounds: input.bilateralBreathSounds !== undefined ? input.bilateralBreathSounds : true,
      pupilsReactive: input.pupilsReactive !== undefined ? input.pupilsReactive : true,
      exposureHypothermiaPrevention: input.exposureHypothermiaPrevention !== undefined ? input.exposureHypothermiaPrevention : true,
      assessedAt: new Date().toISOString(),
    };
    this.resuscitationChecklists.set(input.encounterId, checklist);

    try {
      await db.transaction(async (trx) => {
        await trx('ed_resuscitation_checklists').insert({
          id: checklist.id,
          hospital_id: checklist.hospitalId,
          encounter_id: checklist.encounterId,
          airway_status: checklist.airwayStatus,
          c_spine_immobilized: checklist.cSpineImmobilized,
          breathing_status: checklist.breathingStatus,
          bilateral_breath_sounds: checklist.bilateralBreathSounds,
          circulation_pulse: checklist.circulationPulse,
          iv_access_gauge: checklist.ivAccessGauge,
          disability_gcs: checklist.disabilityGcs,
          pupils_reactive: checklist.pupilsReactive,
          exposure_hypothermia_prevention: checklist.exposureHypothermiaPrevention,
          completed_at: checklist.assessedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_resuscitation_checklists DB persistence fallback', { error: err.message });
    }

    logger.info('ATLS primary resuscitation checklist documented', { encounterId: input.encounterId });
    return checklist;
  }

  // 5. Emergency STAT Orders (Clinical Overrides Bypassing Cashier)
  public async placeStatEmergencyOrder(input: StatOrderInput): Promise<any> {
    const id = `stat-ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order = {
      id,
      ...input,
      isStatOverride: true,
      clinicalOverrideReason: input.clinicalOverrideReason || 'Emergency Life-Threatening Crisis - Cashier Clearance Bypassed',
      orderStatus: 'DISPATCHED_TO_DEPARTMENT',
      orderedAt: new Date().toISOString(),
    };

    const orders = this.statOrders.get(input.encounterId) || [];
    orders.push(order);
    this.statOrders.set(input.encounterId, orders);

    try {
      await db.transaction(async (trx) => {
        await trx('ed_stat_orders').insert({
          id: order.id,
          hospital_id: order.hospitalId,
          encounter_id: order.encounterId,
          order_type: order.orderType,
          order_details: order.orderDetails,
          ordered_by_user_id: order.orderedByUserId,
          clinical_override_reason: order.clinicalOverrideReason,
          order_status: order.orderStatus,
          ordered_at: order.orderedAt,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_stat_orders DB persistence fallback', { error: err.message });
    }

    logger.warn('STAT Emergency order dispatched with payment override', { type: input.orderType, encounterId: input.encounterId });
    return order;
  }

  // 6. Medico-Legal Case (MLC) Registration
  public async registerMedicoLegalCase(input: MedicoLegalCaseInput): Promise<any> {
    const mlcNumber = `MLC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = `mlc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mlc = {
      id,
      mlcNumber,
      ...input,
      intimationTimestamp: new Date().toISOString(),
    };
    this.mlcCases.set(input.encounterId, mlc);

    const enc = this.encounters.get(input.encounterId);
    if (enc) enc.isMedicoLegal = true;

    try {
      await db.transaction(async (trx) => {
        await trx('ed_medico_legal_cases').insert({
          id: mlc.id,
          hospital_id: mlc.hospitalId,
          encounter_id: mlc.encounterId,
          incident_type: mlc.incidentType,
          injury_description: mlc.injuryDescription,
          police_station_name: mlc.policeStationName,
          police_intimation_number: mlc.policeIntimationNumber || mlc.mlcNumber,
          police_constable_name: mlc.policeConstableName || null,
          intimation_timestamp: mlc.intimationTimestamp,
        });

        await trx('ed_encounters').where({ id: input.encounterId }).update({
          is_medico_legal: true,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_medico_legal_cases DB persistence fallback', { error: err.message });
    }

    logger.info('Medico-Legal Case (MLC) registered', { mlcNumber, incidentType: input.incidentType });
    return mlc;
  }

  // 7. Ambulance Fleet & Dispatch Management
  public async registerAmbulance(input: {
    hospitalId: string;
    vehicleNumber: string;
    ambulanceType: 'ALS_ADVANCED_LIFE_SUPPORT' | 'BLS_BASIC_LIFE_SUPPORT' | 'ICU_MOBILE' | 'NEONATAL';
    driverName: string;
    paramedicName: string;
  }): Promise<any> {
    const id = `amb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amb = {
      id,
      ...input,
      status: 'AVAILABLE',
      gpsLatitude: 18.5204,
      gpsLongitude: 73.8567,
      lastTelemetryTime: new Date().toISOString(),
    };
    this.ambulances.set(id, amb);

    try {
      await db.transaction(async (trx) => {
        await trx('ambulance_fleet').insert({
          id: amb.id,
          hospital_id: amb.hospitalId,
          vehicle_registration_number: amb.vehicleNumber,
          call_sign: amb.vehicleNumber,
          vehicle_type: amb.ambulanceType,
          current_status: amb.status,
          created_at: amb.lastTelemetryTime,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ambulance_fleet DB persistence fallback', { error: err.message });
    }

    return amb;
  }

  public async dispatchAmbulance(input: AmbulanceDispatchInput): Promise<any> {
    const amb = this.ambulances.get(input.ambulanceId);
    if (!amb) throw new Error('Ambulance not found in fleet');
    if (amb.status !== 'AVAILABLE') throw new Error(`Ambulance ${amb.vehicleNumber} is currently ${amb.status}`);

    const id = `trip-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tripNumber = `TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const trip = {
      id,
      tripNumber,
      ...input,
      status: 'DISPATCHED',
      callTimestamp: new Date().toISOString(),
      dispatchTimestamp: new Date().toISOString(),
    };

    amb.status = 'DISPATCHED';
    this.trips.set(id, trip);

    try {
      await db.transaction(async (trx) => {
        await trx('ambulance_trips').insert({
          id: trip.id,
          hospital_id: trip.hospitalId,
          ambulance_id: trip.ambulanceId,
          caller_name: trip.callerName,
          caller_phone: trip.callerPhone,
          pickup_location: trip.pickupLocation,
          patient_name: trip.patientName || null,
          trip_status: trip.status,
          dispatch_timestamp: trip.dispatchTimestamp,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ambulance_trips DB persistence fallback', { error: err.message });
    }

    logger.info('Ambulance dispatched on emergency 108/911 call', { tripNumber, vehicle: amb.vehicleNumber });
    return { trip, ambulance: amb };
  }

  // 8. Mobile Pre-Hospital Care Report (Mobile PCR)
  public async transmitMobilePcr(input: MobilePcrInput): Promise<any> {
    const trip = this.trips.get(input.tripId);
    if (!trip) throw new Error('Ambulance trip not found');

    const id = `pcr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const pcr = {
      id,
      ...input,
      transmissionToEdTimestamp: new Date().toISOString(),
    };
    this.pcrRecords.set(input.tripId, pcr);

    try {
      await db.transaction(async (trx) => {
        await trx('ambulance_pcr_records').insert({
          id: pcr.id,
          hospital_id: pcr.hospitalId,
          trip_id: pcr.tripId,
          paramedic_user_id: pcr.paramedicUserId,
          chief_complaint: pcr.chiefComplaint,
          initial_vitals: JSON.stringify(pcr.initialVitals),
          administered_prehospital_drugs: JSON.stringify(pcr.administeredPrehospitalDrugs || []),
          transmission_to_ed_timestamp: pcr.transmissionToEdTimestamp,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ambulance_pcr_records DB persistence fallback', { error: err.message });
    }

    logger.info('Pre-Hospital Care Report (PCR) synchronized with ED receiving room', { tripId: input.tripId });
    return pcr;
  }

  // 9. Observation Bed Allocation
  public async assignObservationBed(input: {
    hospitalId: string;
    encounterId: string;
    bedNumber: string;
    zone: 'RED' | 'YELLOW' | 'GREEN';
  }): Promise<any> {
    const id = `bed-ed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bed = {
      id,
      ...input,
      isOccupied: true,
      occupiedSince: new Date().toISOString(),
      maxHoldingHours: 6,
    };
    this.observationBeds.set(id, bed);

    const enc = this.encounters.get(input.encounterId);
    if (enc) enc.status = 'OBSERVING';

    try {
      await db.transaction(async (trx) => {
        await trx('ed_observation_beds').insert({
          id: bed.id,
          hospital_id: bed.hospitalId,
          encounter_id: bed.encounterId,
          bed_number: bed.bedNumber,
          zone: bed.zone,
          is_occupied: bed.isOccupied,
          occupied_since: bed.occupiedSince,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_observation_beds DB persistence fallback', { error: err.message });
    }

    return bed;
  }

  // 10. Emergency Final Disposition
  public async recordDisposition(input: DispositionInput): Promise<any> {
    const enc = this.encounters.get(input.encounterId);
    if (!enc) throw new Error('Emergency encounter not found');

    const id = `disp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const disposition = {
      id,
      ...input,
      dispositionTimestamp: new Date().toISOString(),
    };
    this.dispositions.set(input.encounterId, disposition);

    enc.status = input.dispositionType === 'DISCHARGED' ? 'DISCHARGED' : 'ADMITTED';

    try {
      await db.transaction(async (trx) => {
        await trx('ed_dispositions').insert({
          id: disposition.id,
          hospital_id: disposition.hospitalId,
          encounter_id: disposition.encounterId,
          disposition_type: disposition.dispositionType,
          authorized_by_doctor_id: disposition.authorizedByDoctorId,
          destination_unit: disposition.destinationUnit || null,
          discharge_summary: disposition.dischargeSummary || null,
          disposition_timestamp: disposition.dispositionTimestamp,
        });

        await trx('ed_encounters').where({ id: input.encounterId }).update({
          status: enc.status,
        });
      });
    } catch (err: any) {
      logger.warn('[EmergencyAdvancedService] ed_dispositions DB persistence fallback', { error: err.message });
    }

    logger.info('Emergency patient disposition finalized', { encounterId: input.encounterId, type: input.dispositionType });
    return disposition;
  }
}

export const emergencyAdvancedService = new EmergencyAdvancedService();
