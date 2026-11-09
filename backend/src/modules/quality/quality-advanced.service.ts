import { logger } from '../../utils/logger';

export interface QmIncident {
  id: string;
  organizationId: string;
  hospitalId: string;
  incidentNumber: string;
  category: 'PATIENT_FALL' | 'MEDICATION_ERROR' | 'DIAGNOSTIC_ERROR' | 'SURGICAL_SAFETY' | 'EQUIPMENT_FAILURE' | 'INFECTION_EVENT' | 'NEAR_MISS' | 'STAFF_INJURY' | 'COMMUNICATION_FAILURE';
  severity: 'SENTINEL' | 'SERIOUS_ADVERSE' | 'MINOR_ADVERSE' | 'NEAR_MISS' | 'HAZARDOUS_CONDITION';
  incidentDate: string;
  locationDepartmentId?: string;
  locationWardId?: string;
  patientId?: string;
  reportedByUserId?: string;
  isConfidential: boolean;
  description: string;
  immediateActionTaken?: string;
  status: 'REPORTED' | 'UNDER_INVESTIGATION' | 'RCA_IN_PROGRESS' | 'CAPA_PENDING' | 'CLOSED';
  createdAt: string;
}

export interface QmInvestigation {
  id: string;
  incidentId: string;
  leadInvestigatorUserId: string;
  investigationNotes: string;
  witnessStatements?: string;
  timelineSummary?: string;
  contributingFactors?: string;
  investigationStartedAt: string;
  investigationCompletedAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
}

export interface QmRootCauseAnalysis {
  id: string;
  incidentId: string;
  methodology: 'FIVE_WHYS' | 'FISHBONE_ISHIKAWA' | 'BARRIER_ANALYSIS';
  problemStatement: string;
  whySteps: string[];
  fishboneCategories?: Record<string, string[]>;
  rootCauseConclusion: string;
  createdByUserId: string;
  createdAt: string;
}

export interface QmCapaAction {
  id: string;
  organizationId: string;
  hospitalId: string;
  incidentId?: string;
  actionNumber: string;
  actionType: 'CORRECTIVE' | 'PREVENTIVE';
  title: string;
  description: string;
  assignedToUserId: string;
  departmentId?: string;
  targetCompletionDate: string;
  completedAt?: string;
  completionNotes?: string;
  verificationCriteria: string;
  isVerifiedEffective: boolean;
  verifiedByUserId?: string;
  verifiedAt?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED_CLOSED' | 'OVERDUE';
  createdAt: string;
}

export interface QmHaiSurveillance {
  id: string;
  organizationId: string;
  hospitalId: string;
  patientId: string;
  wardId?: string;
  infectionType: 'CAUTI' | 'CLABSI' | 'VAP' | 'SSI' | 'HOSPITAL_ACQUIRED_COVID';
  detectedDate: string;
  deviceExposureDays: number;
  causativeOrganism?: string;
  antimicrobialResistance?: string;
  surveillanceClassification: string;
  ratePer1000DeviceDays?: number;
  investigatedByUserId?: string;
  outcome: string;
  createdAt: string;
}

export interface QmHandHygieneAudit {
  id: string;
  organizationId: string;
  hospitalId: string;
  auditDate: string;
  departmentId?: string;
  auditorUserId: string;
  opportunitiesObserved: number;
  compliantActions: number;
  compliancePercentage: number;
  notes?: string;
}

export interface QmMedicationSafetyEvent {
  id: string;
  organizationId: string;
  hospitalId: string;
  patientId?: string;
  prescriptionId?: string;
  eventType: 'WRONG_DOSE' | 'WRONG_ROUTE' | 'WRONG_PATIENT' | 'WRONG_DRUG' | 'OMITTED_DOSE' | 'ADVERSE_DRUG_REACTION';
  drugName: string;
  severity: 'NEAR_MISS' | 'NO_HARM' | 'TEMPORARY_HARM' | 'LIFE_THREATENING';
  immediateReversalAction?: string;
  outcome?: string;
  reportedByUserId?: string;
  reportedAt: string;
}

export interface QmClinicalAudit {
  id: string;
  organizationId: string;
  hospitalId: string;
  auditTitle: string;
  auditType: 'SURGICAL_SAFETY' | 'CLINICAL_DOCUMENTATION' | 'ANTIBIOTIC_STEWARDSHIP' | 'NURSING_CARE_PLAN' | 'DISCHARGE_SUMMARY';
  departmentId?: string;
  sampleSize: number;
  compliantRecords: number;
  complianceRatePercent: number;
  auditorUserId: string;
  recommendations?: string;
}

