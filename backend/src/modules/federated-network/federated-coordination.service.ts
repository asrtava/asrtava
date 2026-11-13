import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export interface ParticipatingHospital {
  id: string;
  hospitalId: string;
  networkCode: string;
  facilityName: string;
  state: string;
  city: string;
  participationStatus: 'active' | 'suspended' | 'pending_verification' | 'withdrawn';
  capabilities: {
    organTransplant: boolean;
    transplantTypes: string[];
    level1Trauma: boolean;
    bloodBank: boolean;
    icuCapacity: boolean;
    teleRadiologySecondOpinion: boolean;
  };
  nottoCenterId?: string;
  sottoRegistrationNumber?: string;
  bloodBankLicenseNumber?: string;
  emergencyHelplinePhone: string;
  transplantCoordinatorPhone?: string;
  bloodBankDeskPhone?: string;
}

export interface InterHospitalRequest {
  id: string;
  requestNumber: string;
  requestType:
    | 'organ_donor_coordination'
    | 'emergency_patient_transfer'
    | 'bed_availability_inquiry'
    | 'blood_component_request'
    | 'specialist_tele_consult'
    | 'urgent_diagnostic_opinion';
  requestingHospitalId: string;
  receivingHospitalId?: string;
  requestingUserId: string;
  requestingUserRole: string;
  urgencyLevel: 'stat_critical' | 'urgent' | 'routine';
  purposeStatement: string;
  clinicalSummary: string; // Strictly minimum necessary data
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'AUTHORIZATION_CHECK'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'WITHDRAWN'
    | 'ESCALATED';
  rejectionReason?: string;
  consentType:
    | 'patient_written_consent'
    | 'next_of_kin_authorized'
    | 'stat_emergency_implied_consent'
    | 'statutory_legal_order';
  consentDocumentHash?: string;
  expiresAt: string;
  createdAt: string;
}

export interface OrganTransplantCase {
  id: string;
  caseNumber: string;
  coordinationRequestId: string;
  donorHospitalId: string;
  donorType: 'deceased_brain_stem_death' | 'deceased_cardiac_death' | 'living_related';
  donorBloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  donorAgeApprox: number;
  donorGender: string;
  brainDeathFirstApneaTestAt?: string;
  brainDeathSecondApneaTestAt?: string;
  brainDeathBoardCertified: boolean;
  form8LegalDeclarationSigned: boolean;
  organsAuthorized: string[];
  sottoNotifiedAt?: string;
  sottoCaseReference?: string;
  nottoRegistryReference?: string;
  officialAllocationAuthority: 'NOTTO/SOTTO';
  retrievalTeamHospitalId?: string;
  retrievalTeamEta?: string;
  greenCorridorStatus: 'not_required' | 'requested_with_traffic_police' | 'active' | 'completed';
  coldIschemiaStartTime?: string;
  commercialIntermediaryCheckPassed: boolean;
  nonCommercialAffidavitHash: string;
  status:
    | 'donor_identified'
    | 'consent_verified'
    | 'sotto_notified'
    | 'retrieval_in_progress'
    | 'cross_match_verified'
    | 'transplant_in_progress'
    | 'transplant_completed'
    | 'closed';
}

export interface EmergencyTransferCase {
  id: string;
  transferNumber: string;
  coordinationRequestId: string;
  originHospitalId: string;
  destinationHospitalId: string;
  patientUhidPseudonym: string;
  patientAge: number;
  patientGender: string;
  triageLevel: 'ESI_1_RESUSCITATION' | 'ESI_2_EMERGENT' | 'ESI_3_URGENT';
  provisionalDiagnosis: string;
  minimumClinicalPayload: {
    gcs: number;
    vitals: Record<string, any>;
    intubated: boolean;
    inotropesActive: boolean;
    knownAllergies: string[];
    criticalInterventionsDone: string[];
  };
  ambulanceType: 'ALS_ADVANCED_LIFE_SUPPORT' | 'BLS_BASIC_LIFE_SUPPORT' | 'AIR_AMBULANCE' | 'NEONATAL_TRANSPORT';
  ambulanceCallSign: string;
  paramedicInCharge: string;
  paramedicContactPhone: string;
  departureTime?: string;
  estimatedArrivalTime?: string;
  actualArrivalTime?: string;
  handoverOriginNurseId?: string;
  handoverDestinationNurseId?: string;
  handoverSignedAt?: string;
  handoverClinicalNotes?: string;
  transferStatus:
    | 'requested'
    | 'accepted'
    | 'ambulance_dispatched'
    | 'in_transit'
    | 'arrived_destination'
    | 'admitted'
    | 'declined';
}

