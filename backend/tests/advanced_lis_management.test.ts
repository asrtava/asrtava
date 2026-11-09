import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lisAdvancedService } from '../src/modules/diagnostics/lis-advanced.service';

describe('ASRTAVA Complete Laboratory Information System (LIS) & Pathology (Milestone v1.10.0)', () => {
  const hospitalId = 'hosp-mumbai-01';
  const techId = 'tech-biochem-01';
  const pathologistId = 'path-lead-dr-sharma';

  let createdDeptId = '';
  let createdParamId = '';
  let createdSpecimenId = '';
  let normalResultId = '';
  let criticalResultId = '';

  it('Scenario 1: Registers laboratory department (Clinical Biochemistry) with room location', async () => {
    const dept = await lisAdvancedService.createDepartment({
      hospitalId,
      code: 'BIOCHEM',
      name: 'Clinical Biochemistry & Immunoassay',
      locationRoom: 'Lab Room 204, Block B',
    });

    assert.ok(dept.id);
    assert.equal(dept.code, 'BIOCHEM');
    assert.equal(dept.isActive, true);
    createdDeptId = dept.id;
  });

  it('Scenario 2: Registers test parameter with age/sex biological reference ranges and panic thresholds', async () => {
    const param = await lisAdvancedService.registerTestParameter({
      hospitalId,
      departmentId: createdDeptId,
      parameterCode: 'K_POTASSIUM',
      parameterName: 'Serum Potassium (K+)',
      unitOfMeasure: 'mmol/L',
      loincCode: '2823-3',
      methodology: 'Ion Selective Electrode (ISE)',
      refRangeMaleMin: 3.5,
      refRangeMaleMax: 5.1,
      refRangeFemaleMin: 3.5,
      refRangeFemaleMax: 5.1,
      criticalLow: 2.8,
      criticalHigh: 6.5,
      turnaroundTargetMins: 60,
    });

    assert.ok(param.id);
    assert.equal(param.parameterCode, 'K_POTASSIUM');
    assert.equal(param.criticalHigh, 6.5);
    createdParamId = param.id;
  });

  it('Scenario 3: Accessions specimen and generates unique accession number and 2D barcode', async () => {
    const specimen = await lisAdvancedService.accessionSpecimen({
      hospitalId,
      patientId: 'pat-901',
      specimenType: 'SERUM',
      containerType: 'SST_GOLD',
      collectedByUserId: techId,
    });

    assert.ok(specimen.id);
    assert.ok(specimen.accessionNumber.startsWith('ACC-2026-'));
    assert.ok(specimen.barcodeString.includes(specimen.accessionNumber));
    assert.equal(specimen.processingStatus, 'COLLECTED');
    createdSpecimenId = specimen.id;
  });

  it('Scenario 4: Rejects hemolyzed specimen and creates automated recollection ticket', async () => {
    const res = await lisAdvancedService.rejectSpecimen(
      createdSpecimenId,
      techId,
      'Grossly Hemolyzed (+++) sample unsuitable for potassium estimation'
    );

    assert.equal(res.specimen.processingStatus, 'REJECTED');
    assert.equal(res.specimen.specimenCondition, 'HEMOLYZED');
    assert.equal(res.rejection.recollectionRequested, true);
  });

  it('Scenario 5: Records normal result within biological reference limits (Flag = NORMAL)', async () => {
    const res = await lisAdvancedService.recordTestResult({
      hospitalId,
      specimenId: createdSpecimenId,
      parameterId: createdParamId,
      numericValue: 4.2,
      technologistUserId: techId,
      patientSex: 'MALE',
    });

    assert.ok(res.result.id);
    assert.equal(res.result.numericValue, 4.2);
    assert.equal(res.result.abnormalityFlag, 'NORMAL');
    assert.equal(res.result.validationStatus, 'ENTERED');
    assert.equal(res.criticalAlert, null);
    normalResultId = res.result.id;
  });

  it('Scenario 6: Records abnormal high result outside reference range (Flag = ABNORMAL_HIGH)', async () => {
    const res = await lisAdvancedService.recordTestResult({
      hospitalId,
      specimenId: createdSpecimenId,
      parameterId: createdParamId,
      numericValue: 5.6, // Above 5.1 but below critical 6.5
      technologistUserId: techId,
      patientSex: 'MALE',
    });

    assert.equal(res.result.abnormalityFlag, 'ABNORMAL_HIGH');
    assert.equal(res.criticalAlert, null);
  });

  it('Scenario 7: Detects critical panic value (Potassium >= 6.5 mmol/L) and generates urgent alert', async () => {
    const res = await lisAdvancedService.recordTestResult({
      hospitalId,
      specimenId: createdSpecimenId,
      parameterId: createdParamId,
      numericValue: 6.9, // Severe Hyperkalemia
      technologistUserId: techId,
      patientSex: 'MALE',
    });

    assert.equal(res.result.abnormalityFlag, 'CRITICAL_PANIC');
    assert.ok(res.criticalAlert);
    assert.equal(res.criticalAlert.notificationChannel, 'TELEPHONE_READ_BACK');
    criticalResultId = res.result.id;
  });

  it('Scenario 8: Enforces technologist technical validation gate prior to medical authorization', async () => {
    const validated = await lisAdvancedService.validateResultTechnologist(criticalResultId, techId);
    assert.equal(validated.validationStatus, 'TECHNICALLY_VALIDATED');
    assert.equal(validated.technologistUserId, techId);
  });

  it('Scenario 9: Authorizes report with Pathologist digital credentials and seals status', async () => {
    const authorized = await lisAdvancedService.authorizeReportPathologist(criticalResultId, pathologistId);
    assert.equal(authorized.validationStatus, 'PATHOLOGIST_AUTHORIZED');
    assert.equal(authorized.pathologistUserId, pathologistId);
    assert.ok(authorized.authorizedAt);
  });

  it('Scenario 10: Records controlled amendment to authorized result with documented reason', async () => {
    const amended = await lisAdvancedService.amendAuthorizedResult(
      criticalResultId,
      pathologistId,
      6.85,
      'Re-run on secondary analyzer confirms 6.85 mmol/L'
    );

    assert.equal(amended.validationStatus, 'AMENDED');
    assert.equal(amended.isAmended, true);
    assert.equal(amended.numericValue, 6.85);
    assert.ok(amended.amendmentReason.includes('Re-run on secondary analyzer'));
  });

  it('Scenario 11: Records microbiology culture incubation, organism isolation (E. coli), and colony counts', async () => {
    const culture = await lisAdvancedService.recordMicrobiologyCulture({
      hospitalId,
      specimenId: createdSpecimenId,
      organismIsolated: 'Escherichia coli (ESBL Producer)',
      colonyCountCfuMl: '> 100,000 CFU/mL',
      growthStatus: 'GROWTH_OBSERVED',
      gramStainResult: 'Gram-negative bacilli',
    });

    assert.ok(culture.id);
    assert.equal(culture.growthStatus, 'GROWTH_OBSERVED');
    assert.equal(culture.organismIsolated, 'Escherichia coli (ESBL Producer)');
  });

  it('Scenario 12: Documents histopathology gross description, cassette count, and microscopic diagnosis', async () => {
    const histo = await lisAdvancedService.recordHistopathologyCase({
      hospitalId,
      biopsyNumber: 'BIO-2026-0044',
      specimenId: createdSpecimenId,
      tissueSite: 'Gastric Antrum Endoscopic Biopsy',
      grossDescription: 'Three mucosal fragments measuring 0.2 x 0.2 cm, fixed in formalin',
      cassetteCount: 1,
      microscopicFindings: 'Chronic superficial gastritis with focal intestinal metaplasia; no dysplasia or malignancy seen',
      pathologicDiagnosis: 'Chronic Atrophic Gastritis, H. pylori positive on Giemsa stain',
      reportingPathologistId: pathologistId,
    });

    assert.ok(histo.id);
    assert.equal(histo.biopsyNumber, 'BIO-2026-0044');
    assert.ok(histo.pathologicDiagnosis.includes('Chronic Atrophic Gastritis'));
  });

  it('Scenario 13: Calculates IQC Z-score and evaluates in-control run (|Z| <= 1.0)', async () => {
    const qc = await lisAdvancedService.recordQCMeasurement({
      hospitalId,
      controlLotNumber: 'BIO-QC-LOT-2026A',
      parameterId: createdParamId,
      targetMean: 4.0,
      standardDeviation: 0.1,
      measuredValue: 4.05, // Z = (4.05 - 4.0) / 0.1 = +0.50
    });

    assert.equal(qc.zScore, 0.5);
    assert.equal(qc.runStatus, 'IN_CONTROL');
    assert.equal(qc.westgardViolation, null);
  });

  it('Scenario 14: Flags Westgard 1_3s rejection rule when |Z| > 3.0 and sets run status to OUT_OF_CONTROL_REJECT', async () => {
    const qc = await lisAdvancedService.recordQCMeasurement({
      hospitalId,
      controlLotNumber: 'BIO-QC-LOT-2026A',
      parameterId: createdParamId,
      targetMean: 4.0,
      standardDeviation: 0.1,
      measuredValue: 4.35, // Z = (4.35 - 4.0) / 0.1 = +3.50 (Violation 1_3s)
    });

    assert.equal(qc.zScore, 3.5);
    assert.equal(qc.runStatus, 'OUT_OF_CONTROL_REJECT');
    assert.equal(qc.westgardViolation, '1_3S');
  });

  it('Scenario 15: Evaluates Westgard 1_2s warning rule when 2.0 < |Z| <= 3.0', async () => {
    const qc = await lisAdvancedService.recordQCMeasurement({
      hospitalId,
      controlLotNumber: 'BIO-QC-LOT-2026A',
      parameterId: createdParamId,
      targetMean: 4.0,
      standardDeviation: 0.1,
      measuredValue: 4.22, // Z = (4.22 - 4.0) / 0.1 = +2.20 (Warning 1_2s)
    });

    assert.equal(qc.zScore, 2.2);
    assert.equal(qc.runStatus, 'WARNING');
    assert.equal(qc.westgardViolation, '1_2S');
  });

  it('Scenario 16: Verifies multi-hospital tenant isolation in LIS test catalog', async () => {
    const hosp2Param = await lisAdvancedService.registerTestParameter({
      hospitalId: 'hosp-kolkata-02',
      departmentId: createdDeptId,
      parameterCode: 'ALT_SGPT',
      parameterName: 'Alanine Aminotransferase (ALT)',
      unitOfMeasure: 'U/L',
      refRangeMaleMin: 10,
      refRangeMaleMax: 40,
    });

    assert.equal(hosp2Param.hospitalId, 'hosp-kolkata-02');
    assert.notEqual(hosp2Param.hospitalId, hospitalId);
  });
});

