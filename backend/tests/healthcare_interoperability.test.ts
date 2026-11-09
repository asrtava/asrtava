import test from 'node:test';
import assert from 'node:assert/strict';
import { InteroperabilityEngineService } from '../src/modules/integrations/interop.service';
import { FHIRService } from '../src/modules/integrations/providers/adapters/fhir.service';
import { HL7Service } from '../src/modules/integrations/providers/adapters/hl7.service';

test('ASRTAVA Healthcare Interoperability, HL7, FHIR, DICOM & Medical Device Integration Suite', async (t) => {
  const hospitalId = 'hosp-apollo-delhi';
  const userId = 'usr-pathologist-9901';

  // ------------------------------------------------------------
  // Scenario 1: HL7 v2 Message Parsing & Acknowledgement
  // ------------------------------------------------------------
  await t.test('Scenario 1: HL7 v2 Message Parsing, Segment Extraction & ACK Generation', () => {
    const rawHL7 = [
      'MSH|^~\\&|LAB_SYS|DELHI_HOSP|ASRTAVA_HMS|MAIN_CAMPUS|20261109120000||ORU^R01|MSG-CTRL-8891|P|2.5.1',
      'PID|1||UHID-2026-8801||Sharma^Vikram||19850615|M|||Connaught Place^New Delhi^^110001||+919811122233',
      'PV1|1|O|||||DOC-102^Gupta^Sanjay|||||||||||VISIT-7701',
      'OBR|1|ORD-9901|FILL-9901|CBC^Complete Blood Count|||20261109113000',
      'OBX|1|NM|6690-2^Leukocytes|1|8.2|10^3/uL|4.0-11.0|N|||F',
      'OBX|2|NM|718-7^Hemoglobin|1|14.5|g/dL|13.0-17.0|N|||F',
    ].join('\r\n');

    const result = InteroperabilityEngineService.processInboundHL7(rawHL7, hospitalId);

    assert.equal(result.success, true);
    assert.equal(result.isDuplicate, false);
    assert.equal(result.messageType, 'ORU^R01');
    assert.equal(result.messageControlId, 'MSG-CTRL-8891');
    assert.ok(result.ack.includes('MSA|AA|MSG-CTRL-8891'));
    assert.equal(result.parsed.pid?.patientName, 'Sharma^Vikram');
    assert.equal(result.parsed.obxs?.length, 2);
    assert.equal(result.parsed.obxs?.[0].observationIdentifier, '6690-2^Leukocytes');
  });

  // ------------------------------------------------------------
  // Scenario 2: HL7 Duplicate Message Detection & Rejection
  // ------------------------------------------------------------
  await t.test('Scenario 2: HL7 Duplicate Control ID Rejection (Idempotency Defense)', () => {
    const rawHL7 = [
      'MSH|^~\\&|LAB_SYS|DELHI_HOSP|ASRTAVA_HMS|MAIN_CAMPUS|20261109120000||ORU^R01|MSG-CTRL-8891|P|2.5.1',
      'PID|1||UHID-2026-8801||Sharma^Vikram||19850615|M',
    ].join('\r\n');

    // Replaying identical control ID: MSG-CTRL-8891
    const duplicateResult = InteroperabilityEngineService.processInboundHL7(rawHL7, hospitalId);

    assert.equal(duplicateResult.success, false);
    assert.equal(duplicateResult.isDuplicate, true);
    assert.ok(duplicateResult.ack.includes('MSA|AR|MSG-CTRL-8891'));
    assert.ok(duplicateResult.ack.includes('DUPLICATE_MESSAGE_DETECTED'));
  });

  // ------------------------------------------------------------
  // Scenario 3: FHIR R4 CapabilityStatement & Resource Mapping
  // ------------------------------------------------------------
  await t.test('Scenario 3: FHIR R4 CapabilityStatement & Multi-Resource Transformations', () => {
    const capability = InteroperabilityEngineService.getCapabilityStatement();
    assert.equal(capability.resourceType, 'CapabilityStatement');
    assert.equal(capability.fhirVersion, '4.0.1');
    assert.ok(capability.rest[0].resource.some((r: any) => r.type === 'Patient'));
    assert.ok(capability.rest[0].resource.some((r: any) => r.type === 'Observation'));
    assert.ok(capability.rest[0].resource.some((r: any) => r.type === 'Encounter'));

    // Patient Resource transformation
    const patientFHIR = FHIRService.toFHIRPatient({
      id: 'pat-101',
      uhid: 'UHID-2026-101',
      firstName: 'Ananya',
      lastName: 'Iyer',
      gender: 'female',
      dateOfBirth: '1995-03-21',
      phone: '+919876501234',
      abhaId: 'ananya.iyer@abdm',
    });
    assert.equal(patientFHIR.resourceType, 'Patient');
    assert.equal(patientFHIR.gender, 'female');
    assert.equal(patientFHIR.identifier.length, 2);
    assert.equal(patientFHIR.identifier[1].value, 'ananya.iyer@abdm');

    // Observation Resource transformation
    const obsFHIR = FHIRService.toFHIRObservation({
      id: 'obs-201',
      patientId: 'pat-101',
      patientUhid: 'UHID-2026-101',
      code: '718-7',
      display: 'Hemoglobin',
      value: 13.8,
      unit: 'g/dL',
      referenceRangeLow: 12.0,
      referenceRangeHigh: 15.5,
      effectiveDateTime: '2026-11-09T10:00:00Z',
    });
    assert.equal(obsFHIR.resourceType, 'Observation');
    assert.equal(obsFHIR.status, 'final');
    assert.equal((obsFHIR as any).valueQuantity.value, 13.8);

    // Bundle generation
    const bundle = InteroperabilityEngineService.createBundle([patientFHIR, obsFHIR], 'searchset');
    assert.equal(bundle.resourceType, 'Bundle');
    assert.equal(bundle.total, 2);
    assert.equal(bundle.entry.length, 2);
  });

  // ------------------------------------------------------------
  // Scenario 4: DICOM Metadata Extraction & Ingestion
  // ------------------------------------------------------------
  await t.test('Scenario 4: DICOM Medical Imaging Header Attribute Ingestion', () => {
    const rawDicomHeaders = {
      StudyInstanceUID: '1.2.840.113619.2.55.3.20261109.99128',
      SeriesInstanceUID: '1.2.840.113619.2.55.3.20261109.99128.1',
      SOPInstanceUID: '1.2.840.113619.2.55.3.20261109.99128.1.1',
      PatientID: 'UHID-2026-8801',
      PatientName: 'Sharma^Vikram',
      AccessionNumber: 'ACC-2026-0044',
      Modality: 'CT',
      StudyDescription: 'CT Chest with High Resolution Contrast',
      StudyDate: '20261109',
      NumberOfStudyRelatedSeries: 4,
      NumberOfStudyRelatedInstances: 320,
      ScheduledStationAETitle: 'CT_SCANNER_02',
    };

    const parsed = InteroperabilityEngineService.parseDICOMMetadata(rawDicomHeaders);

    assert.equal(parsed.studyInstanceUid, '1.2.840.113619.2.55.3.20261109.99128');
    assert.equal(parsed.modality, 'CT');
    assert.equal(parsed.accessionNumber, 'ACC-2026-0044');
    assert.equal(parsed.seriesCount, 4);
    assert.equal(parsed.instanceCount, 320);

    // Reject malformed payload missing StudyInstanceUID
    assert.throws(() => {
      InteroperabilityEngineService.parseDICOMMetadata({ Modality: 'MR' });
    }, /DICOM_VALIDATION_ERROR/);
  });

  // ------------------------------------------------------------
  // Scenario 5: DICOM Modality Worklist (MWL) Emulation
  // ------------------------------------------------------------
  await t.test('Scenario 5: DICOM Modality Worklist (MWL) Query for Radiology Scanners', () => {
    const mwl = InteroperabilityEngineService.queryModalityWorklist('CT_CONSOLE_01', 'CT');

    assert.ok(Array.isArray(mwl));
    assert.ok(mwl.length > 0);
    assert.equal(mwl[0].scheduledStationAETitle, 'CT_CONSOLE_01');
    assert.equal(mwl[0].modality, 'CT');
    assert.ok(mwl[0].accessionNumber.startsWith('ACC-'));
  });

  // ------------------------------------------------------------
  // Scenario 6: Ambiguous Study Quarantine & Manual Reconciliation
  // ------------------------------------------------------------
  await t.test('Scenario 6: Ambiguous Study Quarantine & Clinical Reconciliation Gate', () => {
    const studyUid = '1.2.840.113619.2.55.3.20261109.77123';
    const patientId = 'UHID-2026-8801';
    const orderId = 'RAD-ORD-5501';

    // Must require clinical justification notes
    assert.throws(() => {
      InteroperabilityEngineService.reconcileAmbiguousStudy(studyUid, patientId, orderId, userId, '');
    }, /RECONCILIATION_ERROR/);

    const reconciled = InteroperabilityEngineService.reconcileAmbiguousStudy(
      studyUid,
      patientId,
      orderId,
      userId,
      'Confirmed patient identity via national ID card and physical wristband scan at CT gantry'
    );

    assert.equal(reconciled.reconciled, true);
    assert.equal(reconciled.studyInstanceUid, studyUid);
    assert.equal(reconciled.patientId, patientId);
    assert.ok(reconciled.reconciledAt);
  });

  // ------------------------------------------------------------
  // Scenario 7: ASTM 1394-97 Multi-Analyte Packet Ingestion
  // ------------------------------------------------------------
  await t.test('Scenario 7: ASTM 1394-97 Hematology Analyzer Protocol Parsing', () => {
    const rawASTM = [
      'H|\\^&|||SYS-XN-1000^Sysmex|||||||P|1394-97|20261109121500',
      'P|1||UHID-2026-8801||Verma^Arjun||19820410|M',
      'O|1|SPEC-BARCODE-9941||^^^CBC|R|20261109120000|||||A||||||||||||||F',
      'R|1|^^^WBC^White Blood Cell|8.5|10^3/uL|4.0-11.0|N||F||20261109121400',
      'R|2|^^^RBC^Red Blood Cell|4.8|10^6/uL|4.5-5.9|N||F||20261109121400',
      'R|3|^^^HGB^Hemoglobin|15.2|g/dL|13.5-17.5|N||F||20261109121400',
      'R|4|^^^PLT^Platelets|245|10^3/uL|150-450|N||F||20261109121400',
      'L|1|N',
    ].join('\r\n');

    const readings = InteroperabilityEngineService.parseASTM1394(rawASTM);

    assert.equal(readings.length, 4);
    assert.equal(readings[0].specimenBarcode, 'SPEC-BARCODE-9941');
    assert.equal(readings[0].testCode, 'WBC');
    assert.equal(readings[0].observedValue, '8.5');
    assert.equal(readings[0].units, '10^3/uL');
    assert.equal(readings[0].abnormalFlag, 'NORMAL');
    assert.equal(readings[2].testCode, 'HGB');
    assert.equal(readings[2].observedValue, '15.2');
  });

  // ------------------------------------------------------------
  // Scenario 8: Panic Value Flagging & Pathologist Approval Gate
  // ------------------------------------------------------------
  await t.test('Scenario 8: Critical Panic Value Flagging & Clinical Approval Gate', () => {
    const rawCriticalASTM = [
      'H|\\^&|||ROCHE-COBAS-c311|||||||P|1394-97',
      'P|1||UHID-2026-9902||Mehta^Sunita||19600101|F',
      'O|1|SPEC-BARCODE-CRIT-01||^^^BIOCHEM',
      'R|1|^^^POTASSIUM^Serum Potassium|7.2|mmol/L|3.5-5.1|HH||F', // Panic High Potassium
      'L|1|N',
    ].join('\r\n');

    const criticalReadings = InteroperabilityEngineService.parseASTM1394(rawCriticalASTM);
    assert.equal(criticalReadings[0].abnormalFlag, 'CRITICAL');

    // Without pathologist sign-off: Result is quarantined
    const unapproved = InteroperabilityEngineService.verifyDeviceResults('pkt-101', criticalReadings);
    assert.equal(unapproved.approved, false);
    assert.equal(unapproved.hasPanicValues, true);
    assert.equal(unapproved.auditStatus, 'QUARANTINED_PENDING_PATHOLOGIST_PANIC_APPROVAL');

    // Pathologist verifies and approves
    const approved = InteroperabilityEngineService.verifyDeviceResults('pkt-101', criticalReadings, userId);
    assert.equal(approved.approved, true);
    assert.equal(approved.hasPanicValues, true);
    assert.equal(approved.auditStatus, 'APPROVED_FOR_CLINICAL_CHART');
  });

  // ------------------------------------------------------------
  // Scenario 9: Clinical Terminology Code Concept Mapping
  // ------------------------------------------------------------
  await t.test('Scenario 9: Concept Mapping: Local Lab to LOINC & ICD-10 to SNOMED-CT', () => {
    // Local to LOINC
    const wbcMap = InteroperabilityEngineService.mapTerminology('LOCAL_LAB', 'CBC_WBC', 'LOINC');
    assert.equal(wbcMap.targetCode, '6690-2');
    assert.equal(wbcMap.equivalence, 'equal');

    const tropMap = InteroperabilityEngineService.mapTerminology('LOCAL_LAB', 'CARDIAC_TROP_I', 'LOINC');
    assert.equal(tropMap.targetCode, '10839-9');
    assert.equal(tropMap.equivalence, 'equal');

    // ICD-10 to SNOMED-CT
    const icdMap = InteroperabilityEngineService.mapTerminology('ICD_10', 'I21.9', 'SNOMED_CT');
    assert.equal(icdMap.targetCode, '22298006');
    assert.equal(icdMap.targetDisplay, 'Myocardial infarction (disorder)');

    // Inexact fallback for unmapped code
    const unmapped = InteroperabilityEngineService.mapTerminology('LOCAL_LAB', 'CUSTOM_UNKNOWN_CODE', 'LOINC');
    assert.equal(unmapped.equivalence, 'inexact');
  });

  // ------------------------------------------------------------
  // Scenario 10: Insurance Pre-Authorization & Claim Filing (NHCX)
  // ------------------------------------------------------------
  await t.test('Scenario 10: Insurance Pre-Authorization & NHCX Claim Settlement', () => {
    // Submit Pre-Auth
    const preauth = InteroperabilityEngineService.submitPreauthorization({
      payerCode: 'STAR_HEALTH',
      patientId: 'UHID-2026-8801',
      policyNumber: 'SH-POL-2026-9921',
      diagnosisIcd10: 'I21.9',
      proposedTreatment: 'Percutaneous Coronary Intervention (PCI)',
      estimatedCost: 85000,
      requestedAmount: 85000,
    });

    assert.ok(preauth.preauthId.startsWith('PRE-'));
    assert.equal(preauth.status, 'approved');
    assert.equal(preauth.approvedAmount, 76500); // 90% auto-approval
    assert.ok(preauth.referenceNumber.startsWith('NHCX-REF-'));

    // Submit Final Claim
    const claim = InteroperabilityEngineService.submitClaimFiling({
      preauthId: preauth.preauthId,
      payerCode: 'STAR_HEALTH',
      patientId: 'UHID-2026-8801',
      invoiceId: 'INV-2026-9011',
      totalBilledAmount: 90000,
      claimedAmount: 85000,
      claimType: 'cashless',
    });

    assert.ok(claim.claimId.startsWith('CLM-'));
    assert.equal(claim.settlementStatus, 'adjudicated');
    assert.equal(claim.deductibleAmount, 4500);
    assert.equal(claim.copayAmount, 4500);
    assert.equal(claim.adjudicatedAmount, 76000);
  });

  // ------------------------------------------------------------
  // Scenario 11: Dead-Letter Queue (DLQ) & Failure Recovery
  // ------------------------------------------------------------
  await t.test('Scenario 11: Dead-Letter Queue (DLQ) Enqueuing, Storage & Replay Execution', () => {
    const dlq = InteroperabilityEngineService.enqueueToDLQ({
      hospitalId,
      sourceSubsystem: 'HL7_V2',
      messageIdentifier: 'MSG-FAIL-1002',
      payload: 'CORRUPTED_PIPE_SEGMENTS_|||',
      errorCategory: 'SYNTAX_ERROR',
      errorMessage: 'Unexpected end of MSH segment',
    });

    assert.ok(dlq.dlqId.startsWith('dlq-'));
    assert.equal(dlq.status, 'quarantined');

    // List DLQ
    const jobs = InteroperabilityEngineService.getDLQJobs(hospitalId);
    assert.ok(jobs.some((j) => j.id === dlq.dlqId));

    // Replay job
    const replay = InteroperabilityEngineService.replayDLQJob(dlq.dlqId, userId);
    assert.equal(replay.success, true);
    assert.equal(replay.dlqId, dlq.dlqId);
  });

  // ------------------------------------------------------------
  // Scenario 12: Ayushman Bharat Digital Mission (ABDM) Simulator
  // ------------------------------------------------------------
  await t.test('Scenario 12: ABDM Ecosystem Milestones (M1, M2, M3) Simulation', () => {
    const abhaResult = InteroperabilityEngineService.simulateABDMEvent(
      hospitalId,
      'M1_ABHA_CREATION',
      'sunil.kumar'
    );
    assert.equal(abhaResult.status, 'VERIFIED');
    assert.equal(abhaResult.details.abhaAddress, 'sunil.kumar@abdm');
    assert.ok(abhaResult.details.abhaNumber.startsWith('91-'));

    const shareResult = InteroperabilityEngineService.simulateABDMEvent(
      hospitalId,
      'M2_HIP_SHARE',
      'pat-881'
    );
    assert.equal(shareResult.status, 'SHARED');
    assert.equal(shareResult.details.encryption, 'ECDH_AES_GCM');
  });

  // ------------------------------------------------------------
  // Scenario 13: Operational Telemetry & Subsystem Health Monitoring
  // ------------------------------------------------------------
  await t.test('Scenario 13: Operational Telemetry & Integration Subsystem Health Verification', () => {
    const telemetry = InteroperabilityEngineService.getOperationsTelemetry(hospitalId);

    assert.equal(telemetry.totalActiveIntegrations, 12);
    assert.ok(telemetry.hl7Inbound24h > 1000);
    assert.ok(telemetry.fhirRequests24h > 2000);
    assert.ok(telemetry.devicePackets24h > 3000);
    assert.equal(telemetry.subsystemHealth.hl7Engine, 'HEALTHY');
    assert.equal(telemetry.subsystemHealth.fhirServer, 'HEALTHY');
    assert.equal(telemetry.subsystemHealth.dicomPacs, 'HEALTHY');
    assert.equal(telemetry.subsystemHealth.deviceGateway, 'HEALTHY');
    assert.equal(telemetry.subsystemHealth.insuranceNhcx, 'HEALTHY');
    assert.equal(telemetry.subsystemHealth.abdmBridge, 'HEALTHY');
  });
});