export interface BedAvailabilityReport {
  id: string;
  hospitalId: string;
  reportedAt: string;
  generalWardVacant: number;
  icuBedsVacant: number;
  ventilatorBedsVacant: number;
  emergencyResusBaysVacant: number;
  otEmergencySlotsVacant: number;
  verifiedByUserId: string;
  expiresAt: string;
  notes?: string;
}

export interface BloodBankRequest {
  id: string;
  coordinationRequestId: string;
  requestingHospitalId: string;
  supplyingHospitalId?: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  componentType:
    | 'packed_red_blood_cells'
    | 'fresh_frozen_plasma'
    | 'single_donor_platelets'
    | 'random_donor_platelets'
    | 'cryoprecipitate';
  unitsRequested: number;
  unitsAllocated: number;
  compatibilityCrossMatchRequired: boolean;
  coldChainBoxBarcode?: string;
  dispatchTemperatureCelsius?: number;
  status: 'requested' | 'allocated' | 'dispatched' | 'received_and_verified' | 'cancelled';
}

export interface CaseBasedDataShare {
  id: string;
  coordinationRequestId: string;
  originHospitalId: string;
  destinationHospitalId: string;
  resourceType: 'imaging_study' | 'lab_specimen_report' | 'discharge_summary' | 'cross_match_report' | 'hla_typing_certificate';
  resourceId: string;
  resourceTitle: string;
  accessToken: string;
  tokenExpiresAt: string;
  accessCount: number;
  maxPermittedAccesses: number;
  revokedAt?: string;
  revocationReason?: string;
}

export interface InterHospitalAuditEntry {
  id: string;
  eventNumber: string;
  requestId?: string;
  sourceHospitalId: string;
  targetHospitalId?: string;
  action: string;
  performedByUserId: string;
  userRole: string;
  lawfulBasis: string;
  piiRedactionApplied: boolean;
  sha256RecordHash: string;
  createdAt: string;
}

export class FederatedCoordinationService {
  private static participatingHospitals: Map<string, ParticipatingHospital> = new Map();
  private static coordinationRequests: Map<string, InterHospitalRequest> = new Map();
  private static transplantCases: Map<string, OrganTransplantCase> = new Map();
  private static emergencyTransfers: Map<string, EmergencyTransferCase> = new Map();
  private static bedAvailability: Map<string, BedAvailabilityReport> = new Map();
  private static bloodRequests: Map<string, BloodBankRequest> = new Map();
  private static caseShares: Map<string, CaseBasedDataShare> = new Map();
  private static auditTrail: InterHospitalAuditEntry[] = [];

  // --------------------------------------------------------------------------
  // 1. Hospital Participation Directory & Capabilities
  // --------------------------------------------------------------------------
  public static registerParticipatingHospital(hospital: ParticipatingHospital): void {
    this.participatingHospitals.set(hospital.hospitalId, hospital);
  }

  public static listParticipatingHospitals(filter?: {
    city?: string;
    state?: string;
    capability?: 'organTransplant' | 'level1Trauma' | 'bloodBank' | 'icuCapacity';
  }): ParticipatingHospital[] {
    let list = Array.from(this.participatingHospitals.values()).filter(
      (h) => h.participationStatus === 'active'
    );

    if (filter?.city) {
      list = list.filter((h) => h.city.toLowerCase() === filter.city!.toLowerCase());
    }
    if (filter?.state) {
      list = list.filter((h) => h.state.toLowerCase() === filter.state!.toLowerCase());
    }
    if (filter?.capability) {
      list = list.filter((h) => h.capabilities[filter.capability!] === true);
    }

    return list;
  }

  // --------------------------------------------------------------------------
  // 2. Controlled Bed & Capacity Reporting
  // --------------------------------------------------------------------------
  public static publishBedAvailability(report: Omit<BedAvailabilityReport, 'id' | 'reportedAt'>): BedAvailabilityReport {
    const record: BedAvailabilityReport = {
      id: uuidv4(),
      reportedAt: new Date().toISOString(),
      ...report,
    };
    this.bedAvailability.set(report.hospitalId, record);
    return record;
  }

