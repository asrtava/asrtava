import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface TeleService {
  id: string;
  organizationId: string;
  hospitalId: string;
  serviceCode: string;
  name: string;
  consultationMode: 'VIDEO' | 'AUDIO' | 'CHAT' | 'HYBRID';
  durationMinutes: number;
  baseFee: number;
  followUpFee: number;
  gstRatePercent: number;
  cancellationFee: number;
  isActive: boolean;
  createdAt: string;
}

export interface TeleDoctorProfile {
  id: string;
  organizationId: string;
  hospitalId: string;
  doctorId: string;
  doctorName?: string;
  specialty?: string;
  isTeleconsultEnabled: boolean;
  supportedModes: string[];
  languagesSpoken: string[];
  teleconsultFee: number;
  maxDailyVirtualSlots: number;
  verifiedCredentialsSummary: string;
  createdAt: string;
}

export interface TeleAppointment {
  id: string;
  organizationId: string;
  hospitalId: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  serviceId?: string;
  consultationMode: 'VIDEO' | 'AUDIO' | 'CHAT' | 'HYBRID';
  scheduledDate: string;
  startTime: string;
  endTime: string;
  virtualRoomId: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'EXEMPT';
  paymentReference?: string;
  totalFee: number;
  chiefComplaint?: string;
  createdAt: string;
}

export interface TeleWaitingRoomEntry {
  id: string;
  teleAppointmentId: string;
  patientId: string;
  queuePosition: number;
  joinedWaitingRoomAt: string;
  doctorAdmittedAt?: string;
  deviceCheckPassed: boolean;
  connectionReadiness: 'TESTING' | 'READY' | 'POOR_NETWORK' | 'FAILED';
  status: 'WAITING' | 'DOCTOR_READY' | 'PATIENT_CONNECTED' | 'IN_CONSULTATION' | 'COMPLETED' | 'ABANDONED';
}

export interface TeleSession {
  id: string;
  teleAppointmentId: string;
  sessionToken: string;
  tokenExpiresAt: string;
  provider: string;
  mediaRoomId: string;
  isRecorded: boolean;
  recordingConsentGranted: boolean;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  terminationReason?: string;
}

export interface TeleConsent {
  id: string;
  organizationId: string;
  hospitalId: string;
  patientId: string;
  teleAppointmentId?: string;
  consentType: string;
  consentVersion: string;
  isGranted: boolean;
  signedByName: string;
  relationshipToPatient: string;
  digitalSignatureHash: string;
  ipAddress?: string;
  timestamp: string;
}

export interface TeleMessage {
  id: string;
  teleAppointmentId: string;
  senderId: string;
  senderRole: string;
  messageText: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  isRead: boolean;
  sentAt: string;
}

export interface TeleClinicalEncounter {
  id: string;
  organizationId: string;
  hospitalId: string;
  teleAppointmentId: string;
  patientId: string;
  doctorId: string;
  subjectiveNotes?: string;
  objectiveNotes?: string;
  assessmentNotes?: string;
  planNotes?: string;
  icd10Codes: string[];
  prescriptionId?: string;
  investigationOrderIds: string[];
  requiresInPersonFollowUp: boolean;
  referralType: 'NONE' | 'OPD_IN_PERSON' | 'EMERGENCY' | 'SPECIALIST' | 'INPATIENT_ADMISSION';
  referralNotes?: string;
  isSigned: boolean;
  signedAt?: string;
}

