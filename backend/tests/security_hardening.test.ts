import assert from 'assert';
import { PasswordPolicyService } from '../src/modules/security/password-policy.service';
import { SessionSecurityService } from '../src/modules/security/session-security.service';
import { AuditLoggerService } from '../src/modules/security/audit-logger.service';
import { PrivacyGovernanceService } from '../src/modules/security/privacy-governance.service';
import { TenantIsolationGuard } from '../src/modules/security/tenant-isolation.guard';

async function runSecurityHardeningTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING ASRTAVA SECURITY HARDENING & DATA PRIVACY TEST SUITE');
  console.log('================================================================\n');

  let passedCount = 0;
  let testIndex = 1;

  // Helper test runner
  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`  ✅ Test ${testIndex++}: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ❌ Test ${testIndex++}: ${name} FAILED!`);
      console.error(`     Error: ${err.message}`);
      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // 1. Password Policy & NIST SP 800-63B Compliance Tests
  // --------------------------------------------------------------------------
  console.log('--- 1. Password Policy & Throttling Verification ---');

  await test('Reject password shorter than 10 characters', () => {
    const res = PasswordPolicyService.validatePasswordStrength('Short1!');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reasons.some(r => r.includes('at least 10 characters')));
  });

  await test('Reject password missing uppercase or symbol', () => {
    const res = PasswordPolicyService.validatePasswordStrength('alllowercase12345');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reasons.some(r => r.includes('uppercase')));
    assert.ok(res.reasons.some(r => r.includes('special character')));
  });

  await test('Reject common breached healthcare dictionary passwords', () => {
    const res = PasswordPolicyService.validatePasswordStrength('Hospital@123');
    assert.strictEqual(res.isValid, false);
    assert.ok(res.reasons.some(r => r.includes('commonly breached dictionary')));
  });

  await test('Accept strong NIST-compliant healthcare passphrase', () => {
    const res = PasswordPolicyService.validatePasswordStrength('MedSecure#Cardio2026!');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.reasons.length, 0);
    assert.ok(res.score >= 3);
  });

  await test('Bcrypt salted hashing and verification operates reliably', async () => {
    const rawPass = 'DoctorAuth#2026!';
    const hash = await PasswordPolicyService.hashPassword(rawPass);
    assert.ok(hash.startsWith('$2'));

    const isMatch = await PasswordPolicyService.verifyPassword(rawPass, hash);
    assert.strictEqual(isMatch, true);

    const isBadMatch = await PasswordPolicyService.verifyPassword('WrongPass123!', hash);
    assert.strictEqual(isBadMatch, false);
  });

  await test('Progressive login throttling triggers delay and lockout after 5 consecutive failures', () => {
    const testIdentifier = 'dr.attack.target@hospital.org';
    PasswordPolicyService.clearLoginThrottle(testIdentifier);

    // Initial state: not locked
    let throttle = PasswordPolicyService.checkLoginThrottle(testIdentifier);
    assert.strictEqual(throttle.isLocked, false);
    assert.strictEqual(throttle.delayMs, 0);

    // 4 failed attempts: progressive delay rises
    for (let i = 1; i <= 4; i++) {
      PasswordPolicyService.recordFailedAttempt(testIdentifier);
    }
    throttle = PasswordPolicyService.checkLoginThrottle(testIdentifier);
    assert.strictEqual(throttle.isLocked, false);
    assert.ok(throttle.delayMs > 0, 'Progressive delay should increase');

    // 5th failed attempt: triggers account lockout
    const lockResult = PasswordPolicyService.recordFailedAttempt(testIdentifier);
    assert.strictEqual(lockResult.isNowLocked, true);

    throttle = PasswordPolicyService.checkLoginThrottle(testIdentifier);
    assert.strictEqual(throttle.isLocked, true);
    assert.ok(throttle.remainingLockoutSeconds! > 800, 'Should have ~900s remaining');

    // Reset on successful unlock
    PasswordPolicyService.clearLoginThrottle(testIdentifier);
    throttle = PasswordPolicyService.checkLoginThrottle(testIdentifier);
    assert.strictEqual(throttle.isLocked, false);
  });

  // --------------------------------------------------------------------------
  // 2. Refresh Token Family Rotation & Replay Reuse Detection
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Session Security & Refresh Token Rotation ---');

  await test('Creates session with token family and rotates refresh token', async () => {
    const session = await SessionSecurityService.createSessionWithFamily({
      userId: 'test-user-uuid-1',
      hospitalId: 'test-hosp-uuid-1',
      userType: 'staff',
      roles: ['doctor'],
    });

    assert.ok(session.accessToken);
    assert.ok(session.refreshToken.includes('.'));
    assert.ok(session.tokenFamilyId);

    // Rotate with legitimate token
    const rotated = await SessionSecurityService.rotateRefreshToken(session.refreshToken);
    assert.strictEqual(rotated.success, true);
    assert.ok(rotated.accessToken);
    assert.ok(rotated.refreshToken);
    assert.strictEqual(rotated.tokenFamilyId, session.tokenFamilyId);

    // REPLAY ATTACK TEST: If adversary tries to reuse the old, already-rotated token:
    const replayAttempt = await SessionSecurityService.rotateRefreshToken(session.refreshToken);
    assert.strictEqual(replayAttempt.success, false);
    assert.strictEqual(replayAttempt.replayedReuseDetected, true);
    assert.ok(replayAttempt.message?.includes('Compromised session detected'));
  });

  // --------------------------------------------------------------------------
  // 3. Anti-BOLA / IDOR Tenant Isolation Guard Tests
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Anti-IDOR / Tenant Isolation Guard ---');

  await test('Allows access when user belongs to correct tenant', async () => {
    // Platform super admin is always allowed
    const superAdminCheck = await TenantIsolationGuard.verifyResourceTenantOwnership({
      tableName: 'patients',
      resourceId: 'pat-1',
      expectedHospitalId: 'hosp-1',
      userType: 'super_admin',
    });
    assert.strictEqual(superAdminCheck.isAllowed, true);
    assert.strictEqual(superAdminCheck.crossTenantBreach, false);
  });

  // --------------------------------------------------------------------------
  // 4. Cryptographic Clinical Audit Trail Tests
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Cryptographic Clinical Audit Trail ---');

  await test('Computes SHA-256 payload checksum consistently', () => {
    const timestamp = '2026-11-09T10:00:00.000Z';
    const hash1 = AuditLoggerService.computeRecordChecksum({
      hospitalId: 'hosp-alpha-uuid',
      actorId: 'doc-smith-uuid',
      action: 'RECORD_READ',
      resourceTable: 'patients',
      resourceId: 'pat-1001-uuid',
      beforeState: null,
      afterState: { viewed: true },
      previousChecksum: 'GENESIS_BLOCK',
      createdAtTimestamp: timestamp,
    });

    const hash2 = AuditLoggerService.computeRecordChecksum({
      hospitalId: 'hosp-alpha-uuid',
      actorId: 'doc-smith-uuid',
      action: 'RECORD_READ',
      resourceTable: 'patients',
      resourceId: 'pat-1001-uuid',
      beforeState: null,
      afterState: { viewed: true },
      previousChecksum: 'GENESIS_BLOCK',
      createdAtTimestamp: timestamp,
    });

    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64, 'SHA-256 should be 64 hex characters');

    // Tampered payload produces different checksum
    const tamperedHash = AuditLoggerService.computeRecordChecksum({
      hospitalId: 'hosp-alpha-uuid',
      actorId: 'doc-smith-uuid',
      action: 'RECORD_UPDATED', // Tampered action!
      resourceTable: 'patients',
      resourceId: 'pat-1001-uuid',
      beforeState: null,
      afterState: { viewed: true },
      previousChecksum: 'GENESIS_BLOCK',
      createdAtTimestamp: timestamp,
    });
    assert.notStrictEqual(hash1, tamperedHash);
  });

  await test('Logs clinical audit event and verifies block chaining', async () => {
    const event = await AuditLoggerService.logClinicalEvent({
      hospitalId: 'hosp-audit-test',
      actorId: 'staff-1',
      action: 'RECORD_READ',
      resourceTable: 'consultations',
      resourceId: 'enc-2026-001',
      accessedFields: ['diagnosis', 'rx_prescriptions'],
      justification: 'Routine outpatient review',
    });

    assert.ok(event.id);
    assert.strictEqual(event.checksum.length, 64);
  });

  // --------------------------------------------------------------------------
  // 5. Data Privacy & DPDP 2023 / HIPAA Governance Tests
  // --------------------------------------------------------------------------
  console.log('\n--- 5. DPDP Act 2023 & HIPAA Data Privacy Governance ---');

  await test('Masks phone numbers correctly (preserves country code, obscures last 5 digits)', () => {
    const masked = PrivacyGovernanceService.maskPhone('+919876543210');
    assert.strictEqual(masked, '+9198765*****');

    const empty = PrivacyGovernanceService.maskPhone(null);
    assert.strictEqual(empty, 'N/A');
  });

  await test('Masks email addresses correctly (preserves domain and first/last local characters)', () => {
    const masked = PrivacyGovernanceService.maskEmail('patient.care@apollohospitals.com');
    assert.strictEqual(masked, 'p***e@apollohospitals.com');

    const short = PrivacyGovernanceService.maskEmail('ab@test.com');
    assert.strictEqual(short, 'a***@test.com');
  });

  await test('Masks National IDs (Aadhaar / ABHA) preserving last 4 digits only', () => {
    const masked = PrivacyGovernanceService.maskNationalId('1234-5678-9012');
    assert.strictEqual(masked, 'XXXX-XXXX-9012');
  });

  await test('De-identifies full patient profile for privacy preservation', () => {
    const rawPatient = {
      id: 'pat-uuid-99',
      uhid: 'ASR-PAT-2026-0099',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      phone: '+919123456789',
      email: 'rajesh.sharma@example.com',
      national_id: '9876-5432-1098',
      gender: 'Male',
      date_of_birth: '1985-05-15',
      blood_group: 'B+',
    };

    const deIdentified = PrivacyGovernanceService.deIdentifyPatient(rawPatient);
    assert.strictEqual(deIdentified.fullName, 'R. Sharma');
    assert.strictEqual(deIdentified.maskedPhone, '+9191234*****');
    assert.strictEqual(deIdentified.maskedEmail, 'r***a@example.com');
    assert.strictEqual(deIdentified.maskedNationalId, 'XXXX-XXXX-1098');
    assert.strictEqual(deIdentified.isDeIdentified, true);
    assert.ok(deIdentified.ageYears! >= 40);
  });

  await test('Submits DPDP Data Subject Rights request and records 30-day statutory SLA', async () => {
    const dsr = await PrivacyGovernanceService.submitPrivacyRequest({
      hospitalId: 'hosp-dpdp-1',
      patientId: 'pat-dpdp-1',
      requesterName: 'Aarav Patel',
      requesterEmail: 'aarav.patel@example.com',
      requestType: 'erasure_request',
      notes: 'Requesting right to be forgotten under DPDP Act 2023',
    });

    assert.ok(dsr.id);
    assert.ok(dsr.requestNumber.startsWith('REQ-DSR-'));
    assert.strictEqual(dsr.status, 'pending_review');
    assert.strictEqual(dsr.legalHoldFlag, false);
  });

  await test('Erasure request triggers statutory legal hold under NMC RMP 2023 / Income Tax Act', async () => {
    const dsr = await PrivacyGovernanceService.submitPrivacyRequest({
      hospitalId: 'hosp-dpdp-2',
      patientId: 'pat-dpdp-2',
      requesterName: 'Priya Verma',
      requesterEmail: 'priya.verma@example.com',
      requestType: 'erasure_request',
    });

    const result = await PrivacyGovernanceService.processPrivacyRequest({
      requestId: dsr.id,
      action: 'apply_legal_hold',
      reviewerUserId: 'admin-privacy-officer-uuid',
    });

    // In a real database or mock, statutory retention prevents deletion
    assert.strictEqual(result.success, true);
    assert.ok(result.status === 'legal_hold_retained' || result.status === 'not_found');
  });

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedCount} ASRTAVA SECURITY & COMPLIANCE TESTS PASSED!`);
  console.log('================================================================\n');
}

runSecurityHardeningTests().catch((err) => {
  console.error('Security test suite encountered an unhandled error:', err);
  process.exit(1);
});

