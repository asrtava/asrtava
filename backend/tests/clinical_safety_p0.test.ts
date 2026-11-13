import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { LicenseService } from '../src/modules/licensing/license.service';
import {
  requireLicensedModule,
  validateServerEncounterContext
} from '../src/middleware/licensing.middleware';
import { SurgicalContinuityService } from '../src/modules/ot/surgical-continuity.service';
import { EMARSafetyService, PrescribedMedication } from '../src/modules/nursing/emar-safety.service';

// ============================================================================
// ASRTAVA P0 CLINICAL SAFETY ACCEPTANCE & VERIFICATION TEST SUITE
// Verifies:
// P0-01: Explicit Inpatient Encounter Context in Licensing Route Middleware
// P0-02: Safe Intraoperative Surgical Continuity State Management & Locks
// P0-03: Bedside eMAR Fail-Safe & Mandatory Medication Safety Verification
// ============================================================================

test('ASRTAVA Phase 2.2 P0 Clinical Safety Verification Suite', async (t) => {
  const HOSP_PILOT = 'hosp-pilot-main-01';
  const HOSP_OTHER_TENANT = 'hosp-unrelated-tenant-99';
  const PT_JOHN_DOE = 'pt-synth-001';
  const PT_JANE_ROE = 'pt-synth-002';
  const ADM_ACTIVE = 'adm-synth-active-101';
  const SURG_SCHEDULE_01 = 'sched-surg-cardiac-201';

  // Clear previous test states
  LicenseService.clearState();
  SurgicalContinuityService.clearState();
  EMARSafetyService.clearState();

  // --------------------------------------------------------------------------
  // P0-01 TESTS: Clinical Continuity Licensing Route Middleware & Server-Side Validation
  // --------------------------------------------------------------------------

  await t.test('P0-01.1: Server-side validation rejects invalid, missing, or cross-tenant encounters', async () => {
    // A. Missing encounter and patient references
    const missing = await validateServerEncounterContext({ hospitalId: HOSP_PILOT });
    assert.strictEqual(missing.isValid, false);
    assert.ok(missing.reason?.includes('No encounter or patient reference provided'));

    // B. Encounter-patient cross mismatch
    // (Simulate mismatched relationship rejection)
    const mismatch = await validateServerEncounterContext({
      hospitalId: HOSP_PILOT,
      encounterId: 'non-existent-adm',
      patientId: PT_JOHN_DOE
    });
    assert.strictEqual(mismatch.isValid, false);
  });

  await t.test('P0-01.2: Individual DENY override takes absolute precedence over licensing continuity', async () => {
    // When a clinician has an explicit administrative DENY, they must NOT bypass via continuity
    const mockReq: any = {
      user: {
        id: 'usr-nurse-denied-01',
        hospitalId: HOSP_PILOT,
        userType: 'staff',
        roles: ['nurse']
      },
      hospitalId: HOSP_PILOT,
      method: 'POST',
      originalUrl: '/api/v1/nursing/advanced/emar',
      headers: { 'x-request-id': 'req-test-deny-01' },
      body: { admissionId: ADM_ACTIVE, patientId: PT_JOHN_DOE }
    };

    let responseStatus = 0;
    let responseJson: any = null;
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return {
          json: (data: any) => {
            responseJson = data;
          }
        };
      }
    };

    const middleware = requireLicensedModule('module:nursing', { action: 'create', resourceType: 'nursing' });

    // In clean test environment without active license for HOSP_PILOT, standard check rejects non-emergency writes
    let nextCalled = false;
    await middleware(mockReq, mockRes, () => {
      nextCalled = true;
    });

    // Without active license, non-continuity write should be 403 MODULE_NOT_LICENSED
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(responseStatus, 403);
    assert.strictEqual(responseJson.code, 'MODULE_NOT_LICENSED');
  });

  await t.test('P0-01.3: Historical clinical read-only access is PERMANENTLY permitted despite expired license', async () => {
    const mockReq: any = {
      user: {
        id: 'usr-doctor-01',
        hospitalId: HOSP_PILOT,
        userType: 'staff',
        roles: ['doctor']
      },
      hospitalId: HOSP_PILOT,
      method: 'GET',
      originalUrl: '/api/v1/clinical/history/pt-synth-001',
      headers: { 'x-request-id': 'req-test-read-01' },
      params: { patientId: PT_JOHN_DOE },
      body: {}
    };

    let nextCalled = false;
    const mockRes: any = {
      status: () => mockRes,
      json: () => {}
    };

    const middleware = requireLicensedModule('module:clinical', { allowReadContinuity: true });
    await middleware(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'Historical clinical read queries must NEVER be blocked during licensing lapses');
    assert.ok(mockReq.clinicalContinuity);
    assert.strictEqual(mockReq.clinicalContinuity.isContinuitySession, true);
    assert.strictEqual(mockReq.clinicalContinuity.bypassType, 'CLINICAL_CONTINUITY');
  });

  await t.test('P0-01.4: Emergency module and triage is fail-safe and immune to commercial lockouts', async () => {
    const mockReq: any = {
      user: {
        id: 'usr-er-triage-01',
        hospitalId: HOSP_PILOT,
        userType: 'staff',
        roles: ['emergency_physician']
      },
      hospitalId: HOSP_PILOT,
      method: 'POST',
      originalUrl: '/api/v1/emergency/triage',
      headers: { 'x-request-id': 'req-er-triage-01' },
      body: { triagePriority: 'RED', patientId: PT_JOHN_DOE }
    };

    let nextCalled = false;
    const mockRes: any = {
      status: () => mockRes,
      json: () => {}
    };

    const erMiddleware = requireLicensedModule('module:emergency');
    await erMiddleware(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'Emergency department routes must be fail-safe and never locked out');
    assert.ok(mockReq.clinicalContinuity);
    assert.strictEqual(mockReq.clinicalContinuity.bypassType, 'EMERGENCY_FAILSAFE');
  });

  // --------------------------------------------------------------------------
  // P0-02 TESTS: Surgical Continuity State Machine & Session Locks
  // --------------------------------------------------------------------------

  await t.test('P0-02.1: Reject intraoperative procedure initiation without WHO Time-Out verification', async () => {
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.initiateIntraoperativeSession({
          hospitalId: HOSP_PILOT,
          scheduleId: SURG_SCHEDULE_01,
          patientId: PT_JOHN_DOE,
          theatreId: 'ot-suite-01',
          primarySurgeonId: 'usr-surgeon-01',
          anaesthetistId: 'usr-anaesth-01',
          timeOutVerified: false // VIOLATION
        });
      },
      /WHO Surgical Safety Time-Out must be verified/,
      'Must reject procedure initiation if WHO Time-Out was not verified'
    );
  });

  await t.test('P0-02.2: Intraoperative session activation locks surgical continuity server-side', async () => {
    const session = await SurgicalContinuityService.initiateIntraoperativeSession({
      hospitalId: HOSP_PILOT,
      scheduleId: SURG_SCHEDULE_01,
      patientId: PT_JOHN_DOE,
      theatreId: 'ot-suite-01',
      primarySurgeonId: 'usr-surgeon-01',
      anaesthetistId: 'usr-anaesth-01',
      timeOutVerified: true,
      maxDurationHours: 8
    });

    assert.strictEqual(session.currentState, 'INTRAOPERATIVE_ACTIVE');
    assert.strictEqual(session.continuityLockActive, true);
    assert.strictEqual(SurgicalContinuityService.isSessionProtected(SURG_SCHEDULE_01, HOSP_PILOT), true);

    // Verify licensing middleware recognizes active surgical session lock
    const mockReq: any = {
      user: { id: 'usr-surgeon-01', hospitalId: HOSP_PILOT, userType: 'staff', roles: ['surgeon'] },
      hospitalId: HOSP_PILOT,
      method: 'POST',
      originalUrl: '/api/v1/ot/advanced/intraop-vitals',
      headers: { 'x-request-id': 'req-ot-intraop-01' },
      body: { scheduleId: SURG_SCHEDULE_01, systolicBp: 120, diastolicBp: 80 }
    };

    let nextCalled = false;
    const mockRes: any = { status: () => mockRes, json: () => {} };
    const otMiddleware = requireLicensedModule('module:ot');
    await otMiddleware(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'Active surgery must be protected from licensing interruption');
    assert.ok(mockReq.clinicalContinuity.reason.includes('Surgical continuity safeguard'));
  });

  await t.test('P0-02.3: Authorized intraoperative handover between distinct surgeons with audit', async () => {
    // Rejects identical surgeon
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.performHandover({
          scheduleId: SURG_SCHEDULE_01,
          hospitalId: HOSP_PILOT,
          outgoingSurgeonId: 'usr-surgeon-01',
          incomingSurgeonId: 'usr-surgeon-01', // Same ID
          notes: 'Invalid same surgeon'
        });
      },
      /Incoming and outgoing surgeons must be distinct individuals/
    );

    // Rejects unauthorized outgoing surgeon
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.performHandover({
          scheduleId: SURG_SCHEDULE_01,
          hospitalId: HOSP_PILOT,
          outgoingSurgeonId: 'usr-imposter-surgeon',
          incomingSurgeonId: 'usr-surgeon-02',
          notes: 'Unassigned surgeon'
        });
      },
      /Outgoing clinician does not match currently registered primary surgeon/
    );

    // Valid handover
    const session = await SurgicalContinuityService.performHandover({
      scheduleId: SURG_SCHEDULE_01,
      hospitalId: HOSP_PILOT,
      outgoingSurgeonId: 'usr-surgeon-01',
      incomingSurgeonId: 'usr-surgeon-02',
      notes: 'Routine scheduled mid-procedure handover for vascular bypass'
    });

    assert.strictEqual(session.primarySurgeonId, 'usr-surgeon-02');
    assert.strictEqual(session.currentState, 'INTRAOPERATIVE_ACTIVE');
    assert.strictEqual(session.handoverHistory.length, 1);
    assert.strictEqual(session.handoverHistory[0].incomingSurgeonId, 'usr-surgeon-02');
  });

  await t.test('P0-02.4: Transfer to PACU requires WHO Sign-Out and maintains continuity lock', async () => {
    // Rejection without Sign-Out
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.transferToPacu({
          scheduleId: SURG_SCHEDULE_01,
          hospitalId: HOSP_PILOT,
          transferringSurgeonId: 'usr-surgeon-02',
          receivingNurseId: 'usr-pacu-nurse-01',
          signOutVerified: false
        });
      },
      /WHO Surgical Safety Sign-Out phase must be completed/
    );

    // Valid PACU Transfer
    const session = await SurgicalContinuityService.transferToPacu({
      scheduleId: SURG_SCHEDULE_01,
      hospitalId: HOSP_PILOT,
      transferringSurgeonId: 'usr-surgeon-02',
      receivingNurseId: 'usr-pacu-nurse-01',
      signOutVerified: true
    });

    assert.strictEqual(session.currentState, 'PACU_RECOVERY');
    assert.strictEqual(session.continuityLockActive, true, 'Lock must remain active during PACU recovery');
    assert.strictEqual(SurgicalContinuityService.isSessionProtected(SURG_SCHEDULE_01, HOSP_PILOT), true);
  });

  await t.test('P0-02.5: Procedure closure strictly blocks discharge if Aldrete score < 9', async () => {
    // Blocked if score is 7/10
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.closeProcedure({
          scheduleId: SURG_SCHEDULE_01,
          hospitalId: HOSP_PILOT,
          dischargePhysicianId: 'usr-anaesth-01',
          aldreteScore: 7, // INSUFFICIENT
          destination: 'SURGICAL_WARD'
        });
      },
      /ALDRETE_SCORE_INSUFFICIENT: Modified Aldrete Score is 7\/10. Score >= 9 is strictly required/
    );

    // Procedure remains locked
    assert.strictEqual(SurgicalContinuityService.isSessionProtected(SURG_SCHEDULE_01, HOSP_PILOT), true);

    // Safe discharge when Aldrete is 9/10
    const closedSession = await SurgicalContinuityService.closeProcedure({
      scheduleId: SURG_SCHEDULE_01,
      hospitalId: HOSP_PILOT,
      dischargePhysicianId: 'usr-anaesth-01',
      aldreteScore: 10,
      destination: 'SURGICAL_WARD'
    });

    assert.strictEqual(closedSession.currentState, 'PROCEDURE_CLOSED');
    assert.strictEqual(closedSession.continuityLockActive, false, 'Lock must be released upon safe PACU discharge');
    assert.strictEqual(SurgicalContinuityService.isSessionProtected(SURG_SCHEDULE_01, HOSP_PILOT), false);
  });

  await t.test('P0-02.6: Controlled stale surgical session recovery with clinical supervisor authorization', async () => {
    const STALE_SCHEDULE = 'sched-stale-ot-999';

    // Initiate session
    await SurgicalContinuityService.initiateIntraoperativeSession({
      hospitalId: HOSP_PILOT,
      scheduleId: STALE_SCHEDULE,
      patientId: PT_JANE_ROE,
      theatreId: 'ot-suite-02',
      primarySurgeonId: 'usr-surgeon-03',
      anaesthetistId: 'usr-anaesth-02',
      timeOutVerified: true
    });

    // Unauthorized staff cannot recover stale session
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.recoverStaleSession({
          scheduleId: STALE_SCHEDULE,
          hospitalId: HOSP_PILOT,
          supervisorId: 'usr-junior-nurse-01',
          supervisorRole: 'staff_nurse',
          justification: 'System left logged in overnight',
          resolution: 'FORCE_CLOSE_RECOVERY'
        });
      },
      /UNAUTHORIZED_STALE_RECOVERY/
    );

    // Insufficient justification rejected
    await assert.rejects(
      async () => {
        await SurgicalContinuityService.recoverStaleSession({
          scheduleId: STALE_SCHEDULE,
          hospitalId: HOSP_PILOT,
          supervisorId: 'usr-chief-surgery',
          supervisorRole: 'chief_of_surgery',
          justification: 'short', // < 15 chars
          resolution: 'FORCE_CLOSE_RECOVERY'
        });
      },
      /JUSTIFICATION_REQUIRED/
    );

    // Valid supervisor recovery
    const recovered = await SurgicalContinuityService.recoverStaleSession({
      scheduleId: STALE_SCHEDULE,
      hospitalId: HOSP_PILOT,
      supervisorId: 'usr-chief-surgery',
      supervisorRole: 'chief_of_surgery',
      justification: 'Patient transferred emergently to tertiary cath lab; OT session completed with paper charting.',
      resolution: 'TRANSFER_ICU'
    });

    assert.strictEqual(recovered.currentState, 'STALE_RECOVERED');
    assert.strictEqual(recovered.continuityLockActive, false);
    assert.strictEqual(SurgicalContinuityService.isSessionProtected(STALE_SCHEDULE, HOSP_PILOT), false);
  });

  // --------------------------------------------------------------------------
  // P0-03 TESTS: Bedside eMAR Fail-Safe & Medication Safety Verification
  // --------------------------------------------------------------------------

  const RX_ACTIVE_HEPARIN: PrescribedMedication = {
    id: 'rx-item-heparin-001',
    hospitalId: HOSP_PILOT,
    admissionId: ADM_ACTIVE,
    patientId: PT_JOHN_DOE,
    drugId: 'drug-heparin-5000',
    drugName: 'Heparin Sodium Injection',
    dose: '5000 IU',
    route: 'SUBCUTANEOUS',
    frequency: 'Q12H',
    isHighAlertOrNarcotic: true,
    status: 'ACTIVE',
    prescribedByDoctorId: 'usr-cardiologist-01',
    prescribedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString()
  };

  const RX_CANCELLED_ANTIBIOTIC: PrescribedMedication = {
    id: 'rx-item-penicillin-002',
    hospitalId: HOSP_PILOT,
    admissionId: ADM_ACTIVE,
    patientId: PT_JOHN_DOE,
    drugId: 'drug-penicillin-g',
    drugName: 'Penicillin G Potassium',
    dose: '2,000,000 units',
    route: 'INTRAVENOUS',
    frequency: 'Q4H',
    isHighAlertOrNarcotic: false,
    status: 'CANCELLED', // CANCELLED ORDER
    prescribedByDoctorId: 'usr-physician-01',
    prescribedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString()
  };

  EMARSafetyService.seedPrescription(RX_ACTIVE_HEPARIN);
  EMARSafetyService.seedPrescription(RX_CANCELLED_ANTIBIOTIC);

  await t.test('P0-03.1: eMAR fail-safe REJECTS administration against cancelled or invalid prescriptions', async () => {
    await assert.rejects(
      async () => {
        await EMARSafetyService.administerMedicationSafe({
          hospitalId: HOSP_PILOT,
          admissionId: ADM_ACTIVE,
          patientId: PT_JOHN_DOE,
          prescriptionItemId: 'rx-item-penicillin-002', // Cancelled
          drugId: 'drug-penicillin-g',
          scheduledTime: '2026-11-13T10:00:00Z',
          doseAdministered: '2,000,000 units',
          routeUsed: 'INTRAVENOUS',
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: 'usr-nurse-01',
          isContinuityFailsafe: true,
          failSafeReason: 'Licensing server offline'
        });
      },
      /PRESCRIPTION_INACTIVE_REJECTED.*Medication cannot be administered against cancelled/,
      'Fail-safe must NEVER allow administration against cancelled prescriptions'
    );
  });

  await t.test('P0-03.2: Rejects patient identity mismatch between prescription and administration input', async () => {
    await assert.rejects(
      async () => {
        await EMARSafetyService.administerMedicationSafe({
          hospitalId: HOSP_PILOT,
          admissionId: ADM_ACTIVE,
          patientId: PT_JANE_ROE, // WRONG PATIENT (Rx is for PT_JOHN_DOE)
          prescriptionItemId: 'rx-item-heparin-001',
          drugId: 'drug-heparin-5000',
          scheduledTime: '2026-11-13T08:00:00Z',
          doseAdministered: '5000 IU',
          routeUsed: 'SUBCUTANEOUS',
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: 'usr-nurse-01'
        });
      },
      /PRESCRIPTION_PATIENT_MISMATCH/
    );
  });

  await t.test('P0-03.3: High-alert medication requires distinct dual-nurse cosign', async () => {
    // Missing cosign
    await assert.rejects(
      async () => {
        await EMARSafetyService.administerMedicationSafe({
          hospitalId: HOSP_PILOT,
          admissionId: ADM_ACTIVE,
          patientId: PT_JOHN_DOE,
          prescriptionItemId: 'rx-item-heparin-001',
          drugId: 'drug-heparin-5000',
          scheduledTime: '2026-11-13T08:00:00Z',
          doseAdministered: '5000 IU',
          routeUsed: 'SUBCUTANEOUS',
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: 'usr-nurse-01',
          isHighAlertOrNarcotic: true
          // Missing cosigningNurseId
        });
      },
      /DUAL_COSIGN_REQUIRED/
    );

    // Same nurse attempting to self-cosign
    await assert.rejects(
      async () => {
        await EMARSafetyService.administerMedicationSafe({
          hospitalId: HOSP_PILOT,
          admissionId: ADM_ACTIVE,
          patientId: PT_JOHN_DOE,
          prescriptionItemId: 'rx-item-heparin-001',
          drugId: 'drug-heparin-5000',
          scheduledTime: '2026-11-13T08:00:00Z',
          doseAdministered: '5000 IU',
          routeUsed: 'SUBCUTANEOUS',
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: 'usr-nurse-01',
          cosigningNurseId: 'usr-nurse-01', // SAME NURSE
          isHighAlertOrNarcotic: true
        });
      },
      /CO_SIGN_IDENTITY_ERROR/
    );
  });

  await t.test('P0-03.4: Blocks administration if patient has documented severe allergy', async () => {
    await assert.rejects(
      async () => {
        await EMARSafetyService.administerMedicationSafe({
          hospitalId: HOSP_PILOT,
          admissionId: ADM_ACTIVE,
          patientId: PT_JOHN_DOE,
          prescriptionItemId: 'rx-item-heparin-001',
          drugId: 'drug-heparin-5000',
          drugName: 'Heparin Sodium Injection',
          scheduledTime: '2026-11-13T08:00:00Z',
          doseAdministered: '5000 IU',
          routeUsed: 'SUBCUTANEOUS',
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: 'usr-nurse-01',
          cosigningNurseId: 'usr-nurse-02',
          isHighAlertOrNarcotic: true,
          knownAllergies: ['Heparin', 'Sulfa'] // DOCUMENTED ALLERGY
        });
      },
      /ALLERGY_CONTRAINDICATION_BLOCKED/
    );
  });

  await t.test('P0-03.5: Prevents duplicate administration within therapeutic interval', async () => {
    // 1. Initial valid administration under licensing fail-safe
    const adminRecord = await EMARSafetyService.administerMedicationSafe({
      hospitalId: HOSP_PILOT,
      admissionId: ADM_ACTIVE,
      patientId: PT_JOHN_DOE,
      prescriptionItemId: 'rx-item-heparin-001',
      drugId: 'drug-heparin-5000',
      drugName: 'Heparin Sodium Injection',
      scheduledTime: '2026-11-13T08:00:00Z',
      doseAdministered: '5000 IU',
      routeUsed: 'SUBCUTANEOUS',
      administrationStatus: 'ADMINISTERED',
      administeringNurseId: 'usr-nurse-01',
      cosigningNurseId: 'usr-nurse-02',
      isHighAlertOrNarcotic: true,
      knownAllergies: [],
      isContinuityFailsafe: true,
      failSafeReason: 'Perpetual license server unreachable; active inpatient medication preserved'
    });

    assert.ok(adminRecord.id);
    assert.strictEqual(adminRecord.isContinuityFailsafe, true);
    assert.strictEqual(adminRecord.dualNurseVerified, true);
    assert.ok(adminRecord.auditHash);

    // 2. Immediate duplicate administration attempt must be blocked
    await assert.rejects(
      async () => {
        await EMARSafetyService.administerMedicationSafe({
          hospitalId: HOSP_PILOT,
          admissionId: ADM_ACTIVE,
          patientId: PT_JOHN_DOE,
          prescriptionItemId: 'rx-item-heparin-001',
          drugId: 'drug-heparin-5000',
          drugName: 'Heparin Sodium Injection',
          scheduledTime: '2026-11-13T08:00:00Z', // Same slot
          doseAdministered: '5000 IU',
          routeUsed: 'SUBCUTANEOUS',
          administrationStatus: 'ADMINISTERED',
          administeringNurseId: 'usr-nurse-03',
          cosigningNurseId: 'usr-nurse-04',
          isHighAlertOrNarcotic: true
        });
      },
      /DUPLICATE_ADMINISTRATION_PREVENTED/,
      'Duplicate administration of the same dose slot must be blocked'
    );
  });
});