export interface RpmCarePlan {
  id: string;
  organizationId: string;
  hospitalId: string;
  patientId: string;
  managingDoctorId: string;
  planName: string;
  conditionCategory: 'HYPERTENSION' | 'DIABETES' | 'CARDIAC' | 'POST_OP' | 'COPD' | 'MATERNITY' | 'GENERAL_MONITORING';
  targetMetrics: string[];
  scheduleFrequency: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

export interface RpmThresholdRule {
  id: string;
  organizationId: string;
  hospitalId: string;
  conditionCategory: string;
  metricType: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  isActive: boolean;
}

export interface RpmMeasurement {
  id: string;
  organizationId: string;
  hospitalId: string;
  carePlanId?: string;
  patientId: string;
  metricType: 'SYSTOLIC_BP' | 'DIASTOLIC_BP' | 'BLOOD_GLUCOSE' | 'SPO2' | 'HEART_RATE' | 'TEMPERATURE' | 'WEIGHT';
  value: number;
  unit: string;
  secondaryValue?: number;
  dataSource: 'MANUAL_PATIENT' | 'VERIFIED_DEVICE' | 'MOBILE_BLUETOOTH' | 'CLINICAL_STAFF';
  deviceIdentifier?: string;
  recordedAt: string;
  alertSeverity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  isReviewed: boolean;
  reviewedByUserId?: string;
  reviewedAt?: string;
  clinicalComment?: string;
}

export interface RpmAlert {
  id: string;
  organizationId: string;
  hospitalId: string;
  measurementId: string;
  patientId: string;
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  alertMessage: string;
  status: 'UNACKNOWLEDGED' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  acknowledgedByUserId?: string;
  acknowledgedAt?: string;
  escalationAction?: string;
  createdAt: string;
}

export interface PatientEducationArticle {
  id: string;
  organizationId: string;
  hospitalId: string;
  title: string;
  category: string;
  language: string;
  summary: string;
  contentHtml: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  authorDoctorId?: string;
  publishedAt: string;
}

export class TelemedicineAdvancedService {
  private services: Map<string, TeleService> = new Map();
  private doctorProfiles: Map<string, TeleDoctorProfile> = new Map();
  private appointments: Map<string, TeleAppointment> = new Map();
  private waitingRoomEntries: Map<string, TeleWaitingRoomEntry> = new Map();
  private sessions: Map<string, TeleSession> = new Map();
  private consents: Map<string, TeleConsent> = new Map();
  private messages: Map<string, TeleMessage> = new Map();
  private clinicalEncounters: Map<string, TeleClinicalEncounter> = new Map();
  private carePlans: Map<string, RpmCarePlan> = new Map();
  private thresholdRules: Map<string, RpmThresholdRule> = new Map();
  private measurements: Map<string, RpmMeasurement> = new Map();
  private alerts: Map<string, RpmAlert> = new Map();
  private articles: Map<string, PatientEducationArticle> = new Map();

  private sessionSecretKey = process.env.JWT_SECRET || 'asrtava-telehealth-cryptographic-token-secret-2026';

  constructor() {
    this.seedDefaultThresholdRules();
  }

  private seedDefaultThresholdRules(): void {
    const defaultRules: Partial<RpmThresholdRule>[] = [
      {
        conditionCategory: 'HYPERTENSION',
        metricType: 'SYSTOLIC_BP',
        unit: 'mmHg',
        normalMin: 90,
        normalMax: 139,
        criticalLow: 80,
        criticalHigh: 180,
      },
      {
        conditionCategory: 'HYPERTENSION',
        metricType: 'DIASTOLIC_BP',
        unit: 'mmHg',
        normalMin: 60,
        normalMax: 89,
        criticalLow: 50,
        criticalHigh: 120,
      },
      {
        conditionCategory: 'DIABETES',
        metricType: 'BLOOD_GLUCOSE',
        unit: 'mg/dL',
        normalMin: 70,
        normalMax: 140,
        criticalLow: 55,
        criticalHigh: 300,
      },
      {
        conditionCategory: 'CARDIAC',
        metricType: 'SPO2',
        unit: '%',
        normalMin: 95,
        normalMax: 100,
        criticalLow: 90,
        criticalHigh: 100,
      },
      {
        conditionCategory: 'CARDIAC',
        metricType: 'HEART_RATE',
        unit: 'bpm',
        normalMin: 60,
        normalMax: 100,
        criticalLow: 45,
        criticalHigh: 130,
      },
    ];

    defaultRules.forEach((rule, idx) => {
      const id = `rule-seed-${idx + 1}`;
      this.thresholdRules.set(id, {
        id,
        organizationId: 'org-seed',
        hospitalId: 'hosp-seed',
        conditionCategory: rule.conditionCategory!,
        metricType: rule.metricType!,
        unit: rule.unit!,
        normalMin: rule.normalMin!,
        normalMax: rule.normalMax!,
        criticalLow: rule.criticalLow,
        criticalHigh: rule.criticalHigh,
        isActive: true,
      });
    });
  }

