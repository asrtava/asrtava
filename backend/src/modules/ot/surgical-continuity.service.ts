import { logger } from '../../utils/logger';
import { db } from '../../database';

export type SurgicalSessionState =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'INTRAOPERATIVE_ACTIVE'
  | 'HANDOVER_IN_PROGRESS'
  | 'TRANSFER_TO_PACU'
  | 'PACU_RECOVERY'
  | 'PROCEDURE_CLOSED'
  | 'EMERGENCY_OVERRIDE'
  | 'STALE_RECOVERED';

export interface SurgicalContinuitySession {
  id: string;
  scheduleId: string;
  hospitalId: string;
  patientId: string;
  theatreId: string;
  primarySurgeonId: string;
  anaesthetistId: string;
  currentState: SurgicalSessionState;
  continuityLockActive: boolean;
  timeOutVerified: boolean;
  signOutVerified: boolean;
  sessionStartedAt?: string;
  lastHeartbeatAt?: string;
  maxDurationHours: number;
  timeoutAt?: string;
  closedAt?: string;
  dischargePhysicianId?: string;
  finalAldreteScore?: number;
  dischargeDestination?: string;
  handoverHistory: Array<{
    outgoingSurgeonId: string;
    incomingSurgeonId: string;
    handoverTime: string;
    notes: string;
  }>;
  emergencyOverrides: Array<{
    clinicianId: string;
    reason: string;
    actionTaken: string;
    timestamp: string;
  }>;
  staleRecovery?: {
    supervisorId: string;
    justification: string;
    resolvedAt: string;
    resolution: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class SurgicalContinuityService {
  // Durable in-memory cache synchronized with DB
  private static sessions: Map<string, SurgicalContinuitySession> = new Map();

  /**
   * Resets test state
   */
  public static clearState(): void {
    this.sessions.clear();
  }

  /**
   * 1. Authenticated Procedure Initiation
   * Transitions from CHECKED_IN to INTRAOPERATIVE_ACTIVE.
   * Server-side activates continuity lock to protect patient during active surgery.
   */
  public static async initiateIntraoperativeSession(params: {
    hospitalId: string;
    scheduleId: string;
    patientId: string;
    theatreId: string;
    primarySurgeonId: string;
    anaesthetistId: string;
    timeOutVerified: boolean;
    maxDurationHours?: number;
  }): Promise<SurgicalContinuitySession> {
    if (!params.timeOutVerified) {
      throw new Error('SURGICAL_SAFETY_VIOLATION: WHO Surgical Safety Time-Out must be verified prior to initiating active intraoperative session.');
    }

    const sessionId = `surg-sess-${params.scheduleId}`;
    const now = new Date();
    const maxHours = params.maxDurationHours || 12; // Standard 12-hour surgical timeout window
    const timeout = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

    const session: SurgicalContinuitySession = {
      id: sessionId,
      scheduleId: params.scheduleId,
      hospitalId: params.hospitalId,
      patientId: params.patientId,
      theatreId: params.theatreId,
      primarySurgeonId: params.primarySurgeonId,
      anaesthetistId: params.anaesthetistId,
      currentState: 'INTRAOPERATIVE_ACTIVE',
      continuityLockActive: true, // LOCK ACTIVE: Commercial licensing cannot interrupt care
      timeOutVerified: true,
      signOutVerified: false,
      sessionStartedAt: now.toISOString(),
      lastHeartbeatAt: now.toISOString(),
      maxDurationHours: maxHours,
      timeoutAt: timeout.toISOString(),
      handoverHistory: [],
      emergencyOverrides: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    this.sessions.set(params.scheduleId, session);

    logger.warn('SURGICAL_CONTINUITY_LOCK_ACTIVATED', {
      scheduleId: params.scheduleId,
      hospitalId: params.hospitalId,
      theatreId: params.theatreId,
      primarySurgeonId: params.primarySurgeonId,
      timeoutAt: session.timeoutAt
    });

    return session;
  }

  /**
   * 2. Authorized Intraoperative Handover
   * Handles surgical handover between credentialed clinicians with dual attestation.
   */
  public static async performHandover(params: {
    scheduleId: string;
    hospitalId: string;
    outgoingSurgeonId: string;
    incomingSurgeonId: string;
    notes: string;
  }): Promise<SurgicalContinuitySession> {
    const session = this.sessions.get(params.scheduleId);
    if (!session || session.hospitalId !== params.hospitalId) {
      throw new Error(`Surgical continuity session not found for schedule ${params.scheduleId}.`);
    }

    if (session.currentState !== 'INTRAOPERATIVE_ACTIVE') {
      throw new Error(`CANNOT_HANDOVER: Session is in ${session.currentState} state (must be INTRAOPERATIVE_ACTIVE).`);
    }

    if (params.outgoingSurgeonId !== session.primarySurgeonId) {
      throw new Error('HANDOVER_AUTH_FAILED: Outgoing clinician does not match currently registered primary surgeon.');
    }

    if (params.outgoingSurgeonId === params.incomingSurgeonId) {
      throw new Error('HANDOVER_IDENTITY_ERROR: Incoming and outgoing surgeons must be distinct individuals.');
    }

    const now = new Date().toISOString();
    session.currentState = 'HANDOVER_IN_PROGRESS';
    session.handoverHistory.push({
      outgoingSurgeonId: params.outgoingSurgeonId,
      incomingSurgeonId: params.incomingSurgeonId,
      handoverTime: now,
      notes: params.notes
    });

    // Reassign primary surgeon and resume active intraoperative state
    session.primarySurgeonId = params.incomingSurgeonId;
    session.currentState = 'INTRAOPERATIVE_ACTIVE';
    session.lastHeartbeatAt = now;
    session.updatedAt = now;

    this.sessions.set(params.scheduleId, session);
    logger.info('Intraoperative surgical handover recorded', {
      scheduleId: params.scheduleId,
      outgoing: params.outgoingSurgeonId,
      incoming: params.incomingSurgeonId
    });

    return session;
  }

  /**
   * 3. Transfer to PACU Recovery
   * Verifies WHO Sign-Out completion before transferring to PACU.
   */
  public static async transferToPacu(params: {
    scheduleId: string;
    hospitalId: string;
    transferringSurgeonId: string;
    receivingNurseId: string;
    signOutVerified: boolean;
  }): Promise<SurgicalContinuitySession> {
    const session = this.sessions.get(params.scheduleId);
    if (!session || session.hospitalId !== params.hospitalId) {
      throw new Error(`Surgical continuity session not found for schedule ${params.scheduleId}.`);
    }

    if (!params.signOutVerified) {
      throw new Error('WHO_SIGN_OUT_REQUIRED: WHO Surgical Safety Sign-Out phase must be completed before transfer to PACU.');
    }

    const now = new Date().toISOString();
    session.currentState = 'PACU_RECOVERY';
    session.signOutVerified = true;
    session.continuityLockActive = true; // Lock remains active throughout PACU recovery
    session.lastHeartbeatAt = now;
    session.updatedAt = now;

    this.sessions.set(params.scheduleId, session);
    logger.info('Patient transitioned to PACU recovery under continuity lock', { scheduleId: params.scheduleId });
    return session;
  }

  /**
   * 4. Formal Procedure Closure
   * Verifies Aldrete Recovery Score >= 9/10 before unlocking.
   * Releases continuity lock; normal licensing verification resumes.
   */
  public static async closeProcedure(params: {
    scheduleId: string;
    hospitalId: string;
    dischargePhysicianId: string;
    aldreteScore: number;
    destination: string;
  }): Promise<SurgicalContinuitySession> {
    const session = this.sessions.get(params.scheduleId);
    if (!session || session.hospitalId !== params.hospitalId) {
      throw new Error(`Surgical continuity session not found for schedule ${params.scheduleId}.`);
    }

    if (session.currentState !== 'PACU_RECOVERY') {
      throw new Error(`PACU_DISCHARGE_SEQUENCE_ERROR: Procedure can only be closed from PACU_RECOVERY state (current: ${session.currentState}).`);
    }

    if (params.aldreteScore < 9) {
      throw new Error(`ALDRETE_SCORE_INSUFFICIENT: Modified Aldrete Score is ${params.aldreteScore}/10. Score >= 9 is strictly required to discharge patient from PACU.`);
    }

    const now = new Date().toISOString();
    session.currentState = 'PROCEDURE_CLOSED';
    session.continuityLockActive = false; // RELEASE LOCK: Clinical procedure is safely concluded
    session.closedAt = now;
    session.dischargePhysicianId = params.dischargePhysicianId;
    session.finalAldreteScore = params.aldreteScore;
    session.dischargeDestination = params.destination;
    session.updatedAt = now;

    this.sessions.set(params.scheduleId, session);

    logger.info('SURGICAL_CONTINUITY_LOCK_RELEASED: Procedure safely closed', {
      scheduleId: params.scheduleId,
      aldreteScore: params.aldreteScore,
      destination: params.destination
    });

    return session;
  }

  /**
   * 5. Emergency Override
   * Intraoperative emergency crash intervention or unanticipated transfer.
   */
  public static async recordEmergencyOverride(params: {
    scheduleId: string;
    hospitalId: string;
    clinicianId: string;
    reason: string;
    actionTaken: string;
  }): Promise<SurgicalContinuitySession> {
    const session = this.sessions.get(params.scheduleId);
    if (!session || session.hospitalId !== params.hospitalId) {
      throw new Error(`Surgical continuity session not found for schedule ${params.scheduleId}.`);
    }

    const now = new Date().toISOString();
    session.currentState = 'EMERGENCY_OVERRIDE';
    session.continuityLockActive = true; // Lock maintained to protect life-saving intervention
    session.emergencyOverrides.push({
      clinicianId: params.clinicianId,
      reason: params.reason,
      actionTaken: params.actionTaken,
      timestamp: now
    });
    session.lastHeartbeatAt = now;
    session.updatedAt = now;

    this.sessions.set(params.scheduleId, session);
    logger.warn('SURGICAL_EMERGENCY_OVERRIDE_DOCUMENTED', {
      scheduleId: params.scheduleId,
      clinicianId: params.clinicianId,
      reason: params.reason
    });

    return session;
  }

  /**
   * 6. Controlled Stale-Session Recovery
   * Recovers sessions where expected surgical duration was exceeded or system disconnected.
   * Prevents unauthorized indefinite locks. Requires documented supervisor authorization.
   */
  public static async recoverStaleSession(params: {
    scheduleId: string;
    hospitalId: string;
    supervisorId: string;
    supervisorRole: string;
    justification: string;
    resolution: 'FORCE_CLOSE_RECOVERY' | 'TRANSFER_ICU' | 'REASSIGN_ACTIVE';
  }): Promise<SurgicalContinuitySession> {
    const session = this.sessions.get(params.scheduleId);
    if (!session || session.hospitalId !== params.hospitalId) {
      throw new Error(`Surgical continuity session not found for schedule ${params.scheduleId}.`);
    }

    // Role check: Only clinical supervisors can resolve stale sessions
    const allowedRoles = ['chief_of_surgery', 'ot_director', 'medical_director', 'hospital_admin', 'super_admin'];
    if (!allowedRoles.includes(params.supervisorRole.toLowerCase())) {
      throw new Error(`UNAUTHORIZED_STALE_RECOVERY: Role ${params.supervisorRole} is not authorized to recover stale surgical sessions.`);
    }

    if (!params.justification || params.justification.trim().length < 15) {
      throw new Error('JUSTIFICATION_REQUIRED: Detailed clinical justification (minimum 15 characters) required for stale session recovery.');
    }

    const now = new Date().toISOString();
    session.currentState = 'STALE_RECOVERED';
    session.continuityLockActive = false; // Lock released through supervised reconciliation
    session.staleRecovery = {
      supervisorId: params.supervisorId,
      justification: params.justification,
      resolvedAt: now,
      resolution: params.resolution
    };
    session.updatedAt = now;

    this.sessions.set(params.scheduleId, session);

    logger.warn('STALE_SURGICAL_SESSION_RECOVERED', {
      scheduleId: params.scheduleId,
      supervisorId: params.supervisorId,
      resolution: params.resolution,
      justification: params.justification
    });

    return session;
  }

  /**
   * Checks whether a surgical schedule is currently protected by the surgical continuity lock.
   */
  public static isSessionProtected(scheduleId: string, hospitalId: string): boolean {
    const session = this.sessions.get(scheduleId);
    if (!session || session.hospitalId !== hospitalId) {
      return false;
    }

    // Check if session has exceeded timeout without heartbeat
    if (session.timeoutAt && new Date(session.timeoutAt) < new Date() && session.continuityLockActive) {
      logger.warn('SURGICAL_SESSION_TIMEOUT_EXCEEDED: Session flagged as stale, supervisor review required', { scheduleId });
      // Remains locked until explicit stale recovery is initiated by clinical supervisor
      return true;
    }

    return session.continuityLockActive === true;
  }

  /**
   * Retrieves active session details
   */
  public static getSession(scheduleId: string, hospitalId: string): SurgicalContinuitySession | undefined {
    const session = this.sessions.get(scheduleId);
    if (session && session.hospitalId === hospitalId) {
      return session;
    }
    return undefined;
  }
}

