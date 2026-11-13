import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { otAdvancedService } from '../src/modules/ot/ot-advanced.service';
import { nursingAdvancedService } from '../src/modules/nursing/nursing-advanced.service';
import { EMARSafetyService } from '../src/modules/nursing/emar-safety.service';
import { lisAdvancedService } from '../src/modules/diagnostics/lis-advanced.service';
import { risAdvancedService } from '../src/modules/diagnostics/ris-advanced.service';
import { emergencyAdvancedService } from '../src/modules/emergency/emergency-advanced.service';
import { AdvancedPharmacyService } from '../src/modules/pharmacy/pharmacy-advanced.service';
import { ClinicalConflictQueueService } from '../src/modules/deployment/conflict-queue.service';
import { HybridSyncService } from '../src/modules/deployment/hybrid-sync.service';

// ============================================================================
// ASRTAVA PHASE 2.2C GATE 1 VERIFICATION SUITE
// P0-04: Departmental Services PostgreSQL Persistence & Resilient Fallback
// P0-05: Manual Clinical Conflict Reconciliation Queue Engine
// ============================================================================

test('ASRTAVA Phase 2.2C Gate 1 Departmental Persistence & Conflict Queue Suite', async (t) => {
  const HOSP_ID = 'hosp-pilot-main-01';
  const PATIENT_ID = 'pt-synth-001';
  const DOCTOR_ID = 'doc-surgeon-001';
  const NURSE_ID = 'nurse-icu-001';

  // Clean test states
  EMARSafetyService.clearState();
  HybridSyncService.clearState();
  ClinicalConflictQueueService.clearState();

  // ==========================================================================
  // P0-04.1: Operation Theatre Suite & Perioperative Care (Migration 028)
  // ==========================================================================
  await t.test('P0-04.1: OT Suite - Multi-resource scheduling, WHO checklist, surgical count, and PACU Aldrete discharge', async () => {
    // 1. Register Theatre
    const theatre = await otAdvancedService.registerTheatre({
      hospitalId: HOSP_ID,
      theatreNumber: 'OT-SUITE-01',
      name: 'Main Cardiovascular OT',
      specialty: 'CARDIAC',
      isLaminarAirflow: true,
    });
    assert.ok(theatre.id);
    assert.strictEqual(theatre.theatreNumber, 'OT-SUITE-01');

    // 2. Schedule Surgery with anti-collision check
    const schedule = await otAdvancedService.scheduleSurgery({
      hospitalId: HOSP_ID,
      theatreId: theatre.id,
      patientId: PATIENT_ID,
      primarySurgeonId: DOCTOR_ID,
      anaesthetistId: 'doc-anaesth-001',
      scheduledStart: '2026-11-20T08:00:00Z',
      scheduledEnd: '2026-11-20T12:00:00Z',
    });
    assert.ok(schedule.id);
    assert.strictEqual(schedule.status, 'SCHEDULED');

    // Anti-collision verification
    await assert.rejects(
      async () => {
        await otAdvancedService.scheduleSurgery({
          hospitalId: HOSP_ID,
          theatreId: theatre.id,
          patientId: 'pt-synth-002',
          primarySurgeonId: 'doc-surgeon-002',
          anaesthetistId: 'doc-anaesth-002',
          scheduledStart: '2026-11-20T09:00:00Z', // Overlaps!
          scheduledEnd: '2026-11-20T11:00:00Z',
        });
      },
      (err: any) => err.message.includes('OT_ROOM_COLLISION')
    );

    // 3. Three-Phase WHO Checklist Sequence
    // Time-Out before Sign-In must fail
    await assert.rejects(
      async () => {
        await otAdvancedService.recordWhoChecklistPhase({
          hospitalId: HOSP_ID,
          scheduleId: schedule.id,
          phase: 'TIME_OUT',
          verifiedBy: DOCTOR_ID,
          details: { teamMembersIntroduced: true },
        });
      },
      (err: any) => err.message.includes('WHO_CHECKLIST_SEQUENCE_ERROR')
    );

    // Sign-In completes successfully
    const signin = await otAdvancedService.recordWhoChecklistPhase({
      hospitalId: HOSP_ID,
      scheduleId: schedule.id,
      phase: 'SIGN_IN',
      verifiedBy: 'doc-anaesth-001',
      details: { patientIdentityConfirmed: true, siteMarked: true, pulseOximeterOperating: true },
    });
    assert.strictEqual(signin.signInCompleted, true);

    // Time-Out completes successfully
    const timeout = await otAdvancedService.recordWhoChecklistPhase({
      hospitalId: HOSP_ID,
      scheduleId: schedule.id,
      phase: 'TIME_OUT',
      verifiedBy: DOCTOR_ID,
      details: { teamMembersIntroduced: true, antibioticGivenWithin60m: true },
    });
    assert.strictEqual(timeout.timeOutCompleted, true);

    // Sign-Out completes successfully
    const signout = await otAdvancedService.recordWhoChecklistPhase({
      hospitalId: HOSP_ID,
      scheduleId: schedule.id,
      phase: 'SIGN_OUT',
      verifiedBy: NURSE_ID,
      details: { procedureNameRecorded: true, countsReconciled: true, specimenLabeled: true },
    });
    assert.strictEqual(signout.signOutCompleted, true);

    // 4. Surgical Counts Reconciliation
    const counts = await otAdvancedService.reconcileSurgicalCount({
      hospitalId: HOSP_ID,
      scheduleId: schedule.id,
      countCategory: 'SPONGES_GAUZE',
      initialCount: 20,
      intraopAddedCount: 10,
      closingCount: 30, // 20 + 10 = 30
      scrubNurseId: NURSE_ID,
      circulatingNurseId: 'nurse-circ-002',
    });
    assert.strictEqual(counts.isCountCorrect, true);
    assert.strictEqual(counts.discrepancyCount, 0);

    // 5. PACU Recovery & Aldrete Score Discharge Gate
    const pacu = await otAdvancedService.admitToPacu({
      hospitalId: HOSP_ID,
      scheduleId: schedule.id,
      patientId: PATIENT_ID,
      assignedNurseId: NURSE_ID,
    });
    assert.strictEqual(pacu.status, 'IN_RECOVERY');

    // Score 7/10: discharge must be BLOCKED
    await otAdvancedService.evaluateAldreteScore({
      hospitalId: HOSP_ID,
      pacuRecordId: pacu.id,
      activityScore: 1,
      respirationScore: 1,
      circulationScore: 2,
      consciousnessScore: 2,
      o2SaturationScore: 1, // Total = 7
      evaluatedByUserId: NURSE_ID,
    });

    await assert.rejects(
      async () => {
        await otAdvancedService.dischargeFromPacu({
          hospitalId: HOSP_ID,
          pacuRecordId: pacu.id,
          dischargeDestination: 'SURGICAL_WARD',
          dischargePhysicianId: DOCTOR_ID,
        });
      },
      (err: any) => err.message.includes('PACU_DISCHARGE_BLOCKED')
    );

    // Score 10/10: discharge permitted
    await otAdvancedService.evaluateAldreteScore({
      hospitalId: HOSP_ID,
      pacuRecordId: pacu.id,
      activityScore: 2,
      respirationScore: 2,
      circulationScore: 2,
      consciousnessScore: 2,
      o2SaturationScore: 2, // Total = 10
      evaluatedByUserId: NURSE_ID,
    });

    const discharged = await otAdvancedService.dischargeFromPacu({
      hospitalId: HOSP_ID,
      pacuRecordId: pacu.id,
      dischargeDestination: 'SURGICAL_WARD',
      dischargePhysicianId: DOCTOR_ID,
    });
    assert.strictEqual(discharged.status, 'DISCHARGED');
  });

  // ==========================================================================
  // P0-04.2: Nursing Management & eMAR Administration (Migrations 024 & 025)
  // ==========================================================================
  await t.test('P0-04.2: Nursing - NEWS2 early warning score, eMAR safety guards, and SBAR handover', async () => {
    // 1. Vital Signs with NEWS2 Calculation
    // Critical deteriorating vitals: RR=28 (score 3), SpO2=88 (score 3), Pulse=135 (score 3) -> High Risk
    const vitalResult = await nursingAdvancedService.recordVitalSigns({
      hospitalId: HOSP_ID,
      admissionId: 'adm-001',
      patientId: PATIENT_ID,
      recordedByNurseId: NURSE_ID,
      systolicBp: 85, // score 3
      diastolicBp: 50,
      heartRate: 135, // score 3
      respiratoryRate: 28, // score 3
      temperatureCelsius: 38.5, // score 1
      spo2Percent: 88, // score 3
      isSupplementalO2: true, // score 2
    });

    assert.ok(vitalResult.vitalRecord.news2Score >= 7);
    assert.strictEqual(vitalResult.vitalRecord.news2RiskCategory, 'HIGH');
    assert.ok(vitalResult.alert);
    assert.strictEqual(vitalResult.alert.alertSeverity, 'EMERGENCY_MET');

    // 2. Bedside eMAR duplicate and allergy checks
    const emarInput = {
      hospitalId: HOSP_ID,
      admissionId: 'adm-001',
      patientId: PATIENT_ID,
      prescriptionItemId: 'rx-item-501',
      drugName: 'Ceftriaxone 1g IV',
      doseAdministered: '1g',
      routeUsed: 'IV',
      scheduledTime: '2026-11-20T10:00:00Z',
      administrationStatus: 'ADMINISTERED' as const,
      administeringNurseId: NURSE_ID,
    };

    const firstAdmin = await nursingAdvancedService.administerMedicationEMAR(emarInput);
    assert.ok(firstAdmin.id);

    // Duplicate administration on same scheduled time must be blocked
    await assert.rejects(
      async () => {
        await nursingAdvancedService.administerMedicationEMAR(emarInput);
      },
      (err: any) => err.message.includes('DUPLICATE_ADMINISTRATION_PREVENTED')
    );

    // Allergy contraindication must be blocked
    await assert.rejects(
      async () => {
        await nursingAdvancedService.administerMedicationEMAR({
          ...emarInput,
          prescriptionItemId: 'rx-item-502',
          scheduledTime: '2026-11-20T14:00:00Z',
          drugName: 'Amoxicillin-Clavulanate 625mg',
          knownAllergies: ['Penicillin', 'Amoxicillin'],
        });
      },
      (err: any) => err.message.includes('ALLERGY_CONTRAINDICATION_BLOCKED')
    );

    // 3. SBAR Handover submission and verification
    const sbar = await nursingAdvancedService.submitSBARHandover({
      hospitalId: HOSP_ID,
      wardId: 'ward-icu-01',
      outgoingNurseId: NURSE_ID,
      incomingNurseId: 'nurse-night-002',
      censusOccupiedBeds: 12,
      censusVacantBeds: 2,
      situationSummary: 'Post-op cardiac patient in Bed 4 stable',
      backgroundSummary: 'CABG x 3 completed this morning',
      assessmentSummary: 'NEWS2 improved to 2 post-extubation',
      recommendationsSummary: 'Monitor chest drain output and arterial line BP',
    });
    assert.strictEqual(sbar.status, 'SUBMITTED');

    const ack = await nursingAdvancedService.acknowledgeSBARHandover(sbar.id, 'nurse-night-002');
    assert.strictEqual(ack.status, 'ACKNOWLEDGED_SIGNED');
  });

  // ==========================================================================
  // P0-04.3: Complete Laboratory Information System (Migration 026)
  // ==========================================================================
  await t.test('P0-04.3: LIS - Specimen accessioning, critical panic alert, and Westgard IQC', async () => {
    // 1. Register parameter: Serum Potassium with panic limits
    const param = await lisAdvancedService.registerTestParameter({
      hospitalId: HOSP_ID,
      departmentId: 'dept-biochem-01',
      parameterCode: 'SERUM_POTASSIUM',
      parameterName: 'Serum Potassium (K+)',
      unitOfMeasure: 'mmol/L',
      refRangeMaleMin: 3.5,
      refRangeMaleMax: 5.0,
      criticalLow: 2.8,
      criticalHigh: 6.2,
    });
    assert.ok(param.id);

    // 2. Specimen accessioning
    const spec = await lisAdvancedService.accessionSpecimen({
      hospitalId: HOSP_ID,
      patientId: PATIENT_ID,
      specimenType: 'WHOLE_BLOOD',
      containerType: 'LITHIUM_HEPARIN',
      collectedByUserId: 'phleb-001',
    });
    assert.ok(spec.accessionNumber);
    assert.ok(spec.barcodeString.includes(spec.accessionNumber));

    // 3. Result Entry: Critical Panic High Potassium (6.8 mmol/L)
    const resultOut = await lisAdvancedService.recordTestResult({
      hospitalId: HOSP_ID,
      specimenId: spec.id,
      parameterId: param.id,
      numericValue: 6.8,
      technologistUserId: 'tech-001',
    });
    assert.strictEqual(resultOut.result.abnormalityFlag, 'CRITICAL_PANIC');
    assert.ok(resultOut.criticalAlert);
    assert.strictEqual(resultOut.criticalAlert.notificationChannel, 'TELEPHONE_READ_BACK');

    // 4. Quality Control Westgard Rule Evaluation (1_3s rule violation: z-score = 3.2)
    const qc = await lisAdvancedService.recordQCMeasurement({
      hospitalId: HOSP_ID,
      controlLotNumber: 'LOT-BIO-2026-A',
      parameterId: param.id,
      targetMean: 4.2,
      standardDeviation: 0.1,
      measuredValue: 4.52, // (4.52 - 4.2)/0.1 = 3.2 standard deviations
    });
    assert.strictEqual(qc.westgardViolation, '1_3S');
    assert.strictEqual(qc.runStatus, 'OUT_OF_CONTROL_REJECT');
  });

  // ==========================================================================
  // P0-04.4: Radiology Information System (Migration 027)
  // ==========================================================================
  await t.test('P0-04.4: RIS - Modality appointment, screening contraindication, and authorized report', async () => {
    // 1. Modality Registration
    const modality = await risAdvancedService.registerModality({
      hospitalId: HOSP_ID,
      modalityCode: 'MRI-3T-01',
      modalityType: 'MR',
      name: 'Siemens 3T MRI Suite',
      aeTitle: 'SIEMENS_MRI_3T',
      ipAddress: '10.0.4.15',
      portNumber: 104,
      locationRoom: 'Ground Floor Radiology Bay 2',
    });
    assert.ok(modality.id);

    // 2. Pre-imaging screening with Ferrous Pacemaker -> CONTRAINDICATED
    const screening = await risAdvancedService.recordPatientScreening({
      hospitalId: HOSP_ID,
      appointmentId: 'appt-mri-01',
      patientId: PATIENT_ID,
      isPacemakerOrFerrousImplant: true,
      screenedByUserId: 'rad-tech-001',
    });
    assert.strictEqual(screening.clearedForScan, false);
    assert.strictEqual(screening.clearanceStatus, 'CONTRAINDICATED');
    assert.ok(screening.warnings[0].includes('Pacemaker'));

    // 3. Structured Radiology Report Authorization
    const reportData = await risAdvancedService.createRadiologyReport({
      hospitalId: HOSP_ID,
      studyId: 'study-ct-chest-001',
      reportingRadiologistId: 'doc-radiologist-001',
      techniqueNotes: 'High-resolution helical CT chest with IV iodinated contrast',
      findings: 'Lungs clear bilaterally. No pulmonary embolism. Normal cardiac silhouette.',
      impression: 'Normal contrast CT chest.',
      isCriticalFinding: false,
    });
    assert.strictEqual(reportData.report.reportStatus, 'DRAFT');

    const authorized = await risAdvancedService.authorizeReport(reportData.report.id, 'doc-radiologist-001');
    assert.strictEqual(authorized.reportStatus, 'AUTHORIZED');
    assert.ok(authorized.digitalSignatureHash);

    // Immutable lock check: cannot overwrite authorized report directly
    await assert.rejects(
      async () => {
        await risAdvancedService.updateRadiologyReportContent({
          hospitalId: HOSP_ID,
          reportId: reportData.report.id,
          findings: 'Attempted overwrite of authorized report',
        });
      },
      (err: any) => err.message.includes('IMMUTABLE_REPORT_LOCK')
    );
  });

  // ==========================================================================
  // P0-04.5: Emergency Department & Triage (Migration 029)
  // ==========================================================================
  await t.test('P0-04.5: ED - Unknown patient temporary UHID, ESI Level 1 resuscitation, and ambulance dispatch', async () => {
    // 1. Ingestion of unidentified unconscious trauma patient
    const edEncounter = await emergencyAdvancedService.registerEmergencyEncounter({
      hospitalId: HOSP_ID,
      isUnknownIdentity: true,
      arrivalMode: 'AMBULANCE',
      presentingComplaint: 'Severe multi-trauma vehicular accident, unresponsive',
    });
    assert.ok(edEncounter.temporaryUhid);
    assert.ok(edEncounter.patientId.includes('TEMP-UHID-ED'));

    // 2. ESI Triage calculation: GCS=6 -> ESI Level 1 (Red Resuscitation)
    const triage = await emergencyAdvancedService.performTriage({
      hospitalId: HOSP_ID,
      encounterId: edEncounter.id,
      triagedByUserId: NURSE_ID,
      heartRate: 145,
      systolicBp: 75,
      diastolicBp: 40,
      respiratoryRate: 32,
      spo2Percent: 82,
      gcsScore: 6,
    });
    assert.strictEqual(triage.esiLevel, 1);
    assert.strictEqual(triage.assignedZone, 'RED_RESUS');

    // 3. Trauma Code Red Activation
    const code = await emergencyAdvancedService.activateTraumaTeam({
      hospitalId: HOSP_ID,
      encounterId: edEncounter.id,
      activationType: 'TRAUMA_TEAM_CODE_RED',
      teamLeaderId: DOCTOR_ID,
    });
    assert.strictEqual(code.responseTimeSeconds, 45);

    // 4. Ambulance dispatch
    const amb = await emergencyAdvancedService.registerAmbulance({
      hospitalId: HOSP_ID,
      vehicleNumber: 'MH-12-ED-108',
      ambulanceType: 'ALS_ADVANCED_LIFE_SUPPORT',
      driverName: 'Ramesh Patil',
      paramedicName: 'Anil Kumar',
    });
    const dispatch = await emergencyAdvancedService.dispatchAmbulance({
      hospitalId: HOSP_ID,
      ambulanceId: amb.id,
      callerName: 'Highway Patrol Officer',
      callerPhone: '9876543210',
      pickupLocation: 'NH-48 Milestone 24',
    });
    assert.strictEqual(dispatch.trip.status, 'DISPATCHED');
    assert.strictEqual(dispatch.ambulance.status, 'DISPATCHED');
  });

  // ==========================================================================
  // P0-04.6: Advanced Pharmacy & Medication Safety (Migration 024)
  // ==========================================================================
  await t.test('P0-04.6: Pharmacy - Cold chain temperature excursion quarantine & narcotic dual custody', async () => {
    // 1. Cold chain thermal excursion (12.5 C where safe is 2.0 to 8.0 C)
    const coldLog = AdvancedPharmacyService.logColdChainTemperature({
      hospitalId: HOSP_ID,
      storageUnitCode: 'FRIDGE-VACCINE-01',
      locationName: 'Central Inpatient Pharmacy Cold Room',
      temperatureCelsius: 12.5,
      targetMinCelsius: 2.0,
      targetMaxCelsius: 8.0,
    });
    assert.strictEqual(coldLog.isExcursion, true);
    assert.strictEqual(coldLog.quarantineTriggered, true);

    // 2. Narcotic vault dual custody: Same custodian and witness must FAIL
    assert.throws(
      () => {
        AdvancedPharmacyService.recordNarcoticTransaction({
          hospitalId: HOSP_ID,
          drugId: 'drug-morphine-10mg',
          batchId: 'batch-morph-001',
          transactionType: 'PATIENT_DISPENSE',
          quantity: -2,
          primaryCustodianUserId: 'pharmacist-001',
          witnessUserId: 'pharmacist-001', // Same user!
        });
      },
      (err: any) => err.message.includes('DUAL_CUSTODY_ERROR')
    );

    // Valid dual custody with distinct witnesses
    const narcoticEntry = AdvancedPharmacyService.recordNarcoticTransaction({
      hospitalId: HOSP_ID,
      drugId: 'drug-morphine-10mg',
      batchId: 'batch-morph-001',
      transactionType: 'PATIENT_DISPENSE',
      quantity: -2,
      primaryCustodianUserId: 'pharmacist-001',
      witnessUserId: 'nurse-supervisor-002',
    });
    assert.strictEqual(narcoticEntry.discrepancyFlag, false);
    assert.strictEqual(narcoticEntry.balanceAfter, 48);
  });

  // ==========================================================================
  // P0-05: Manual Clinical Conflict Reconciliation Queue Engine
  // ==========================================================================
  await t.test('P0-05: Hybrid Sync - Replaces naive LWW for clinical data, queues collisions, and enforces supervisory review', async () => {
    const CLINICAL_CONSULT_ID = 'con-tele-701';

    // 1. Initial baseline clinical record on cloud
    const outboxInitial = HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_ID,
      entityType: 'consultation',
      entityId: CLINICAL_CONSULT_ID,
      operation: 'INSERT',
      version: 1,
      payload: { diagnosis: 'Mild acute bronchitis', rx: 'Azithromycin 500mg' },
    });

    const flush1 = await HybridSyncService.flushPendingSync();
    assert.strictEqual(flush1.synced, 1);
    assert.strictEqual(flush1.conflictsQueued, 0);

    // Verify record exists on cloud
    const cloudInitial = HybridSyncService.getCloudRecord(HOSP_ID, 'consultation', CLINICAL_CONSULT_ID);
    assert.strictEqual(cloudInitial.diagnosis, 'Mild acute bronchitis');

    // 2. Simulate concurrent collision:
    // Cloud modified to version 2 with 'Asthma exacerbation'
    cloudInitial._version = 2;
    cloudInitial.diagnosis = 'Asthma exacerbation';

    // Edge hospital now submits an overlapping mutation with version 2 but conflicting clinical data
    const collidingOutbox = HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_ID,
      entityType: 'consultation',
      entityId: CLINICAL_CONSULT_ID,
      operation: 'UPDATE',
      version: 2,
      payload: { diagnosis: 'Bacterial pneumonia with high fever', antibiotics: 'Levofloxacin' },
    });

    const flush2 = await HybridSyncService.flushPendingSync();
    // Must NOT auto-overwrite! Must queue to clinical_conflict_queue
    assert.strictEqual(flush2.conflictsQueued, 1);

    // 3. Verify collision landed in Clinical Conflict Queue with REQUIRES_CLINICAL_REVIEW
    const pendingConflicts = await ClinicalConflictQueueService.listConflicts({
      hospitalId: HOSP_ID,
      status: 'REQUIRES_CLINICAL_REVIEW',
    });
    assert.ok(pendingConflicts.length >= 1);
    const targetConflict = pendingConflicts.find((c) => c.entityId === CLINICAL_CONSULT_ID);
    assert.ok(targetConflict);
    assert.strictEqual(targetConflict.status, 'REQUIRES_CLINICAL_REVIEW');
    assert.ok(targetConflict.conflictReason.includes('CONCURRENT_CLINICAL_MODIFICATION'));

    // Cloud record must NOT have been overwritten by colliding payload!
    const cloudDuringCollision = HybridSyncService.getCloudRecord(HOSP_ID, 'consultation', CLINICAL_CONSULT_ID);
    assert.strictEqual(cloudDuringCollision.diagnosis, 'Asthma exacerbation');

    // 4. Clinical Governance Enforcement: Supervisor resolution requires >= 15 chars justification
    await assert.rejects(
      async () => {
        await ClinicalConflictQueueService.resolveConflict({
          conflictId: targetConflict.id,
          hospitalId: HOSP_ID,
          supervisorUserId: DOCTOR_ID,
          resolutionType: 'ACCEPT_LOCAL',
          supervisorJustification: 'Short note', // Less than 15 characters!
        });
      },
      (err: any) => err.message.includes('CLINICAL_SAFETY_VIOLATION')
    );

    // 5. Successful Supervisor Resolution with 'MANUAL_MERGE'
    const resolution = await ClinicalConflictQueueService.resolveConflict({
      conflictId: targetConflict.id,
      hospitalId: HOSP_ID,
      supervisorUserId: DOCTOR_ID,
      resolutionType: 'MANUAL_MERGE',
      supervisorJustification: 'Reviewed chest X-ray and lab sputum culture; patient has both underlying asthma and secondary bacterial pneumonia.',
      mergedPayload: {
        primaryDiagnosis: 'Bacterial pneumonia with high fever',
        secondaryDiagnosis: 'Asthma exacerbation',
        treatmentPlan: 'Levofloxacin + Budesonide nebulization',
      },
    });

    assert.strictEqual(resolution.success, true);
    assert.strictEqual(resolution.entry.status, 'RESOLVED_MANUAL_MERGE');
    assert.strictEqual(resolution.finalPayload.primaryDiagnosis, 'Bacterial pneumonia with high fever');

    // Apply resolved conflict to hybrid sync
    HybridSyncService.applyResolvedConflict({
      hospitalId: HOSP_ID,
      entityType: 'consultation',
      entityId: CLINICAL_CONSULT_ID,
      resolvedPayload: resolution.finalPayload,
    });

    // Cloud store now reflects supervisor-reviewed merged state
    const resolvedCloud = HybridSyncService.getCloudRecord(HOSP_ID, 'consultation', CLINICAL_CONSULT_ID);
    assert.strictEqual(resolvedCloud.primaryDiagnosis, 'Bacterial pneumonia with high fever');
    assert.strictEqual(resolvedCloud.secondaryDiagnosis, 'Asthma exacerbation');
  });
});