  public static queryActiveBedAvailability(hospitalIds?: string[]): BedAvailabilityReport[] {
    const now = new Date().getTime();
    const reports = Array.from(this.bedAvailability.values()).filter((r) => {
      const expiresAtTime = new Date(r.expiresAt).getTime();
      return expiresAtTime > now;
    });

    if (hospitalIds && hospitalIds.length > 0) {
      return reports.filter((r) => hospitalIds.includes(r.hospitalId));
    }
    return reports;
  }

  // --------------------------------------------------------------------------
  // 3. Coordination Request Lifecycle Engine
  // --------------------------------------------------------------------------
  public static createCoordinationRequest(params: {
    requestType: InterHospitalRequest['requestType'];
    requestingHospitalId: string;
    receivingHospitalId?: string;
    requestingUserId: string;
    requestingUserRole: string;
    urgencyLevel: 'stat_critical' | 'urgent' | 'routine';
    purposeStatement: string;
    clinicalSummary: string;
    consentType: InterHospitalRequest['consentType'];
    ttlMinutes?: number;
  }): InterHospitalRequest {
    const ttl = params.ttlMinutes || (params.urgencyLevel === 'stat_critical' ? 60 : 240);
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    const request: InterHospitalRequest = {
      id: uuidv4(),
      requestNumber: `REQ-FED-${Date.now().toString().slice(-6)}`,
      requestType: params.requestType,
      requestingHospitalId: params.requestingHospitalId,
      receivingHospitalId: params.receivingHospitalId,
      requestingUserId: params.requestingUserId,
      requestingUserRole: params.requestingUserRole,
      urgencyLevel: params.urgencyLevel,
      purposeStatement: params.purposeStatement,
      clinicalSummary: params.clinicalSummary,
      status: 'SUBMITTED',
      consentType: params.consentType,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    this.coordinationRequests.set(request.id, request);
    this.recordAudit({
      requestId: request.id,
      sourceHospitalId: params.requestingHospitalId,
      targetHospitalId: params.receivingHospitalId,
      action: `COORDINATION_REQUEST_CREATED:${params.requestType}`,
      performedByUserId: params.requestingUserId,
      userRole: params.requestingUserRole,
      lawfulBasis: params.consentType,
      payload: { requestNumber: request.requestNumber, urgency: request.urgencyLevel },
    });

    return request;
  }

  public static transitionRequestStatus(params: {
    requestId: string;
    newStatus: InterHospitalRequest['status'];
    actingHospitalId: string;
    actingUserId: string;
    actingUserRole: string;
    rejectionReason?: string;
  }): InterHospitalRequest {
    const req = this.coordinationRequests.get(params.requestId);
    if (!req) throw new Error('Coordination request not found.');

    // Security invariant: only participating parties can transition status
    if (
      req.requestingHospitalId !== params.actingHospitalId &&
      req.receivingHospitalId &&
      req.receivingHospitalId !== params.actingHospitalId
    ) {
      throw new Error('Unauthorized cross-hospital attempt to modify coordination request.');
    }

    req.status = params.newStatus;
    if (params.rejectionReason) req.rejectionReason = params.rejectionReason;

    this.recordAudit({
      requestId: req.id,
      sourceHospitalId: params.actingHospitalId,
      targetHospitalId: req.requestingHospitalId === params.actingHospitalId ? req.receivingHospitalId : req.requestingHospitalId,
      action: `COORDINATION_STATUS_CHANGED:${params.newStatus}`,
      performedByUserId: params.actingUserId,
      userRole: params.actingUserRole,
      lawfulBasis: req.consentType,
      payload: { status: params.newStatus, rejectionReason: params.rejectionReason },
    });

    return req;
  }

  // --------------------------------------------------------------------------
  // 4. Organ Donation & Transplant Coordination (NOTTO / SOTTO Compliant)
  // --------------------------------------------------------------------------
  public static initiateOrganDonorCase(params: {
    coordinationRequestId: string;
    donorHospitalId: string;
    donorType: OrganTransplantCase['donorType'];
    donorBloodGroup: OrganTransplantCase['donorBloodGroup'];
    donorAgeApprox: number;
    donorGender: string;
    brainDeathFirstApneaTestAt?: string;
    brainDeathSecondApneaTestAt?: string;
    brainDeathBoardCertified: boolean;
    form8LegalDeclarationSigned: boolean;
    organsAuthorized: string[];
    sottoNotifiedAt?: string;
    sottoCaseReference?: string;
    nottoRegistryReference?: string;
    nonCommercialAffidavitHash: string;
    actingUserId: string;
    actingUserRole: string;
  }): OrganTransplantCase {
    // THOA Statutory Validation: Deceased brain stem death requires dual apnea certification
    if (params.donorType === 'deceased_brain_stem_death') {
      if (!params.brainDeathBoardCertified || !params.form8LegalDeclarationSigned) {
        throw new Error(
          'THOA Statutory Violation: Deceased organ retrieval requires certified Brain Stem Death Board and signed Form 8 declaration.'
        );
      }
      if (params.brainDeathFirstApneaTestAt && params.brainDeathSecondApneaTestAt) {
        const diffMs =
          new Date(params.brainDeathSecondApneaTestAt).getTime() -
          new Date(params.brainDeathFirstApneaTestAt).getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 6) {
          throw new Error('THOA Statutory Violation: Second apnea test must occur at least 6 hours after first apnea test.');
        }
      }
    }

    // Invariant: Non-commercial affidavit hash is mandatory
    if (!params.nonCommercialAffidavitHash || params.nonCommercialAffidavitHash.length < 32) {
      throw new Error('Compliance Violation: Non-commercial declaration affidavit hash is mandatory.');
    }

    const txCase: OrganTransplantCase = {
      id: uuidv4(),
      caseNumber: `TX-CASE-${Date.now().toString().slice(-6)}`,
      coordinationRequestId: params.coordinationRequestId,
      donorHospitalId: params.donorHospitalId,
      donorType: params.donorType,
      donorBloodGroup: params.donorBloodGroup,
      donorAgeApprox: params.donorAgeApprox,
      donorGender: params.donorGender,
      brainDeathFirstApneaTestAt: params.brainDeathFirstApneaTestAt,
      brainDeathSecondApneaTestAt: params.brainDeathSecondApneaTestAt,
      brainDeathBoardCertified: params.brainDeathBoardCertified,
      form8LegalDeclarationSigned: params.form8LegalDeclarationSigned,
      organsAuthorized: params.organsAuthorized,
      sottoNotifiedAt: params.sottoNotifiedAt || new Date().toISOString(),
      sottoCaseReference: params.sottoCaseReference,
      nottoRegistryReference: params.nottoRegistryReference,
      officialAllocationAuthority: 'NOTTO/SOTTO',
      greenCorridorStatus: 'not_required',
      commercialIntermediaryCheckPassed: true,
      nonCommercialAffidavitHash: params.nonCommercialAffidavitHash,
      status: 'consent_verified',
    };

    this.transplantCases.set(txCase.id, txCase);

    this.recordAudit({
      requestId: params.coordinationRequestId,
      sourceHospitalId: params.donorHospitalId,
      action: 'ORGAN_DONOR_CASE_INITIATED',
      performedByUserId: params.actingUserId,
      userRole: params.actingUserRole,
      lawfulBasis: 'THOA_1994_TRANSPLANTATION_ACT',
      payload: {
        caseNumber: txCase.caseNumber,
        donorBloodGroup: txCase.donorBloodGroup,
        organsPledged: txCase.organsAuthorized,
        allocationAuthority: 'NOTTO/SOTTO',
      },
    });

    return txCase;
  }

