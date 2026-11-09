import { describe, it } from 'node:test';
import assert from 'node:assert';
import { otAdvancedService } from '../src/modules/ot/ot-advanced.service';

describe('ASRTAVA Advanced Operation Theatre & Perioperative Management Test Suite', () => {
  const tenantHospitalId = 'hosp-apex-001';
  let registeredTheatreId1: string;
  let registeredTheatreId2: string;
  let testSurgeryRequestId: string;
  let testScheduleId: string;
  let testPacuRecordId: string;

  // Scenario 1: Operation Theatre Suite Registration
  it('1. Registers Operation Theatre suite with specialty and laminar air flow capabilities', async () => {
    const theatre1 = await otAdvancedService.registerTheatre({
      hospitalId: tenantHospitalId,
      theatreNumber: 'OT-Suite 1 (Modular)',
      name: 'Cardiothoracic & Vascular OT',
      specialty: 'CARDIOTHORACIC',
      isLaminarAirflow: true,
      branchId: 'branch-main',
    });

    const theatre2 = await otAdvancedService.registerTheatre({
      hospitalId: tenantHospitalId,
      theatreNumber: 'OT-Suite 2 (Ultra-Clean)',
      name: 'Joint Replacement & Orthopaedics',
      specialty: 'ORTHOPAEDIC',
      isLaminarAirflow: true,
      branchId: 'branch-main',
    });

    assert.ok(theatre1.id);
    assert.strictEqual(theatre1.theatreNumber, 'OT-Suite 1 (Modular)');
    assert.strictEqual(theatre1.status, 'AVAILABLE');
    registeredTheatreId1 = theatre1.id;
    registeredTheatreId2 = theatre2.id;
  });

  // Scenario 2: Surgery Request Ingestion
  it('2. Submits surgery request with diagnosis, proposed procedure, and clinical priority', async () => {
    const req = await otAdvancedService.createSurgeryRequest({
      hospitalId: tenantHospitalId,
      patientId: 'pat-101',
      requestingSurgeonId: 'doc-surgeon-sethi',
      proposedProcedure: 'Off-Pump Coronary Artery Bypass (CABG)',
      preopDiagnosis: 'Triple Vessel Coronary Artery Disease (CAD)',
      priority: 'ELECTIVE',
      estimatedDurationMins: 240,
      requestedDate: '2026-11-10',
    });

    assert.ok(req.id);
    assert.strictEqual(req.priority, 'ELECTIVE');
    assert.strictEqual(req.status, 'REQUESTED');
    testSurgeryRequestId = req.id;
  });

  // Scenario 3: Schedule Surgery & OT Room Collision Check
  it('3. Prevents scheduling collision on identical OT room and overlapping time slot', async () => {
    const sched1 = await otAdvancedService.scheduleSurgery({
      hospitalId: tenantHospitalId,
      requestId: testSurgeryRequestId,
      theatreId: registeredTheatreId1,
      patientId: 'pat-101',
      primarySurgeonId: 'doc-surgeon-sethi',
      anaesthetistId: 'doc-anaesth-ananya',
      scheduledStart: '2026-11-10T08:30:00Z',
      scheduledEnd: '2026-11-10T12:30:00Z',
    });

    assert.ok(sched1.id);
    testScheduleId = sched1.id;

    // Overlapping schedule on same theatre room
    await assert.rejects(
      async () => {
        await otAdvancedService.scheduleSurgery({
          hospitalId: tenantHospitalId,
          theatreId: registeredTheatreId1,
          patientId: 'pat-102',
          primarySurgeonId: 'doc-surgeon-kashyap',
          anaesthetistId: 'doc-anaesth-suresh',
          scheduledStart: '2026-11-10T10:00:00Z',
          scheduledEnd: '2026-11-10T11:30:00Z',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('OT_ROOM_COLLISION'), 'Room collision prevented');
        return true;
      }
    );
  });

  // Scenario 4: Surgeon Collision Check
  it('4. Prevents primary surgeon double-booking collision across different OT rooms', async () => {
    await assert.rejects(
      async () => {
        await otAdvancedService.scheduleSurgery({
          hospitalId: tenantHospitalId,
          theatreId: registeredTheatreId2, // Different theatre room
          patientId: 'pat-103',
          primarySurgeonId: 'doc-surgeon-sethi', // Same primary surgeon!
          anaesthetistId: 'doc-anaesth-suresh',
          scheduledStart: '2026-11-10T09:00:00Z',
          scheduledEnd: '2026-11-10T11:00:00Z',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('SURGEON_COLLISION'), 'Surgeon collision prevented');
        return true;
      }
    );
  });

  // Scenario 5: Anaesthetist Collision Check
  it('5. Prevents anaesthetist double-booking collision across different OT rooms', async () => {
    await assert.rejects(
      async () => {
        await otAdvancedService.scheduleSurgery({
          hospitalId: tenantHospitalId,
          theatreId: registeredTheatreId2, // Different theatre room
          patientId: 'pat-104',
          primarySurgeonId: 'doc-surgeon-kashyap',
          anaesthetistId: 'doc-anaesth-ananya', // Same anaesthetist!
          scheduledStart: '2026-11-10T09:00:00Z',
          scheduledEnd: '2026-11-10T11:00:00Z',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('ANAESTHETIST_COLLISION'), 'Anaesthetist collision prevented');
        return true;
      }
    );
  });

  // Scenario 6: Pre-Anaesthetic Checkup (PAC) Clearance
  it('6. Records Pre-Anaesthetic Checkup (PAC) with ASA classification and Mallampati score', async () => {
    const pac = await otAdvancedService.recordPreopAssessment({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      patientId: 'pat-101',
      anaesthetistId: 'doc-anaesth-ananya',
      asaClass: 'ASA_III',
      mallampatiScore: 'II',
      fastingHoursSolid: 8,
      fastingHoursClearFluids: 3,
      airwayAssessment: 'Adequate thyromental distance > 6.5cm, full cervical range of motion',
      isClearedForSurgery: true,
    });

    assert.ok(pac.id);
    assert.strictEqual(pac.asaClass, 'ASA_III');
    assert.strictEqual(pac.isClearedForSurgery, true);
  });

  // Scenario 7: Inadequate Fasting Check (NPO Compliance)
  it('7. Flags surgical clearance failure if NPO solid fasting is less than 6 hours', async () => {
    const nonFastingPac = await otAdvancedService.recordPreopAssessment({
      hospitalId: tenantHospitalId,
      scheduleId: 'temp-sched-npo',
      patientId: 'pat-unfasted',
      anaesthetistId: 'doc-anaesth-ananya',
      asaClass: 'ASA_I',
      mallampatiScore: 'I',
      fastingHoursSolid: 3, // Inadequate! Must be >= 6 hours
      fastingHoursClearFluids: 1,
    });

    assert.strictEqual(nonFastingPac.isClearedForSurgery, false);
    assert.ok(nonFastingPac.rejectionReason.includes('Inadequate NPO fasting'));
  });

  // Scenario 8: Informed Surgical Consent
  it('8. Documents informed surgical consent with risk disclosure and cryptographic signature hash', async () => {
    const consent = await otAdvancedService.recordSurgicalConsent({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      patientId: 'pat-101',
      procedureName: 'Off-Pump Coronary Artery Bypass (CABG)',
      risksDisclosed: 'Risks of bleeding, perioperative myocardial infarction, stroke, infection, and emergency conversion to on-pump discussed.',
      witnessName: 'Sister Priya (OT Staff Nurse)',
      patientSigned: true,
    });

    assert.ok(consent.id);
    assert.ok(consent.consentSignatureHash.startsWith('SHA256-CONSENT-'));
  });

  // Scenario 9: WHO Surgical Safety Checklist - Phase 1: Sign-In
  it('9. Executes WHO Surgical Safety Checklist Phase 1 (Sign-In before induction)', async () => {
    const checklist = await otAdvancedService.recordWhoChecklistPhase({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      phase: 'SIGN_IN',
      verifiedBy: 'doc-anaesth-ananya',
      details: {
        patientIdentityConfirmed: true,
        siteMarked: true,
        pulseOximeterOperating: true,
        knownAllergyChecked: true,
        airwayAspirationRisk: false,
        anticipatedBloodLossMl: 400,
      },
    });

    assert.strictEqual(checklist.signInCompleted, true);
    assert.strictEqual(checklist.timeOutCompleted, false);
  });

  // Scenario 10: WHO Checklist Sequence Enforcement
  it('10. Blocks completion of Time-Out phase if Sign-In has not been completed first', async () => {
    await assert.rejects(
      async () => {
        await otAdvancedService.recordWhoChecklistPhase({
          hospitalId: tenantHospitalId,
          scheduleId: 'uninitiated-schedule-xyz',
          phase: 'TIME_OUT',
          verifiedBy: 'doc-surgeon-sethi',
          details: { teamMembersIntroduced: true },
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('WHO_CHECKLIST_SEQUENCE_ERROR'), 'Sequence order enforced');
        return true;
      }
    );
  });

  // Scenario 11: WHO Surgical Safety Checklist - Phase 2: Time-Out
  it('11. Executes WHO Surgical Safety Checklist Phase 2 (Time-Out before skin incision)', async () => {
    const checklist = await otAdvancedService.recordWhoChecklistPhase({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      phase: 'TIME_OUT',
      verifiedBy: 'doc-surgeon-sethi',
      details: {
        teamMembersIntroduced: true,
        antibioticGivenWithin60m: true,
        imagingDisplayed: true,
      },
    });

    assert.strictEqual(checklist.timeOutCompleted, true);
    assert.strictEqual(checklist.antibioticGivenWithin60m, true);
  });

  // Scenario 12: Intraoperative Anaesthesia Charting & Vitals
  it('12. Charts intraoperative hemodynamic telemetry and airway ventilation', async () => {
    await otAdvancedService.recordAnaesthesia({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      anaesthetistId: 'doc-anaesth-ananya',
      anaesthesiaType: 'GENERAL',
      airwayType: 'ETT',
    });

    const vitals = await otAdvancedService.logIntraopVitals({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      heartRate: 72,
      systolicBp: 118,
      diastolicBp: 74,
      spo2Percent: 99,
      etco2Mmhg: 36,
      temperatureCelsius: 36.6,
    });

    assert.strictEqual(vitals.heartRate, 72);
    assert.strictEqual(vitals.spo2Percent, 99);
  });

  // Scenario 13: Controlled Narcotics Accountability
  it('13. Logs intraoperative controlled narcotics (Propofol, Fentanyl) with exact dosage', async () => {
    const narcoticsLog = await otAdvancedService.logIntraopVitals({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      heartRate: 74,
      systolicBp: 115,
      diastolicBp: 72,
      spo2Percent: 100,
      administeredDrugs: [
        { drug: 'Propofol 1% IV', dose: '150 mg', time: '08:38 AM' },
        { drug: 'Fentanyl IV', dose: '150 mcg', time: '08:39 AM' },
        { drug: 'Vecuronium IV', dose: '8 mg', time: '08:41 AM' },
      ],
    });

    assert.ok(narcoticsLog.administeredDrugs);
    assert.strictEqual(narcoticsLog.administeredDrugs.length, 3);
  });

  // Scenario 14: Surgical Counts Reconciliation (Balanced)
  it('14. Reconciles surgical sponges, sharps, and instruments with dual nurse verification', async () => {
    const count = await otAdvancedService.reconcileSurgicalCount({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      countCategory: 'SPONGES_GAUZE',
      initialCount: 10,
      intraopAddedCount: 5,
      closingCount: 15, // 10 + 5 = 15 (Balanced)
      scrubNurseId: 'nurse-priya',
      circulatingNurseId: 'nurse-deepa',
    });

    assert.strictEqual(count.isCountCorrect, true);
    assert.strictEqual(count.discrepancyCount, 0);
  });

  // Scenario 15: Surgical Count Discrepancy Detection
  it('15. Flags critical safety discrepancy if closing count does not equal initial plus added', async () => {
    const mismatchCount = await otAdvancedService.reconcileSurgicalCount({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      countCategory: 'SHARPS_NEEDLES',
      initialCount: 8,
      intraopAddedCount: 4,
      closingCount: 11, // Missing 1 needle! (8 + 4 = 12 != 11)
      scrubNurseId: 'nurse-priya',
      circulatingNurseId: 'nurse-deepa',
    });

    assert.strictEqual(mismatchCount.isCountCorrect, false);
    assert.strictEqual(mismatchCount.discrepancyCount, 1);
  });

  // Scenario 16: PACU Aldrete Scoring & Safe Discharge Gate
  it('16. Evaluates Modified Aldrete recovery score in PACU and enforces minimum score >= 9 for ward transfer', async () => {
    const pacu = await otAdvancedService.admitToPacu({
      hospitalId: tenantHospitalId,
      scheduleId: testScheduleId,
      patientId: 'pat-101',
      assignedNurseId: 'nurse-sunita-pacu',
    });
    assert.ok(pacu.id);
    testPacuRecordId = pacu.id;

    // Sub-test A: Score < 9 blocks discharge
    await otAdvancedService.evaluateAldreteScore({
      hospitalId: tenantHospitalId,
      pacuRecordId: testPacuRecordId,
      activityScore: 1, // 1/2
      respirationScore: 1, // 1/2
      circulationScore: 2, // 2/2
      consciousnessScore: 1, // 1/2
      o2SaturationScore: 2, // 2/2 -> Total = 7/10
      evaluatedByUserId: 'nurse-sunita-pacu',
    });

    await assert.rejects(
      async () => {
        await otAdvancedService.dischargeFromPacu({
          hospitalId: tenantHospitalId,
          pacuRecordId: testPacuRecordId,
          dischargeDestination: 'SURGICAL_WARD',
          dischargePhysicianId: 'doc-surgeon-sethi',
        });
      },
      (err: any) => {
        assert.ok(err.message.includes('PACU_DISCHARGE_BLOCKED'), 'Discharge blocked for score < 9');
        return true;
      }
    );

    // Sub-test B: Score >= 9 allows safe discharge
    const stableScore = await otAdvancedService.evaluateAldreteScore({
      hospitalId: tenantHospitalId,
      pacuRecordId: testPacuRecordId,
      activityScore: 2,
      respirationScore: 2,
      circulationScore: 2,
      consciousnessScore: 2,
      o2SaturationScore: 2, // Total = 10/10
      evaluatedByUserId: 'nurse-sunita-pacu',
    });

    assert.strictEqual(stableScore.totalScore, 10);
    assert.strictEqual(stableScore.isFitForDischarge, true);

    const discharged = await otAdvancedService.dischargeFromPacu({
      hospitalId: tenantHospitalId,
      pacuRecordId: testPacuRecordId,
      dischargeDestination: 'SURGICAL_WARD',
      dischargePhysicianId: 'doc-surgeon-sethi',
    });

    assert.strictEqual(discharged.status, 'DISCHARGED');
    assert.strictEqual(discharged.dischargeDestination, 'SURGICAL_WARD');
  });
});