export interface QmPatientComplaint {
  id: string;
  organizationId: string;
  hospitalId: string;
  complaintNumber: string;
  patientId?: string;
  category: 'CLINICAL_CARE' | 'STAFF_CONDUCT' | 'BILLING_DISPUTE' | 'WAIT_TIME' | 'CLEANLINESS' | 'PHARMACY_DELAY';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedToUserId?: string;
  resolutionNotes?: string;
  status: 'REGISTERED' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
  createdAt: string;
  resolvedAt?: string;
}

export interface QmRiskRegisterEntry {
  id: string;
  organizationId: string;
  hospitalId: string;
  riskTitle: string;
  riskCategory: 'CLINICAL' | 'OPERATIONAL' | 'FINANCIAL' | 'INFO_SECURITY' | 'ENVIRONMENTAL' | 'INFECTION_CONTROL';
  likelihoodScore: number;
  impactScore: number;
  inherentRiskScore: number;
  existingControls: string;
  mitigationPlan: string;
  riskOwnerUserId?: string;
  status: 'ACTIVE' | 'MITIGATED' | 'ACCEPTED';
}

export interface QmQualityIndicator {
  id: string;
  organizationId: string;
  hospitalId: string;
  indicatorCode: string;
  name: string;
  numeratorDefinition: string;
  denominatorDefinition: string;
  measurementUnit: string;
  targetBenchmark: number;
  currentValue: number;
  reportingPeriod: string;
  isWithinTarget: boolean;
  updatedAt: string;
}

export interface QmAccreditationStandard {
  id: string;
  organizationId: string;
  hospitalId: string;
  frameworkName: 'NABH_5TH_EDITION' | 'NABL_ISO_15189' | 'JCI_7TH_EDITION';
  clauseNumber: string;
  chapterTitle: string;
  requirementDescription: string;
  evidenceDocumentIds: string[];
  complianceStatus: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
  responsibleDepartmentId?: string;
  updatedAt: string;
}

export interface QmControlledDocument {
  id: string;
  organizationId: string;
  hospitalId: string;
  documentNumber: string;
  title: string;
  documentType: 'POLICY' | 'SOP' | 'CLINICAL_GUIDELINE' | 'QUALITY_MANUAL' | 'WORK_INSTRUCTION';
  version: string;
  departmentId?: string;
  effectiveDate: string;
  reviewDate: string;
  approvalStatus: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'SUPERSEDED';
  approvedByUserId?: string;
  fileUrl?: string;
}