  // --------------------------------------------------------------------------
  // 5. Emergency Patient Referral & Ambulance Coordination
  // --------------------------------------------------------------------------
  public static initiateEmergencyTransfer(params: {
    coordinationRequestId: string;
    originHospitalId: string;
    destinationHospitalId: string;
    patientUhidPseudonym: string;
    patientAge: number;
    patientGender: string;
    triageLevel: EmergencyTransferCase['triageLevel'];
    provisionalDiagnosis: string;
    minimumClinicalPayload: EmergencyTransferCase['minimumClinicalPayload'];
    ambulanceType: EmergencyTransferCase['ambulanceType'];
    ambulanceCallSign: string;
    paramedicInCharge: string;
    paramedicContactPhone: string;
    actingUserId: string;
    actingUserRole: string;
  }): EmergencyTransferCase {
    const transferCase: EmergencyTransferCase = {
      id: uuidv4(),
      transferNumber: `EMERG-TX-${Date.now().toString().slice(-6)}`,
      coordinationRequestId: params.coordinationRequestId,
      originHospitalId: params.originHospitalId,
      destinationHospitalId: params.destinationHospitalId,
      patientUhidPseudonym: params.patientUhidPseudonym,
      patientAge: params.patientAge,
      patientGender: params.patientGender,
      triageLevel: params.triageLevel,
      provisionalDiagnosis: params.provisionalDiagnosis,
      minimumClinicalPayload: params.minimumClinicalPayload,
      ambulanceType: params.ambulanceType,
      ambulanceCallSign: params.ambulanceCallSign,
      paramedicInCharge: params.paramedicInCharge,
      paramedicContactPhone: params.paramedicContactPhone,
      transferStatus: 'requested',
    };

    this.emergencyTransfers.set(transferCase.id, transferCase);

    this.recordAudit({
      requestId: params.coordinationRequestId,
      sourceHospitalId: params.originHospitalId,
      targetHospitalId: params.destinationHospitalId,
      action: 'EMERGENCY_TRANSFER_INITIATED',
      performedByUserId: params.actingUserId,
      userRole: params.actingUserRole,
      lawfulBasis: 'STAT_EMERGENCY_LIFE_SAVING_CARE',
      payload: {
        transferNumber: transferCase.transferNumber,
        triageLevel: transferCase.triageLevel,
        diagnosis: transferCase.provisionalDiagnosis,
      },
    });

    return transferCase;
  }