  // 1. Service Catalog Management
  public async createService(data: Omit<TeleService, 'id' | 'createdAt'>): Promise<TeleService> {
    const existing = Array.from(this.services.values()).find(
      (s) => s.hospitalId === data.hospitalId && s.serviceCode.toUpperCase() === data.serviceCode.toUpperCase()
    );
    if (existing) {
      throw new Error(`Telemedicine service code "${data.serviceCode}" already exists for this hospital.`);
    }

    const service: TeleService = {
      ...data,
      id: `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.services.set(service.id, service);

    logger.info('Telemedicine service configured', {
      serviceId: service.id,
      serviceCode: service.serviceCode,
      baseFee: service.baseFee,
    });
    return service;
  }

  public async getServices(hospitalId: string): Promise<TeleService[]> {
    return Array.from(this.services.values()).filter((s) => s.hospitalId === hospitalId && s.isActive);
  }

  // 2. Doctor Teleconsultation Profile
  public async registerDoctorProfile(data: Omit<TeleDoctorProfile, 'id' | 'createdAt'>): Promise<TeleDoctorProfile> {
    const existing = Array.from(this.doctorProfiles.values()).find(
      (d) => d.hospitalId === data.hospitalId && d.doctorId === data.doctorId
    );
    if (existing) {
      const updated: TeleDoctorProfile = { ...existing, ...data };
      this.doctorProfiles.set(existing.id, updated);
      return updated;
    }

    const profile: TeleDoctorProfile = {
      ...data,
      id: `docprof-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.doctorProfiles.set(profile.id, profile);

    logger.info('Doctor teleconsultation profile registered', {
      doctorId: profile.doctorId,
      teleconsultFee: profile.teleconsultFee,
    });
    return profile;
  }

  public async discoverAvailableDoctors(filter: {
    hospitalId: string;
    specialty?: string;
    language?: string;
    consultationMode?: string;
  }): Promise<TeleDoctorProfile[]> {
    let list = Array.from(this.doctorProfiles.values()).filter(
      (d) => d.hospitalId === filter.hospitalId && d.isTeleconsultEnabled
    );

    if (filter.specialty) {
      list = list.filter((d) => d.specialty?.toLowerCase().includes(filter.specialty!.toLowerCase()));
    }
    if (filter.language) {
      list = list.filter((d) =>
        d.languagesSpoken.some((l) => l.toLowerCase() === filter.language!.toLowerCase())
      );
    }
    if (filter.consultationMode) {
      list = list.filter((d) =>
        d.supportedModes.some((m) => m.toUpperCase() === filter.consultationMode!.toUpperCase())
      );
    }
    return list;
  }

  // 3. Online Appointment Booking with Anti-Collision
  public async bookTeleconsultation(data: {
    organizationId: string;
    hospitalId: string;
    patientId: string;
    doctorId: string;
    serviceId?: string;
    consultationMode: 'VIDEO' | 'AUDIO' | 'CHAT' | 'HYBRID';
    scheduledDate: string;
    startTime: string;
    endTime: string;
    chiefComplaint?: string;
    totalFee: number;
    paymentMode?: string;
  }): Promise<TeleAppointment> {
    // Check doctor schedule anti-collision
    const conflict = Array.from(this.appointments.values()).find(
      (a) =>
        a.hospitalId === data.hospitalId &&
        a.doctorId === data.doctorId &&
        a.scheduledDate === data.scheduledDate &&
        a.status !== 'CANCELLED' &&
        ((data.startTime >= a.startTime && data.startTime < a.endTime) ||
          (data.endTime > a.startTime && data.endTime <= a.endTime) ||
          (data.startTime <= a.startTime && data.endTime >= a.endTime))
    );

    if (conflict) {
      throw new Error(`Doctor is already booked for consultation between ${conflict.startTime} and ${conflict.endTime} on ${conflict.scheduledDate}.`);
    }

    const apptCount = Array.from(this.appointments.values()).filter(
      (a) => a.hospitalId === data.hospitalId
    ).length;
    const appointmentNumber = `TCON-${new Date().getFullYear()}-${String(apptCount + 1).padStart(5, '0')}`;
    const virtualRoomId = `room-${crypto.randomBytes(6).toString('hex')}`;

    const appointment: TeleAppointment = {
      id: `tapp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId: data.organizationId,
      hospitalId: data.hospitalId,
      appointmentNumber,
      patientId: data.patientId,
      doctorId: data.doctorId,
      serviceId: data.serviceId,
      consultationMode: data.consultationMode,
      scheduledDate: data.scheduledDate,
      startTime: data.startTime,
      endTime: data.endTime,
      virtualRoomId,
      status: 'SCHEDULED',
      paymentStatus: data.totalFee > 0 ? 'PENDING' : 'EXEMPT',
      totalFee: data.totalFee,
      chiefComplaint: data.chiefComplaint,
      createdAt: new Date().toISOString(),
    };
    this.appointments.set(appointment.id, appointment);

    logger.info('Teleconsultation appointment booked', {
      appointmentNumber,
      virtualRoomId,
      doctorId: data.doctorId,
      patientId: data.patientId,
      totalFee: data.totalFee,
    });
    return appointment;
  }

  // 4. Payment Verification & Confirmation
  public async verifyAndConfirmPayment(
    appointmentId: string,
    paymentReference: string,
    verifiedAmount: number
  ): Promise<TeleAppointment> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) throw new Error(`Teleconsultation appointment ${appointmentId} not found.`);

    if (appointment.paymentStatus === 'PAID') {
      throw new Error(`Payment already collected for appointment ${appointment.appointmentNumber}. Duplicate charge prevented.`);
    }

    if (Math.abs(verifiedAmount - appointment.totalFee) > 0.05) {
      throw new Error(`Payment verification failed: Expected ₹${appointment.totalFee}, received ₹${verifiedAmount}.`);
    }

    appointment.paymentStatus = 'PAID';
    appointment.paymentReference = paymentReference;
    appointment.status = 'CONFIRMED';
    this.appointments.set(appointmentId, appointment);

    logger.info('Teleconsultation payment verified and appointment confirmed', {
      appointmentNumber: appointment.appointmentNumber,
      paymentReference,
      amount: verifiedAmount,
    });
    return appointment;
  }

  // 5. Teleconsultation Informed Consent
  public async recordConsent(data: {
    organizationId: string;
    hospitalId: string;
    patientId: string;
    teleAppointmentId?: string;
    consentType: string;
    consentVersion: string;
    signedByName: string;
    relationshipToPatient: string;
    ipAddress?: string;
  }): Promise<TeleConsent> {
    const signatureHash = crypto
      .createHash('sha256')
      .update(`${data.patientId}|${data.consentType}|${data.consentVersion}|${Date.now()}`)
      .digest('hex');

    const consent: TeleConsent = {
      id: `cons-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId: data.organizationId,
      hospitalId: data.hospitalId,
      patientId: data.patientId,
      teleAppointmentId: data.teleAppointmentId,
      consentType: data.consentType,
      consentVersion: data.consentVersion,
      isGranted: true,
      signedByName: data.signedByName,
      relationshipToPatient: data.relationshipToPatient,
      digitalSignatureHash: signatureHash,
      ipAddress: data.ipAddress,
      timestamp: new Date().toISOString(),
    };
    this.consents.set(consent.id, consent);

    logger.info('Teleconsultation informed consent signed', {
      consentId: consent.id,
      patientId: consent.patientId,
      consentType: consent.consentType,
      signatureHash: signatureHash.substring(0, 16),
    });
    return consent;
  }

  // 6. Virtual Waiting Room State Engine
  public async joinWaitingRoom(
    appointmentId: string,
    patientId: string,
    deviceCheckPassed: boolean = true
  ): Promise<TeleWaitingRoomEntry> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) throw new Error(`Appointment ${appointmentId} not found.`);
    if (appointment.patientId !== patientId) {
      throw new Error('Access denied: Patient does not own this teleconsultation appointment.');
    }