export interface QmMockInspection {
  id: string;
  organizationId: string;
  hospitalId: string;
  inspectionTitle: string;
  targetFramework: string;
  inspectionDate: string;
  leadAssessorUserId: string;
  totalClausesChecked: number;
  compliantClauses: number;
  readinessPercentage: number;
  majorNonConformitiesCount: number;
  capaActionIds: string[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export class QualityAdvancedService {
  private incidents: Map<string, QmIncident> = new Map();
  private investigations: Map<string, QmInvestigation> = new Map();
  private rcas: Map<string, QmRootCauseAnalysis> = new Map();
  private capaActions: Map<string, QmCapaAction> = new Map();
  private haiSurveillances: Map<string, QmHaiSurveillance> = new Map();
  private handHygieneAudits: Map<string, QmHandHygieneAudit> = new Map();
  private medicationSafetyEvents: Map<string, QmMedicationSafetyEvent> = new Map();
  private clinicalAudits: Map<string, QmClinicalAudit> = new Map();
  private complaints: Map<string, QmPatientComplaint> = new Map();
  private riskRegister: Map<string, QmRiskRegisterEntry> = new Map();
  private indicators: Map<string, QmQualityIndicator> = new Map();
  private standards: Map<string, QmAccreditationStandard> = new Map();
  private controlledDocuments: Map<string, QmControlledDocument> = new Map();
  private mockInspections: Map<string, QmMockInspection> = new Map();

  constructor() {
    this.seedDefaultAccreditationStandards();
  }

  private seedDefaultAccreditationStandards(): void {
    const seedClauses = [
      {
        clause: 'AAC.1',
        chapter: 'Access, Assessment and Continuity of Care (AAC)',
        req: 'The hospital has a well-defined registration, admission and transfer process.',
      },
      {
        clause: 'COP.3',
        chapter: 'Care of Patients (COP)',
        req: 'Documented policies and procedures guide the care of high-risk patients including emergency triage.',
      },
      {
        clause: 'MOM.4',
        chapter: 'Management of Medication (MOM)',
        req: 'Documented policies guide the safe storage, prescription, dispensing and administration of high-alert medications.',
      },
      {
        clause: 'HIC.2',
        chapter: 'Hospital Infection Control (HIC)',
        req: 'The organization implements a comprehensive hand hygiene program conforming to WHO guidelines.',
      },
      {
        clause: 'PSQ.1',
        chapter: 'Patient Safety and Quality Improvement (PSQ)',
        req: 'The organization has a structured incident reporting system for adverse events and near misses.',
      },
    ];

    seedClauses.forEach((c, idx) => {
      const id = `std-seed-${idx + 1}`;
      this.standards.set(id, {
        id,
        organizationId: 'org-apex',
        hospitalId: 'hosp-apex',
        frameworkName: 'NABH_5TH_EDITION',
        clauseNumber: c.clause,
        chapterTitle: c.chapter,
        requirementDescription: c.req,
        evidenceDocumentIds: [`doc-sop-${idx + 1}`],
        complianceStatus: 'COMPLIANT',
        updatedAt: new Date().toISOString(),
      });
    });
  }

  // 1. Incident Reporting
  public async reportIncident(data: Omit<QmIncident, 'id' | 'incidentNumber' | 'createdAt'>): Promise<QmIncident> {
    const count = Array.from(this.incidents.values()).filter((i) => i.hospitalId === data.hospitalId).length;
    const incidentNumber = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const incident: QmIncident = {
      ...data,
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incidentNumber,
      createdAt: new Date().toISOString(),
    };
    this.incidents.set(incident.id, incident);

    logger.warn('Patient safety incident reported', {
      incidentNumber,
      category: incident.category,
      severity: incident.severity,
    });
    return incident;
  }

  // 2. Incident Investigation
  public async assignInvestigation(data: {
    incidentId: string;
    leadInvestigatorUserId: string;
    investigationNotes: string;
    witnessStatements?: string;
    timelineSummary?: string;
    contributingFactors?: string;
  }): Promise<QmInvestigation> {
    const incident = this.incidents.get(data.incidentId);
    if (!incident) throw new Error(`Incident ${data.incidentId} not found.`);

    incident.status = 'UNDER_INVESTIGATION';
    this.incidents.set(incident.id, incident);

    const investigation: QmInvestigation = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      investigationStartedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
    };
    this.investigations.set(investigation.id, investigation);

    logger.info('Incident investigation opened', {
      incidentNumber: incident.incidentNumber,
      investigator: data.leadInvestigatorUserId,
    });
    return investigation;
  }

  // 3. Root Cause Analysis (RCA)
  public async performRootCauseAnalysis(data: {
    incidentId: string;
    methodology: 'FIVE_WHYS' | 'FISHBONE_ISHIKAWA' | 'BARRIER_ANALYSIS';
    problemStatement: string;
    whySteps: string[];
    fishboneCategories?: Record<string, string[]>;
    rootCauseConclusion: string;
    createdByUserId: string;
  }): Promise<QmRootCauseAnalysis> {
    const incident = this.incidents.get(data.incidentId);
    if (!incident) throw new Error(`Incident ${data.incidentId} not found.`);

    incident.status = 'RCA_IN_PROGRESS';
    this.incidents.set(incident.id, incident);

    const rca: QmRootCauseAnalysis = {
      id: `rca-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.rcas.set(rca.id, rca);

    logger.info('Root Cause Analysis (RCA) completed', {
      incidentNumber: incident.incidentNumber,
      methodology: rca.methodology,
      conclusion: rca.rootCauseConclusion,
    });
    return rca;
  }

  // 4. Closed-Loop CAPA
  public async createCapaAction(data: Omit<QmCapaAction, 'id' | 'actionNumber' | 'status' | 'isVerifiedEffective' | 'createdAt'>): Promise<QmCapaAction> {
    const count = Array.from(this.capaActions.values()).filter((c) => c.hospitalId === data.hospitalId).length;
    const actionNumber = `CAPA-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const capa: QmCapaAction = {
      ...data,
      id: `capa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actionNumber,
      status: 'ASSIGNED',
      isVerifiedEffective: false,
      createdAt: new Date().toISOString(),
    };
    this.capaActions.set(capa.id, capa);

    if (data.incidentId) {
      const incident = this.incidents.get(data.incidentId);
      if (incident) {
        incident.status = 'CAPA_PENDING';
        this.incidents.set(incident.id, incident);
      }
    }

    logger.info('CAPA action assigned', {
      actionNumber,
      actionType: capa.actionType,
      targetDate: capa.targetCompletionDate,
    });
    return capa;
  }

  public async completeCapaAction(actionId: string, notes: string): Promise<QmCapaAction> {
    const capa = this.capaActions.get(actionId);
    if (!capa) throw new Error(`CAPA action ${actionId} not found.`);

    capa.status = 'PENDING_VERIFICATION';
    capa.completedAt = new Date().toISOString();
    capa.completionNotes = notes;
    this.capaActions.set(actionId, capa);

    logger.info('CAPA action completed by assignee; pending quality verification', {
      actionNumber: capa.actionNumber,
    });
    return capa;
  }

  public async verifyCapaEffectiveness(
    actionId: string,
    verifiedByUserId: string,
    isEffective: boolean
  ): Promise<QmCapaAction> {
    const capa = this.capaActions.get(actionId);
    if (!capa) throw new Error(`CAPA action ${actionId} not found.`);

    if (capa.status !== 'PENDING_VERIFICATION') {
      throw new Error(`CAPA action ${capa.actionNumber} cannot be verified until marked completed.`);
    }

    capa.isVerifiedEffective = isEffective;
    capa.verifiedByUserId = verifiedByUserId;
    capa.verifiedAt = new Date().toISOString();
    capa.status = isEffective ? 'VERIFIED_CLOSED' : 'IN_PROGRESS';
    this.capaActions.set(actionId, capa);

    if (capa.incidentId && isEffective) {
      const incident = this.incidents.get(capa.incidentId);
      if (incident) {
        incident.status = 'CLOSED';
        this.incidents.set(incident.id, incident);
      }
    }

    logger.info('CAPA effectiveness verified by quality auditor', {
      actionNumber: capa.actionNumber,
      isEffective,
      finalStatus: capa.status,
    });
    return capa;
  }

  // 5. Hospital-Acquired Infection (HAI) Surveillance
  public async recordHaiSurveillance(data: Omit<QmHaiSurveillance, 'id' | 'createdAt' | 'ratePer1000DeviceDays'>): Promise<QmHaiSurveillance> {
    // Standard denominator calculation: (1 infection / deviceDays) * 1000
    const ratePer1000 = Number(((1 / Math.max(1, data.deviceExposureDays)) * 1000).toFixed(2));

    const hai: QmHaiSurveillance = {
      ...data,
      id: `hai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ratePer1000DeviceDays: ratePer1000,
      createdAt: new Date().toISOString(),
    };
    this.haiSurveillances.set(hai.id, hai);

    logger.warn('Hospital-Acquired Infection (HAI) case logged', {
      patientId: hai.patientId,
      infectionType: hai.infectionType,
      organism: hai.causativeOrganism,
      ratePer1000,
    });
    return hai;
  }

  // 6. Hand Hygiene Audit
  public async recordHandHygieneAudit(data: Omit<QmHandHygieneAudit, 'id' | 'compliancePercentage'>): Promise<QmHandHygieneAudit> {
    const compliancePercentage = Number(
      ((data.compliantActions / data.opportunitiesObserved) * 100).toFixed(2)
    );

    const audit: QmHandHygieneAudit = {
      ...data,
      id: `hha-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      compliancePercentage,
    };
    this.handHygieneAudits.set(audit.id, audit);

    logger.info('Hand hygiene audit recorded', {
      departmentId: audit.departmentId,
      compliancePercentage,
    });
    return audit;
  }

  // 7. Medication Safety Event
  public async recordMedicationSafetyEvent(data: Omit<QmMedicationSafetyEvent, 'id' | 'reportedAt'>): Promise<QmMedicationSafetyEvent> {
    const event: QmMedicationSafetyEvent = {
      ...data,
      id: `medsaf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reportedAt: new Date().toISOString(),
    };
    this.medicationSafetyEvents.set(event.id, event);

    logger.warn('Medication safety / ADR event reported', {
      drugName: event.drugName,
      eventType: event.eventType,
      severity: event.severity,
    });
    return event;
  }

  // 8. Clinical Audits
  public async conductClinicalAudit(data: Omit<QmClinicalAudit, 'id' | 'complianceRatePercent'>): Promise<QmClinicalAudit> {
    const complianceRatePercent = Number(
      ((data.compliantRecords / data.sampleSize) * 100).toFixed(2)
    );

    const audit: QmClinicalAudit = {
      ...data,
      id: `clinaud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complianceRatePercent,
    };
    this.clinicalAudits.set(audit.id, audit);

    logger.info('Clinical compliance audit recorded', {
      auditTitle: audit.auditTitle,
      complianceRatePercent,
    });
    return audit;
  }

  // 9. Patient Complaints & Grievance
  public async registerPatientComplaint(data: Omit<QmPatientComplaint, 'id' | 'complaintNumber' | 'status' | 'createdAt'>): Promise<QmPatientComplaint> {
    const count = Array.from(this.complaints.values()).filter((c) => c.hospitalId === data.hospitalId).length;
    const complaintNumber = `COMPL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const complaint: QmPatientComplaint = {
      ...data,
      id: `compl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      complaintNumber,
      status: 'REGISTERED',
      createdAt: new Date().toISOString(),
    };
    this.complaints.set(complaint.id, complaint);

    logger.info('Patient grievance registered', {
      complaintNumber,
      category: complaint.category,
      priority: complaint.priority,
    });
    return complaint;
  }

  public async resolvePatientComplaint(complaintId: string, resolutionNotes: string): Promise<QmPatientComplaint> {
    const complaint = this.complaints.get(complaintId);
    if (!complaint) throw new Error(`Complaint ${complaintId} not found.`);

    complaint.status = 'RESOLVED';
    complaint.resolutionNotes = resolutionNotes;
    complaint.resolvedAt = new Date().toISOString();
    this.complaints.set(complaintId, complaint);

    logger.info('Patient grievance resolved', {
      complaintNumber: complaint.complaintNumber,
    });
    return complaint;
  }

  // 10. Hospital Risk Register
  public async assessHospitalRisk(
    data: Omit<QmRiskRegisterEntry, 'id' | 'inherentRiskScore' | 'status'> & {
      status?: 'ACTIVE' | 'MITIGATED' | 'ACCEPTED';
    }
  ): Promise<QmRiskRegisterEntry> {
    const inherentRiskScore = data.likelihoodScore * data.impactScore; // 1 to 25

    const risk: QmRiskRegisterEntry = {
      ...data,
      status: data.status || 'ACTIVE',
      id: `risk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inherentRiskScore,
    };
    this.riskRegister.set(risk.id, risk);

    logger.info('Hospital risk register entry updated', {
      riskTitle: risk.riskTitle,
      inherentRiskScore,
      status: risk.status,
    });
    return risk;
  }

  // 11. Quality Indicators (KPIs)
  public async setQualityIndicator(data: Omit<QmQualityIndicator, 'id' | 'updatedAt' | 'isWithinTarget'>): Promise<QmQualityIndicator> {
    const isWithinTarget = data.currentValue <= data.targetBenchmark;

    const indicator: QmQualityIndicator = {
      ...data,
      id: `ind-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isWithinTarget,
      updatedAt: new Date().toISOString(),
    };
    this.indicators.set(indicator.id, indicator);
    return indicator;
  }

  // 12. Controlled Documents (Policies & SOPs)
  public async publishControlledDocument(data: Omit<QmControlledDocument, 'id'>): Promise<QmControlledDocument> {
    const doc: QmControlledDocument = {
      ...data,
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      approvalStatus: 'APPROVED',
    };
    this.controlledDocuments.set(doc.id, doc);

    logger.info('Controlled hospital policy/SOP published', {
      documentNumber: doc.documentNumber,
      title: doc.title,
      version: doc.version,
    });
    return doc;
  }

  // 13. Mock Inspections & Accreditation Readiness
  public async conductMockInspection(data: Omit<QmMockInspection, 'id' | 'readinessPercentage'>): Promise<QmMockInspection> {
    const readinessPercentage = Number(
      ((data.compliantClauses / data.totalClausesChecked) * 100).toFixed(2)
    );

    const inspection: QmMockInspection = {
      ...data,
      id: `insp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      readinessPercentage,
    };
    this.mockInspections.set(inspection.id, inspection);

    logger.info('Mock accreditation inspection executed', {
      inspectionTitle: inspection.inspectionTitle,
      readinessPercentage,
      majorNonConformitiesCount: inspection.majorNonConformitiesCount,
    });
    return inspection;
  }

  public verifyTenantIsolation(orgA: string, orgB: string): boolean {
    const aIncidents = Array.from(this.incidents.values()).filter(i => i.organizationId === orgA);
    const bIncidents = Array.from(this.incidents.values()).filter(i => i.organizationId === orgB);
    const hasLeakage = aIncidents.some(i => i.organizationId === orgB) || bIncidents.some(i => i.organizationId === orgA);
    return !hasLeakage;
  }
}

export const qualityAdvancedService = new QualityAdvancedService();