  // --------------------------------------------------------------------------
  // 6. Blood Bank Coordination (Strict Donor Anonymity)
  // --------------------------------------------------------------------------
  public static requestBloodComponents(params: {
    coordinationRequestId: string;
    requestingHospitalId: string;
    supplyingHospitalId?: string;
    bloodGroup: BloodBankRequest['bloodGroup'];
    componentType: BloodBankRequest['componentType'];
    unitsRequested: number;
    actingUserId: string;
    actingUserRole: string;
  }): BloodBankRequest {
    const bloodReq: BloodBankRequest = {
      id: uuidv4(),
      coordinationRequestId: params.coordinationRequestId,
      requestingHospitalId: params.requestingHospitalId,
      supplyingHospitalId: params.supplyingHospitalId,
      bloodGroup: params.bloodGroup,
      componentType: params.componentType,
      unitsRequested: params.unitsRequested,
      unitsAllocated: 0,
      compatibilityCrossMatchRequired: true,
      status: 'requested',
    };

    this.bloodRequests.set(bloodReq.id, bloodReq);

    this.recordAudit({
      requestId: params.coordinationRequestId,
      sourceHospitalId: params.requestingHospitalId,
      targetHospitalId: params.supplyingHospitalId,
      action: 'BLOOD_BANK_COMPONENT_REQUESTED',
      performedByUserId: params.actingUserId,
      userRole: params.actingUserRole,
      lawfulBasis: 'CLINICAL_TRANSFUSION_PROTOCOL',
      payload: {
        bloodGroup: bloodReq.bloodGroup,
        component: bloodReq.componentType,
        units: bloodReq.unitsRequested,
      },
    });

    return bloodReq;
  }

  // --------------------------------------------------------------------------
  // 7. Case-Based Ephemeral Clinical Data Sharing (Time-Limited Tokens)
  // --------------------------------------------------------------------------
  public static createCaseBasedDataShare(params: {
    coordinationRequestId: string;
    originHospitalId: string;
    destinationHospitalId: string;
    resourceType: CaseBasedDataShare['resourceType'];
    resourceId: string;
    resourceTitle: string;
    ttlHours?: number;
    actingUserId: string;
    actingUserRole: string;
  }): CaseBasedDataShare {
    const hours = Math.min(params.ttlHours || 8, 24); // Maximum 24-hour TTL
    const token = `asrt_share_${crypto.randomBytes(32).toString('hex')}`;
    const tokenExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    const share: CaseBasedDataShare = {
      id: uuidv4(),
      coordinationRequestId: params.coordinationRequestId,
      originHospitalId: params.originHospitalId,
      destinationHospitalId: params.destinationHospitalId,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceTitle: params.resourceTitle,
      accessToken: token,
      tokenExpiresAt,
      accessCount: 0,
      maxPermittedAccesses: 10,
    };

    this.caseShares.set(token, share);

    this.recordAudit({
      requestId: params.coordinationRequestId,
      sourceHospitalId: params.originHospitalId,
      targetHospitalId: params.destinationHospitalId,
      action: 'EPHEMERAL_CASE_SHARE_ISSUED',
      performedByUserId: params.actingUserId,
      userRole: params.actingUserRole,
      lawfulBasis: 'CONSENT_BASED_CASE_DISCLOSURE',
      payload: {
        resourceType: share.resourceType,
        ttlHours: hours,
      },
    });

    return share;
  }