    // Verify consent exists
    const hasConsent = Array.from(this.consents.values()).some(
      (c) => c.patientId === patientId && c.isGranted
    );
    if (!hasConsent) {
      throw new Error('Teleconsultation consent has not been signed. Complete consent before entering waiting room.');
    }

    const currentWaiting = Array.from(this.waitingRoomEntries.values()).filter(
      (w) => w.status === 'WAITING'
    );
    const queuePosition = currentWaiting.length + 1;

    const entry: TeleWaitingRoomEntry = {
      id: `wroom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      teleAppointmentId: appointmentId,
      patientId,
      queuePosition,
      joinedWaitingRoomAt: new Date().toISOString(),
      deviceCheckPassed,
      connectionReadiness: deviceCheckPassed ? 'READY' : 'POOR_NETWORK',
      status: 'WAITING',
    };
    this.waitingRoomEntries.set(entry.id, entry);

    appointment.status = 'WAITING';
    this.appointments.set(appointmentId, appointment);

    logger.info('Patient entered virtual waiting room', {
      appointmentNumber: appointment.appointmentNumber,
      queuePosition,
      connectionReadiness: entry.connectionReadiness,
    });
    return entry;
  }

  public async getWaitingRoomStatus(appointmentId: string): Promise<TeleWaitingRoomEntry | null> {
    return (
      Array.from(this.waitingRoomEntries.values()).find((w) => w.teleAppointmentId === appointmentId) ||
      null
    );
  }

  // 7. Secure Video & Audio Session Initialization (WebRTC)
  public async startConsultation(
    appointmentId: string,
    doctorId: string,
    provider: string = 'WEBRTC_INTERNAL'
  ): Promise<{ session: TeleSession; patientToken: string; doctorToken: string }> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) throw new Error(`Appointment ${appointmentId} not found.`);
    if (appointment.doctorId !== doctorId) {
      throw new Error('Access denied: Authenticated doctor is not assigned to this appointment.');
    }

    // Short-lived ephemeral tokens (HMAC-SHA256, 1 hour validity)
    const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const patientTokenPayload = `${appointment.id}:${appointment.patientId}:PATIENT:${tokenExpiresAt}`;
    const patientToken = crypto
      .createHmac('sha256', this.sessionSecretKey)
      .update(patientTokenPayload)
      .digest('hex');

    const doctorTokenPayload = `${appointment.id}:${doctorId}:DOCTOR:${tokenExpiresAt}`;
    const doctorToken = crypto
      .createHmac('sha256', this.sessionSecretKey)
      .update(doctorTokenPayload)
      .digest('hex');

    const session: TeleSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      teleAppointmentId: appointmentId,
      sessionToken: doctorToken,
      tokenExpiresAt,
      provider,
      mediaRoomId: appointment.virtualRoomId,
      isRecorded: false,
      recordingConsentGranted: false,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
    };
    this.sessions.set(session.id, session);

    // Update appointment and waiting room states
    appointment.status = 'IN_PROGRESS';
    this.appointments.set(appointmentId, appointment);

    const waitingEntry = Array.from(this.waitingRoomEntries.values()).find(
      (w) => w.teleAppointmentId === appointmentId
    );
    if (waitingEntry) {
      waitingEntry.status = 'IN_CONSULTATION';
      waitingEntry.doctorAdmittedAt = new Date().toISOString();
      this.waitingRoomEntries.set(waitingEntry.id, waitingEntry);
    }

    logger.info('Secure WebRTC teleconsultation started', {
      appointmentNumber: appointment.appointmentNumber,
      virtualRoomId: appointment.virtualRoomId,
      provider,
    });

    return { session, patientToken, doctorToken };
  }

  // 8. End Consultation Session
  public async endConsultation(
    appointmentId: string,
    durationSeconds: number,
    terminationReason: string = 'CLINICIAN_NORMAL_CLOSURE'
  ): Promise<TeleSession> {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) throw new Error(`Appointment ${appointmentId} not found.`);

    const session = Array.from(this.sessions.values()).find(
      (s) => s.teleAppointmentId === appointmentId
    );
    if (!session) throw new Error(`Active session for appointment ${appointmentId} not found.`);

    session.endedAt = new Date().toISOString();
    session.durationSeconds = durationSeconds;
    session.terminationReason = terminationReason;
    this.sessions.set(session.id, session);

    appointment.status = 'COMPLETED';
    this.appointments.set(appointmentId, appointment);

    const waitingEntry = Array.from(this.waitingRoomEntries.values()).find(
      (w) => w.teleAppointmentId === appointmentId
    );
    if (waitingEntry) {
      waitingEntry.status = 'COMPLETED';
      this.waitingRoomEntries.set(waitingEntry.id, waitingEntry);
    }

    logger.info('Teleconsultation concluded', {
      appointmentNumber: appointment.appointmentNumber,
      durationSeconds,
      terminationReason,
    });
    return session;
  }

  // 9. In-Session Secure Messaging
  public async sendInSessionMessage(data: {
    teleAppointmentId: string;
    senderId: string;
    senderRole: string;
    messageText: string;
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
  }): Promise<TeleMessage> {
    const msg: TeleMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      isRead: false,
      sentAt: new Date().toISOString(),
    };
    this.messages.set(msg.id, msg);
    return msg;
  }

  public async getMessages(teleAppointmentId: string): Promise<TeleMessage[]> {
    return Array.from(this.messages.values()).filter(
      (m) => m.teleAppointmentId === teleAppointmentId
    );
  }

  // 10. Clinical Documentation, e-Prescriptions & In-Person Referrals
  public async documentClinicalEncounter(data: {
    organizationId: string;
    hospitalId: string;
    teleAppointmentId: string;
    patientId: string;
    doctorId: string;
    subjectiveNotes?: string;
    objectiveNotes?: string;
    assessmentNotes?: string;
    planNotes?: string;
    icd10Codes?: string[];
    prescriptionItems?: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    investigationOrders?: string[];
    requiresInPersonFollowUp?: boolean;
    referralType?: 'NONE' | 'OPD_IN_PERSON' | 'EMERGENCY' | 'SPECIALIST' | 'INPATIENT_ADMISSION';
    referralNotes?: string;
  }): Promise<TeleClinicalEncounter> {
    const encounter: TeleClinicalEncounter = {
      id: `tenc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId: data.organizationId,
      hospitalId: data.hospitalId,
      teleAppointmentId: data.teleAppointmentId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      subjectiveNotes: data.subjectiveNotes,
      objectiveNotes: data.objectiveNotes,
      assessmentNotes: data.assessmentNotes,
      planNotes: data.planNotes,
      icd10Codes: data.icd10Codes || [],
      investigationOrderIds: data.investigationOrders || [],
      requiresInPersonFollowUp: data.requiresInPersonFollowUp || false,
      referralType: data.referralType || 'NONE',
      referralNotes: data.referralNotes,
      isSigned: true,
      signedAt: new Date().toISOString(),
    };

