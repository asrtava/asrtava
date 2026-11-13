import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import {
  LicenseService,
  STANDARD_EDITION_ENTITLEMENTS,
  ALL_16_MODULES
} from '../src/modules/licensing/license.service';

// ============================================================================
// ASRTAVA TEST SUITE: PERPETUAL SOFTWARE LICENSING & COMMERCIAL MANAGEMENT
// Verifies One-Time Perpetual Licensing, Cryptographic Claims, Modular
// Entitlements, AMC Independence, and Clinical Continuity Safeguards
// ============================================================================

test('ASRTAVA Perpetual Software Licensing & Commercial Management Suite', async (t) => {
  LicenseService.clearState();

  const HOSP_METRO = 'hosp-metro-care-01';
  const HOSP_COMMUNITY = 'hosp-community-clinic-02';
  const HOSP_ACQUISITION = 'hosp-acquired-group-03';
  const SUPER_ADMIN_ID = 'usr-super-admin-01';

  let metroLicenseId = '';
  let metroActivationKey = '';
  let metroActivationToken = '';

  // --------------------------------------------------------------------------
  // TEST 1: Perpetual License Issuance with Modular Entitlements and Limits
  // --------------------------------------------------------------------------
  await t.test('1. Issue perpetual software license with modular entitlements and capacity limits', async () => {
    const license = await LicenseService.issueLicense({
      hospitalId: HOSP_METRO,
      edition: 'standard_hospital',
      deploymentModel: 'cloud',
      authorizedLocations: 3,
      authorizedInstallations: 5,
      maxBeds: 250,
      maxDoctors: 50,
      issuedBy: SUPER_ADMIN_ID,
      notes: 'Initial one-time perpetual procurement for Metro Care Hospital'
    });

    assert.ok(license.id, 'License must have generated unique ID');
    assert.ok(license.license_number.startsWith('ASR-LIC-'), 'License number must follow standard convention');
    assert.strictEqual(license.hospital_id, HOSP_METRO);
    assert.strictEqual(license.edition, 'standard_hospital');
    assert.strictEqual(license.status, 'issued');
    assert.strictEqual(license.license_type, 'perpetual');
    assert.strictEqual(license.authorized_locations, 3);
    assert.strictEqual(license.max_beds, 250);

    // Standard hospital edition must have 10 modules
    const expectedModules = STANDARD_EDITION_ENTITLEMENTS['standard_hospital'];
    assert.strictEqual(license.licensed_modules.length, expectedModules.length);
    assert.ok(license.licensed_modules.includes('module:opd'));
    assert.ok(license.licensed_modules.includes('module:ipd'));
    assert.ok(license.licensed_modules.includes('module:pharmacy'));
    assert.ok(license.licensed_modules.includes('module:lims'));
    assert.ok(license.licensed_modules.includes('module:ris'));
    // Emergency is an enterprise module, so standard_hospital shouldn't have it by default
    assert.strictEqual(license.licensed_modules.includes('module:emergency'), false);

    metroLicenseId = license.id;
    metroActivationKey = license.activation_key;
    metroActivationToken = license.activation_token;
  });

  // --------------------------------------------------------------------------
  // TEST 2: Cryptographic License Activation & Digital Signature Verification
  // --------------------------------------------------------------------------
  await t.test('2. Cryptographic license activation and signature verification', async () => {
    // A. Verify token integrity
    const verifyResult = LicenseService.verifyClaimsToken(metroActivationToken);
    assert.strictEqual(verifyResult.valid, true);
    assert.ok(verifyResult.claims);
    assert.strictEqual(verifyResult.claims?.hospitalId, HOSP_METRO);
    assert.strictEqual(verifyResult.claims?.edition, 'standard_hospital');

    // B. Activate license
    const activation = await LicenseService.activateLicense({
      hospitalId: HOSP_METRO,
      activationKey: metroActivationKey,
      activatedBy: 'hosp-admin-metro'
    });

    assert.strictEqual(activation.success, true);
    assert.ok(activation.license);
    assert.strictEqual(activation.license?.status, 'active');
    assert.ok(activation.license?.activated_at);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Invalid License Token or Tenant Mismatch Rejection
  // --------------------------------------------------------------------------
  await t.test('3. Reject tampered license tokens and tenant mismatch activation attempts', async () => {
    // A. Tampered signature token
    const tamperedToken = metroActivationToken.substring(0, metroActivationToken.length - 6) + 'XXXXXX';
    const tamperedVerification = LicenseService.verifyClaimsToken(tamperedToken);
    assert.strictEqual(tamperedVerification.valid, false);
    assert.ok(tamperedVerification.error?.includes('tampered'));

    // B. Tenant mismatch (Hospital Community attempting to activate Hospital Metro license)
    const mismatchAttempt = await LicenseService.activateLicense({
      hospitalId: HOSP_COMMUNITY,
      activationToken: metroActivationToken
    });
    assert.strictEqual(mismatchAttempt.success, false);
    assert.ok(mismatchAttempt.error?.includes('mismatch'));
  });

  // --------------------------------------------------------------------------
  // TEST 4: Backend Module Entitlement Enforcement
  // --------------------------------------------------------------------------
  await t.test('4. Module entitlement enforcement: Licensed ALLOW vs Unlicensed FORBIDDEN', async () => {
    // OPD is included in standard_hospital -> ALLOW
    const opdCheck = LicenseService.checkModuleEntitlement(HOSP_METRO, 'module:opd');
    assert.strictEqual(opdCheck.allowed, true);
    assert.ok(opdCheck.reason.includes('is entitled under perpetual license'));

    // Pharmacy is included in standard_hospital -> ALLOW
    const pharmCheck = LicenseService.checkModuleEntitlement(HOSP_METRO, 'module:pharmacy');
    assert.strictEqual(pharmCheck.allowed, true);

    // OT (Operation Theatre) is NOT included in standard_hospital -> FORBIDDEN
    const otCheck = LicenseService.checkModuleEntitlement(HOSP_METRO, 'module:ot');
    assert.strictEqual(otCheck.allowed, false);
    assert.ok(otCheck.reason.includes('not included in the hospital\'s standard_hospital perpetual license'));

    // Dynamically expand license with OT module add-on
    LicenseService.addModulesToLicense(metroLicenseId, ['module:ot'], SUPER_ADMIN_ID, 'Purchased OT module add-on');

    const otCheckAfterAdd = LicenseService.checkModuleEntitlement(HOSP_METRO, 'module:ot');
    assert.strictEqual(otCheckAfterAdd.allowed, true);
    assert.ok(otCheckAfterAdd.reason.includes('is entitled'));
  });

  // --------------------------------------------------------------------------
  // TEST 5: Location and Installation Limits Enforcement
  // --------------------------------------------------------------------------
  await t.test('5. Capacity validation: Locations, installations, and beds limits', async () => {
    // Authorized locations = 3
    const locValid = LicenseService.checkCapacity(HOSP_METRO, 'locations', 3);
    assert.strictEqual(locValid.allowed, true);

    const locExceeded = LicenseService.checkCapacity(HOSP_METRO, 'locations', 4);
    assert.strictEqual(locExceeded.allowed, false);
    assert.strictEqual(locExceeded.limit, 3);
    assert.ok(locExceeded.reason.includes('exceeds authorized locations limit of 3'));

    // Max beds = 250
    const bedsValid = LicenseService.checkCapacity(HOSP_METRO, 'beds', 200);
    assert.strictEqual(bedsValid.allowed, true);

    const bedsExceeded = LicenseService.checkCapacity(HOSP_METRO, 'beds', 300);
    assert.strictEqual(bedsExceeded.allowed, false);
    assert.strictEqual(bedsExceeded.limit, 250);
  });

  // --------------------------------------------------------------------------
  // TEST 6: License Transfer & Tenant Ownership Change with Immutable Audit
  // --------------------------------------------------------------------------
  await t.test('6. License transfer and tenant ownership change with audit logging', async () => {
    const transferResult = LicenseService.transferLicense({
      licenseId: metroLicenseId,
      targetHospitalId: HOSP_ACQUISITION,
      transferredBy: SUPER_ADMIN_ID,
      transferReason: 'Corporate acquisition and merger of Metro Care into Acquisition Healthcare'
    });

    assert.strictEqual(transferResult.originalLicense.status, 'transferred');
    assert.strictEqual(transferResult.originalLicense.transferred_to_hospital_id, HOSP_ACQUISITION);

    assert.strictEqual(transferResult.newLicense.status, 'active');
    assert.strictEqual(transferResult.newLicense.hospital_id, HOSP_ACQUISITION);
    assert.ok(transferResult.newLicense.licensed_modules.includes('module:opd'));
    assert.ok(transferResult.newLicense.licensed_modules.includes('module:ot'));

    // Check audit trail
    const auditLogs = LicenseService.getAuditLogs(metroLicenseId);
    const transferLog = auditLogs.find((l) => l.event_type === 'license_transferred');
    assert.ok(transferLog, 'Transfer event must be immutably recorded in audit log');
    assert.strictEqual(transferLog.actor_id, SUPER_ADMIN_ID);
  });

  // --------------------------------------------------------------------------
  // TEST 7: Controlled Administrative Suspension & Reinstatement
  // --------------------------------------------------------------------------
  await t.test('7. Controlled administrative suspension and reinstatement', async () => {
    // Issue a license for Community Clinic
    const commLic = await LicenseService.issueLicense({
      hospitalId: HOSP_COMMUNITY,
      edition: 'clinic_basic',
      issuedBy: SUPER_ADMIN_ID
    });
    await LicenseService.activateLicense({
      hospitalId: HOSP_COMMUNITY,
      activationKey: commLic.activation_key
    });

    assert.strictEqual(LicenseService.checkModuleEntitlement(HOSP_COMMUNITY, 'module:opd').allowed, true);

    // Administrative suspension
    LicenseService.suspendLicense(commLic.id, 'Court injunction pending ownership litigation', SUPER_ADMIN_ID);
    const suspendedLic = LicenseService.getLicenseById(commLic.id);
    assert.strictEqual(suspendedLic?.status, 'suspended');
    assert.strictEqual(suspendedLic?.suspension_reason, 'Court injunction pending ownership litigation');

    // While suspended, non-critical modules return false
    const opdWhileSuspended = LicenseService.checkModuleEntitlement(HOSP_COMMUNITY, 'module:opd');
    assert.strictEqual(opdWhileSuspended.allowed, false);

    // Reinstatement
    LicenseService.reinstateLicense(commLic.id, SUPER_ADMIN_ID);
    const reinstatedLic = LicenseService.getLicenseById(commLic.id);
    assert.strictEqual(reinstatedLic?.status, 'active');
    assert.strictEqual(LicenseService.checkModuleEntitlement(HOSP_COMMUNITY, 'module:opd').allowed, true);
  });

  // --------------------------------------------------------------------------
  // TEST 8: Maintenance Agreement (AMC) Expiry Leaves Core License 100% Active
  // --------------------------------------------------------------------------
  await t.test('8. Separate AMC expiry NEVER terminates perpetual core software license', async () => {
    // Register an AMC that expired yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastYear = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const commLic = LicenseService.getHospitalLicense(HOSP_COMMUNITY).license!;
    LicenseService.createMaintenanceAgreement({
      licenseId: commLic.id,
      hospitalId: HOSP_COMMUNITY,
      planTier: 'silver',
      startDate: pastYear,
      endDate: yesterday,
      annualFeeInr: 50000
    });

    // Verify core license is STILL ACTIVE
    const hospitalLicenseState = LicenseService.getHospitalLicense(HOSP_COMMUNITY);
    assert.strictEqual(hospitalLicenseState.license?.status, 'active');

    // Core module remains fully accessible
    const opdCheck = LicenseService.checkModuleEntitlement(HOSP_COMMUNITY, 'module:opd');
    assert.strictEqual(opdCheck.allowed, true, 'Core OPD module must remain fully functional despite AMC expiry');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Upgrade Entitlement Check (Active AMC vs Lapsed AMC)
  // --------------------------------------------------------------------------
  await t.test('9. Upgrade entitlement: Active AMC grants upgrades, lapsed AMC locks version without blocking usage', async () => {
    // Community clinic AMC is expired
    const expiredUpgrade = LicenseService.checkUpgradeEligibility(HOSP_COMMUNITY);
    assert.strictEqual(expiredUpgrade.eligible, false);
    assert.ok(expiredUpgrade.reason.includes('has lapsed'));
    assert.ok(expiredUpgrade.reason.includes('retains perpetual rights to run the current installed version'));

    // Renew AMC for Community clinic
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    LicenseService.createMaintenanceAgreement({
      licenseId: LicenseService.getHospitalLicense(HOSP_COMMUNITY).license!.id,
      hospitalId: HOSP_COMMUNITY,
      planTier: 'gold',
      slaResponseHours: 4,
      includesUpgrades: true,
      startDate: today,
      endDate: nextYear,
      annualFeeInr: 75000
    });

    const activeUpgrade = LicenseService.checkUpgradeEligibility(HOSP_COMMUNITY);
    assert.strictEqual(activeUpgrade.eligible, true);
    assert.strictEqual(activeUpgrade.activeAgreement?.plan_tier, 'gold');
    assert.ok(activeUpgrade.reason.includes('Eligible for software upgrades under active GOLD AMC'));
  });

  // --------------------------------------------------------------------------
  // TEST 10: Clinical Continuity Safety Check (Emergency & Patient Registry)
  // --------------------------------------------------------------------------
  await t.test('10. Clinical continuity safety check: Zero lockout for Emergency and Patient Registry', async () => {
    const UNLICENSED_HOSPITAL = 'hosp-unlicensed-or-expired';

    // Emergency care must NEVER be locked out even if hospital has NO license record
    const emergencyCheck = LicenseService.checkModuleEntitlement(UNLICENSED_HOSPITAL, 'module:emergency');
    assert.strictEqual(emergencyCheck.allowed, true);
    assert.strictEqual(emergencyCheck.isFailSafeBypass, true);
    assert.ok(emergencyCheck.reason.includes('Emergency clinical continuity guarantee'));

    // Patient registry lookup must NEVER be locked out
    const ptCheck = LicenseService.checkModuleEntitlement(UNLICENSED_HOSPITAL, 'module:patient_mgmt');
    assert.strictEqual(ptCheck.allowed, true);
    assert.strictEqual(ptCheck.isFailSafeBypass, true);

    // Non-critical modules are strictly blocked (fail-safe does NOT grant unauthorized access)
    const blockedModules = [
      'module:pharmacy',
      'module:billing',
      'module:lis',
      'module:ris',
      'module:ot',
      'module:telemedicine',
      'module:hr',
      'module:inventory',
      'module:analytics'
    ];

    for (const mod of blockedModules) {
      const check = LicenseService.checkModuleEntitlement(UNLICENSED_HOSPITAL, mod);
      assert.strictEqual(check.allowed, false, `Module ${mod} must not be bypassed under emergency fail-safe`);
      assert.strictEqual(check.isFailSafeBypass, undefined, `Module ${mod} must not have failSafeBypass set`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 11: One-Time Commercial Sales Invoice and Milestone Payment
  // --------------------------------------------------------------------------
  await t.test('11. One-time commercial sales order, milestone invoice and payment recording', async () => {
    const order = LicenseService.createCommercialOrder({
      hospitalId: HOSP_METRO,
      edition: 'standard_hospital',
      licenseFeeInr: 1200000, // 12 Lakhs one-time license fee
      implementationFeeInr: 250000, // 2.5 Lakhs deployment & training
      amcFeeInr: 150000, // 1.5 Lakhs Year 1 Gold AMC
      paymentTerms: 'milestone_split'
    });

    assert.strictEqual(order.total_order_amount_inr, 1600000);
    assert.strictEqual(order.payment_status, 'pending');
    assert.strictEqual(order.paid_amount_inr, 0);

    // Milestone 1 payment: 50% advance
    const orderMilestone1 = LicenseService.recordPayment(order.id, 800000);
    assert.strictEqual(orderMilestone1.paid_amount_inr, 800000);
    assert.strictEqual(orderMilestone1.payment_status, 'partial');

    // Milestone 2 payment: Remaining balance
    const orderFinal = LicenseService.recordPayment(order.id, 800000);
    assert.strictEqual(orderFinal.paid_amount_inr, 1600000);
    assert.strictEqual(orderFinal.payment_status, 'paid_in_full');
  });

  // --------------------------------------------------------------------------
  // TEST 12: Offline License Claims Validation for On-Premises Air-Gapped Deployments
  // --------------------------------------------------------------------------
  await t.test('12. Offline air-gapped license claims validation with hardware binding', async () => {
    const HARDWARE_FINGERPRINT = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    // Issue on-premises license bound to local server hardware
    const onPremLicense = await LicenseService.issueLicense({
      hospitalId: 'hosp-air-gapped-rural-01',
      edition: 'enterprise_multispecialty',
      deploymentModel: 'on_premises',
      hardwareFingerprintHash: HARDWARE_FINGERPRINT,
      authorizedLocations: 1,
      authorizedInstallations: 2,
      issuedBy: SUPER_ADMIN_ID
    });

    assert.strictEqual(onPremLicense.deployment_model, 'on_premises');
    assert.strictEqual(onPremLicense.hardware_fingerprint_hash, HARDWARE_FINGERPRINT);
    assert.strictEqual(onPremLicense.licensed_modules.length, ALL_16_MODULES.length);

    // Mismatched hardware activation attempt should FAIL
    const failedActivation = await LicenseService.activateLicense({
      hospitalId: 'hosp-air-gapped-rural-01',
      activationToken: onPremLicense.activation_token,
      hardwareFingerprintHash: 'unauthorized-cloned-server-fingerprint'
    });
    assert.strictEqual(failedActivation.success, false);
    assert.ok(failedActivation.error?.includes('Hardware fingerprint binding failed'));

    // Matching hardware activation should SUCCEED
    const validActivation = await LicenseService.activateLicense({
      hospitalId: 'hosp-air-gapped-rural-01',
      activationToken: onPremLicense.activation_token,
      hardwareFingerprintHash: HARDWARE_FINGERPRINT
    });
    assert.strictEqual(validActivation.success, true);
    assert.strictEqual(validActivation.license?.status, 'active');
  });
});