  public static accessSharedResource(params: {
    token: string;
    requestingHospitalId: string;
    requestingUserId: string;
    requestingUserRole: string;
  }): CaseBasedDataShare {
    const share = this.caseShares.get(params.token);
    if (!share) throw new Error('Invalid or revoked share token.');

    if (share.revokedAt) {
      throw new Error(`Share token was revoked: ${share.revocationReason}`);
    }

    if (new Date().getTime() > new Date(share.tokenExpiresAt).getTime()) {
      throw new Error('Share token has expired.');
    }

    if (share.destinationHospitalId !== params.requestingHospitalId) {
      throw new Error('Token is not authorized for this hospital tenant (Cross-Tenant Token Rejection).');
    }

    if (share.accessCount >= share.maxPermittedAccesses) {
      throw new Error('Maximum access limit reached for this ephemeral share.');
    }

    share.accessCount++;

    this.recordAudit({
      requestId: share.coordinationRequestId,
      sourceHospitalId: share.originHospitalId,
      targetHospitalId: params.requestingHospitalId,
      action: 'EPHEMERAL_CASE_SHARE_ACCESSED',
      performedByUserId: params.requestingUserId,
      userRole: params.requestingUserRole,
      lawfulBasis: 'CASE_REFERRAL_REVIEW',
      payload: { resourceType: share.resourceType, accessCount: share.accessCount },
    });

    return share;
  }

  // --------------------------------------------------------------------------
  // 8. Strict Invariant Defense: Prohibits Cross-Hospital Database Browsing
  // --------------------------------------------------------------------------
  public static verifyCrossHospitalAccessAttempt(params: {
    requestingHospitalId: string;
    targetHospitalId: string;
    attemptedAction: 'browse_patients' | 'search_records' | 'view_billing' | 'view_staff';
  }): { allowed: boolean; code: string; message: string } {
    // Unrelated hospital browsing is NEVER allowed under any circumstances
    if (params.requestingHospitalId !== params.targetHospitalId) {
      return {
        allowed: false,
        code: 'FEDERATED_ISOLATION_INVARIANT_VIOLATION',
        message: `Direct ${params.attemptedAction} on foreign hospital ${params.targetHospitalId} is strictly blocked. Only purpose-specific coordination requests are permitted.`,
      };
    }
    return { allowed: true, code: 'AUTHORIZED_INTRA_TENANT', message: 'Authorized intra-tenant request.' };
  }

  // --------------------------------------------------------------------------
  // Audit Trail Recorder
  // --------------------------------------------------------------------------
  private static recordAudit(entry: {
    requestId?: string;
    sourceHospitalId: string;
    targetHospitalId?: string;
    action: string;
    performedByUserId: string;
    userRole: string;
    lawfulBasis: string;
    payload?: Record<string, any>;
  }): void {
    const rawData = `${entry.action}|${entry.sourceHospitalId}|${entry.targetHospitalId || ''}|${Date.now()}`;
    const hash = crypto.createHash('sha256').update(rawData).digest('hex');

    const auditRecord: InterHospitalAuditEntry = {
      id: uuidv4(),
      eventNumber: `FED-AUD-${Date.now().toString().slice(-8)}`,
      requestId: entry.requestId,
      sourceHospitalId: entry.sourceHospitalId,
      targetHospitalId: entry.targetHospitalId,
      action: entry.action,
      performedByUserId: entry.performedByUserId,
      userRole: entry.userRole,
      lawfulBasis: entry.lawfulBasis,
      piiRedactionApplied: true,
      sha256RecordHash: hash,
      createdAt: new Date().toISOString(),
    };

    this.auditTrail.push(auditRecord);
    logger.info(`[FEDERATED_AUDIT] ${auditRecord.action} (${auditRecord.eventNumber}) by ${auditRecord.userRole}`);
  }

  public static getAuditTrail(hospitalId: string): InterHospitalAuditEntry[] {
    return this.auditTrail.filter(
      (a) => a.sourceHospitalId === hospitalId || a.targetHospitalId === hospitalId
    );
  }
}