    if (data.prescriptionItems && data.prescriptionItems.length > 0) {
      encounter.prescriptionId = `rx-tele-${Date.now()}`;
    }

    this.clinicalEncounters.set(encounter.id, encounter);

    logger.info('Teleconsultation clinical encounter signed and recorded in EMR', {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      doctorId: encounter.doctorId,
      icd10Count: encounter.icd10Codes.length,
      prescriptionGenerated: !!encounter.prescriptionId,
      referralType: encounter.referralType,
    });
    return encounter;
  }

  // 11. Remote Patient Monitoring (RPM) Care Plans
  public async enrollCarePlan(data: Omit<RpmCarePlan, 'id'>): Promise<RpmCarePlan> {
    const plan: RpmCarePlan = {
      ...data,
      id: `rpmplan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'ACTIVE',
    };
    this.carePlans.set(plan.id, plan);

    logger.info('Patient enrolled in Remote Patient Monitoring (RPM) plan', {
      planId: plan.id,
      patientId: plan.patientId,
      conditionCategory: plan.conditionCategory,
    });
    return plan;
  }

  // 12. RPM Vital Sign Measurement Ingest & Threshold Evaluation
  public async recordRpmMeasurement(data: {
    organizationId: string;
    hospitalId: string;
    carePlanId?: string;
    patientId: string;
    metricType: 'SYSTOLIC_BP' | 'DIASTOLIC_BP' | 'BLOOD_GLUCOSE' | 'SPO2' | 'HEART_RATE' | 'TEMPERATURE' | 'WEIGHT';
    value: number;
    unit: string;
    secondaryValue?: number;
    dataSource: 'MANUAL_PATIENT' | 'VERIFIED_DEVICE' | 'MOBILE_BLUETOOTH' | 'CLINICAL_STAFF';
    deviceIdentifier?: string;
  }): Promise<{ measurement: RpmMeasurement; alert?: RpmAlert }> {
    // Evaluate thresholds
    let alertSeverity: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    let alertMessage = '';

    const rule = Array.from(this.thresholdRules.values()).find(
      (r) => r.metricType === data.metricType && r.isActive
    );

    if (rule) {
      if (
        (rule.criticalHigh && data.value >= rule.criticalHigh) ||
        (rule.criticalLow && data.value <= rule.criticalLow)
      ) {
        alertSeverity = 'CRITICAL';
        alertMessage = `CRITICAL ALERT: ${data.metricType} reading of ${data.value} ${data.unit} breached critical limits (${rule.criticalLow} - ${rule.criticalHigh}).`;
      } else if (data.value < rule.normalMin || data.value > rule.normalMax) {
        alertSeverity = 'WARNING';
        alertMessage = `WARNING: ${data.metricType} reading of ${data.value} ${data.unit} out of target range (${rule.normalMin} - ${rule.normalMax}).`;
      }
    }

    const measurement: RpmMeasurement = {
      id: `rpmmeas-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      recordedAt: new Date().toISOString(),
      alertSeverity,
      isReviewed: false,
    };
    this.measurements.set(measurement.id, measurement);

    let alert: RpmAlert | undefined;
    if (alertSeverity !== 'NORMAL') {
      alert = {
        id: `rpmalrt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        organizationId: data.organizationId,
        hospitalId: data.hospitalId,
        measurementId: measurement.id,
        patientId: data.patientId,
        severity: alertSeverity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        alertMessage,
        status: 'UNACKNOWLEDGED',
        createdAt: new Date().toISOString(),
      };
      this.alerts.set(alert.id, alert);

      logger.warn('RPM clinical threshold alert triggered', {
        alertId: alert.id,
        patientId: data.patientId,
        severity: alert.severity,
        message: alertMessage,
      });
    }

    return { measurement, alert };
  }

  // 13. RPM Alert Clinician Acknowledgement
  public async acknowledgeRpmAlert(
    alertId: string,
    clinicianUserId: string,
    escalationAction?: string
  ): Promise<RpmAlert> {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error(`RPM Alert ${alertId} not found.`);

    alert.status = escalationAction ? 'ESCALATED' : 'ACKNOWLEDGED';
    alert.acknowledgedByUserId = clinicianUserId;
    alert.acknowledgedAt = new Date().toISOString();
    alert.escalationAction = escalationAction;
    this.alerts.set(alertId, alert);

    logger.info('RPM alert acknowledged by clinician', {
      alertId,
      clinicianUserId,
      status: alert.status,
    });
    return alert;
  }

  // 14. Patient Education & Digital Guides
  public async publishEducationArticle(data: Omit<PatientEducationArticle, 'id' | 'publishedAt'>): Promise<PatientEducationArticle> {
    const article: PatientEducationArticle = {
      ...data,
      id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      publishedAt: new Date().toISOString(),
    };
    this.articles.set(article.id, article);

    logger.info('Patient education article published', {
      articleId: article.id,
      title: article.title,
      category: article.category,
    });
    return article;
  }

  public async getEducationArticles(hospitalId: string, category?: string): Promise<PatientEducationArticle[]> {
    let list = Array.from(this.articles.values()).filter(
      (a) => a.hospitalId === hospitalId && a.status === 'PUBLISHED'
    );
    if (category) {
      list = list.filter((a) => a.category.toUpperCase() === category.toUpperCase());
    }
    return list;
  }
}

export const telemedicineAdvancedService = new TelemedicineAdvancedService();
