import { describe, it } from 'node:test';
import assert from 'node:assert';
import { qualityAdvancedService } from '../src/modules/quality/quality-advanced.service';

describe('ASRTAVA Advanced Quality Management & Accreditation Test Suite', () => {
  const testOrgId = 'org-apex-healthcare';
  const testHospitalId = 'hosp-apex-main';
  const testPatientId = 'pat-qm-rahul';
  const testInvestigatorId = 'usr-qm-lead-mehta';

  let testIncidentId: string;
  let testCapaId: string;
  let testComplaintId: string;

  it('1. Reports patient safety incident (Patient Fall) with severity and department location', async () => {
    const incident = await qualityAdvancedService.reportIncident({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      category: 'PATIENT_FALL',
      severity: 'SERIOUS_ADVERSE',
      incidentDate: '2026-11-12T04:15:00Z',
      patientId: testPatientId,
      isConfidential: false,
      description: 'Inpatient slipped while unassisted ambulation to washroom; bed side rails were lowered.',
      immediateActionTaken: 'Duty doctor examined patient; CT head ordered (normal); vitals stable; rails elevated.',
      status: 'REPORTED',
    });

    assert.ok(incident.id);
    assert.ok(incident.incidentNumber.startsWith('INC-'));
    assert.strictEqual(incident.category, 'PATIENT_FALL');
    assert.strictEqual(incident.severity, 'SERIOUS_ADVERSE');
    testIncidentId = incident.id;
  });

  it('2. Assigns lead investigator and records initial clinical investigation timeline', async () => {
    const inv = await qualityAdvancedService.assignInvestigation({
      incidentId: testIncidentId,
      leadInvestigatorUserId: testInvestigatorId,
      investigationNotes: 'Reviewed nursing handover log and bell call log. Call bell was placed out of patient reach.',
      witnessStatements: 'Duty nurse stated bell wire was disconnected during previous bed cleaning round.',
      timelineSummary: '04:10 AM - Patient awoke; 04:14 AM - Attempted unassisted transfer; 04:15 AM - Fall occurred.',
      contributingFactors: 'Call bell disconnected; nurse delayed on emergency crash cart duty in room 202.',
    });

    assert.ok(inv.id);
    assert.strictEqual(inv.leadInvestigatorUserId, testInvestigatorId);
    assert.strictEqual(inv.status, 'IN_PROGRESS');
  });

  it('3. Executes Root Cause Analysis (RCA) using 5-Whys methodology', async () => {
    const rca = await qualityAdvancedService.performRootCauseAnalysis({
      incidentId: testIncidentId,
      methodology: 'FIVE_WHYS',
      problemStatement: 'High-fall-risk patient fell unassisted in ward at night.',
      whySteps: [
        'Why 1: Patient attempted to reach washroom without nursing assistance.',
        'Why 2: Patient could not press the nurse call bell.',
        'Why 3: The call bell handset was hooked onto wall console rather than clipped to bedsheet.',
        'Why 4: Housekeeping unclipped bell during 02:00 AM linen change and failed to re-anchor it.',
        'Why 5: Housekeeping checklist lacked mandatory bedside equipment verification step upon bed turnover.',
      ],
      rootCauseConclusion: 'Absence of mandatory post-cleaning call-bell positioning verification checklist.',
      createdByUserId: testInvestigatorId,
    });

    assert.ok(rca.id);
    assert.strictEqual(rca.methodology, 'FIVE_WHYS');
    assert.strictEqual(rca.whySteps.length, 5);
  });

  it('4. Creates closed-loop Corrective and Preventive Action (CAPA) with verification criteria', async () => {
    const capa = await qualityAdvancedService.createCapaAction({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      incidentId: testIncidentId,
      actionType: 'CORRECTIVE',
      title: 'Mandatory Bedside Call-Bell & Rail Positioning Audit on Turnover',
      description: 'Update housekeeping and ward nursing checklists with mandatory dual check on call bell tethering.',
      assignedToUserId: 'usr-nurse-manager-sharma',
      targetCompletionDate: '2026-11-20',
      verificationCriteria: '100% compliance over 14 consecutive days of random nighttime nursing supervisor audits.',
    });

    assert.ok(capa.id);
    assert.ok(capa.actionNumber.startsWith('CAPA-'));
    assert.strictEqual(capa.status, 'ASSIGNED');
    assert.strictEqual(capa.isVerifiedEffective, false);
    testCapaId = capa.id;
  });

  it('5. Rejects effectiveness verification if CAPA has not yet been completed by assignee', async () => {
    await assert.rejects(
      async () => {
        await qualityAdvancedService.verifyCapaEffectiveness(testCapaId, testInvestigatorId, true);
      },
      /cannot be verified until marked completed/
    );
  });

  it('6. Assigned nurse manager completes CAPA implementation with completion notes', async () => {
    const completed = await qualityAdvancedService.completeCapaAction(
      testCapaId,
      'Revised SOP-NUR-041 deployed; trained 42 ward nurses and 18 housekeeping staff.'
    );

    assert.strictEqual(completed.status, 'PENDING_VERIFICATION');
    assert.ok(completed.completedAt);
  });

  it('7. Independent Quality Auditor verifies CAPA effectiveness and closes incident loop', async () => {
    const verified = await qualityAdvancedService.verifyCapaEffectiveness(
      testCapaId,
      testInvestigatorId,
      true // Effective
    );

    assert.strictEqual(verified.status, 'VERIFIED_CLOSED');
    assert.strictEqual(verified.isVerifiedEffective, true);
    assert.ok(verified.verifiedAt);
  });

  it('8. Logs Hospital-Acquired Infection (HAI) surveillance case (CLABSI) with causative pathogen', async () => {
    const hai = await qualityAdvancedService.recordHaiSurveillance({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: testPatientId,
      infectionType: 'CLABSI',
      detectedDate: '2026-11-12',
      deviceExposureDays: 14,
      causativeOrganism: 'Klebsiella pneumoniae',
      antimicrobialResistance: 'ESBL Positive, Colistin Sensitive',
      surveillanceClassification: 'CONFIRMED_HAI',
      outcome: 'TREATED_ANTIBIOTICS',
    });

    assert.ok(hai.id);
    assert.strictEqual(hai.infectionType, 'CLABSI');
    assert.strictEqual(hai.causativeOrganism, 'Klebsiella pneumoniae');
  });

  it('9. Calculates HAI benchmark rate per 1,000 central line device-days accurately', async () => {
    // 1 infection / 14 device days * 1000 = 71.43
    const hai = await qualityAdvancedService.recordHaiSurveillance({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: 'pat-icu-02',
      infectionType: 'CAUTI',
      detectedDate: '2026-11-12',
      deviceExposureDays: 20, // 1 / 20 * 1000 = 50.00
      causativeOrganism: 'Pseudomonas aeruginosa',
      surveillanceClassification: 'CONFIRMED_HAI',
      outcome: 'IMPROVED',
    });

    assert.strictEqual(hai.ratePer1000DeviceDays, 50.0);
  });

  it('10. Conducts WHO 5-Moments hand hygiene compliance audit and calculates percentage', async () => {
    const audit = await qualityAdvancedService.recordHandHygieneAudit({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      auditDate: '2026-11-12',
      auditorUserId: testInvestigatorId,
      opportunitiesObserved: 120,
      compliantActions: 102, // 102 / 120 = 85.00%
      notes: 'ICU hand hygiene round during morning doctor rounds.',
    });

    assert.ok(audit.id);
    assert.strictEqual(audit.compliancePercentage, 85.0);
  });

  it('11. Logs medication safety near-miss event (Wrong Dose intercepted prior to administration)', async () => {
    const medEvent = await qualityAdvancedService.recordMedicationSafetyEvent({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: testPatientId,
      eventType: 'WRONG_DOSE',
      drugName: 'Insulin Glargine',
      severity: 'NEAR_MISS',
      immediateReversalAction: 'Second nurse double-checked syringe before injection and stopped 40 units vs 14 units.',
      outcome: 'No harm reached patient; revised order verified.',
    });

    assert.ok(medEvent.id);
    assert.strictEqual(medEvent.severity, 'NEAR_MISS');
    assert.strictEqual(medEvent.eventType, 'WRONG_DOSE');
  });

  it('12. Executes clinical documentation completeness audit and calculates compliance rate', async () => {
    const audit = await qualityAdvancedService.conductClinicalAudit({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      auditTitle: 'Discharge Summary 24-Hour Finalization Audit',
      auditType: 'DISCHARGE_SUMMARY',
      sampleSize: 50,
      compliantRecords: 47, // 47 / 50 = 94.00%
      auditorUserId: testInvestigatorId,
      recommendations: 'Follow up with Orthopedic resident on 3 incomplete summaries.',
    });

    assert.ok(audit.id);
    assert.strictEqual(audit.complianceRatePercent, 94.0);
  });

  it('13. Registers patient grievance and records formal resolution', async () => {
    const complaint = await qualityAdvancedService.registerPatientComplaint({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      patientId: testPatientId,
      category: 'WAIT_TIME',
      description: 'Patient waited 55 minutes beyond scheduled slot in Cardiology OPD.',
      priority: 'MEDIUM',
    });

    assert.ok(complaint.id);
    assert.strictEqual(complaint.status, 'REGISTERED');
    testComplaintId = complaint.id;

    const resolved = await qualityAdvancedService.resolvePatientComplaint(
      testComplaintId,
      'Apologized for delay due to emergency code in cath lab; provided priority token on next visit.'
    );
    assert.strictEqual(resolved.status, 'RESOLVED');
    assert.ok(resolved.resolvedAt);
  });

  it('14. Assesses hospital operational risk and computes inherent risk matrix score', async () => {
    const risk = await qualityAdvancedService.assessHospitalRisk({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      riskTitle: 'Prolonged Municipal Power Outage Exceeding Diesel Generator Capacity',
      riskCategory: 'OPERATIONAL',
      likelihoodScore: 2, // Low likelihood (2/5)
      impactScore: 5,     // Catastrophic impact on ICU/OT (5/5)
      existingControls: 'Dual 500kVA Cummins Diesel Generators with 48-hour fuel reserve.',
      mitigationPlan: 'Bi-weekly load testing and contracted priority diesel tanker supply agreement.',
    });

    assert.ok(risk.id);
    assert.strictEqual(risk.inherentRiskScore, 10); // 2 * 5
    assert.strictEqual(risk.status, 'ACTIVE');
  });

  it('15. Configures quality indicator (KPI) and evaluates target benchmark compliance', async () => {
    const indicator = await qualityAdvancedService.setQualityIndicator({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      indicatorCode: 'QI-FALL-RATE',
      name: 'Inpatient Fall Rate per 1,000 Patient Days',
      numeratorDefinition: 'Total number of documented patient falls',
      denominatorDefinition: 'Total inpatient bed days / 1000',
      measurementUnit: 'RATE_PER_1000',
      targetBenchmark: 1.5,
      currentValue: 0.8, // 0.8 <= 1.5 -> compliant
      reportingPeriod: 'MONTHLY',
    });

    assert.ok(indicator.id);
    assert.strictEqual(indicator.isWithinTarget, true);
  });

  it('16. Conducts mock NABH accreditation inspection and calculates readiness percentage', async () => {
    const mock = await qualityAdvancedService.conductMockInspection({
      organizationId: testOrgId,
      hospitalId: testHospitalId,
      inspectionTitle: 'Pre-Assessment NABH 5th Edition Internal Mock Survey',
      targetFramework: 'NABH_5TH_EDITION',
      inspectionDate: '2026-11-12',
      leadAssessorUserId: testInvestigatorId,
      totalClausesChecked: 100,
      compliantClauses: 92, // 92 / 100 = 92.00%
      majorNonConformitiesCount: 2,
      capaActionIds: [testCapaId],
      status: 'COMPLETED',
    });

    assert.ok(mock.id);
    assert.strictEqual(mock.readinessPercentage, 92.0);
    assert.strictEqual(mock.majorNonConformitiesCount, 2);
  });
});

