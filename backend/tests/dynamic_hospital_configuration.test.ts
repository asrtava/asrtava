import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { DynamicHospitalConfigService, StaffEnrolmentInput } from '../src/modules/onboarding/dynamic-hospital-config.service';
import { OnboardingService } from '../src/modules/onboarding/onboarding.service';

// ============================================================================
// ASRTAVA DYNAMIC HOSPITAL CONFIGURATION & STAFF PROVISIONING TEST SUITE
// Verifies 12-section discovery, bespoke blueprint synthesis, cryptographic dual sign-off,
// and NIST SP 800-63B compliant staff credential manifest generation.
// ============================================================================

test('ASRTAVA Dynamic Hospital Discovery, Blueprint & Staff Provisioning Framework', async (t) => {
  const TENANT_A_ID = 'hosp-manipal-blr-01';
  const TENANT_B_ID = 'hosp-apollo-chn-02';
  const ASRTAVA_LEAD_ID = 'usr-lead-malhotra';
  const HOSPITAL_DIRECTOR_ID = 'usr-dir-hegde';

  // --------------------------------------------------------------------------
  // TEST 1: 12-Section Discovery Questionnaire Ingestion & Completeness
  // --------------------------------------------------------------------------
  await t.test('1. Discovery Questionnaire: Ingests sections and computes accurate completeness percentage', async () => {
    // Submit section 1: Hospital Profile & Legal Identity
    const s1 = await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: TENANT_A_ID,
      sectionNumber: 1,
      payload: {
        legalName: 'Manipal Super-Speciality Hospital Pvt Ltd',
        displayName: 'Manipal Hospital Bangalore',
        registrationNo: 'REG-KA-BLR-2026-9921',
        gstNumber: '29AAAAA0000A1Z5',
        timezone: 'Asia/Kolkata',
        currency: 'INR'
      },
      actorId: HOSPITAL_DIRECTOR_ID
    });
    assert.strictEqual(s1.sectionNumber, 1);
    assert.strictEqual(s1.completionStatus, 'submitted');
    assert.strictEqual(s1.data.legalName, 'Manipal Super-Speciality Hospital Pvt Ltd');

    // Submit section 2: Capacity & Classification
    const s2 = await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: TENANT_A_ID,
      sectionNumber: 2,
      payload: {
        licensedBeds: 150,
        icuBeds: 24,
        emergencyBays: 12,
        otSuites: 6,
        dialysisStations: 4,
        daycareBeds: 10
      },
      actorId: HOSPITAL_DIRECTOR_ID
    });
    assert.strictEqual(s2.sectionNumber, 2);
    assert.strictEqual(s2.data.licensedBeds, 150);

    // Submit section 3: Clinical Specialties
    await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: TENANT_A_ID,
      sectionNumber: 3,
      payload: {
        specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'General Surgery', 'Pediatrics'],
        hasTelemedicine: true,
        hasBloodBank: true
      },
      actorId: HOSPITAL_DIRECTOR_ID
    });

    // Check completeness metrics
    const report = await DynamicHospitalConfigService.getDiscoverySubmissions(TENANT_A_ID);
    assert.strictEqual(report.hospitalId, TENANT_A_ID);
    assert.strictEqual(report.completedCount, 3);
    assert.strictEqual(report.totalSections, 12);
    assert.strictEqual(report.completionPercentage, 25); // 3/12 = 25%

    // Reject invalid section numbers
    await assert.rejects(
      async () => {
        await DynamicHospitalConfigService.submitDiscoverySection({
          hospitalId: TENANT_A_ID,
          sectionNumber: 13, // Invalid
          payload: {}
        });
      },
      /Invalid section number 13/
    );
  });

  // --------------------------------------------------------------------------
  // TEST 2: Bespoke HMS Blueprint Synthesis (No Codebase Forking)
  // --------------------------------------------------------------------------
  await t.test('2. Bespoke HMS Blueprint Synthesis: Synthesizes modular HMS blueprint according to hospital capacity', async () => {
    // Submit remaining sections for full blueprint synthesis
    await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: TENANT_A_ID,
      sectionNumber: 7,
      payload: {
        triageStandard: 'ESI_1_5',
        narcoticsDualSignoff: true
      }
    });

    await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: TENANT_A_ID,
      sectionNumber: 8,
      payload: {
        generalOpdFee: 600,
        specialistOpdFee: 1200,
        emergencyAssessmentFee: 1800,
        generalBedRate: 1500,
        icuRate: 11000
      }
    });

    await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: TENANT_A_ID,
      sectionNumber: 11,
      payload: {
        deploymentModel: 'hybrid_edge_appliance',
        serverSpecs: '64 Cores, 256GB RAM, NVMe RAID-10',
        lanSpeed: '10 Gbps Switched Medical Fiber'
      }
    });

    const blueprint = await DynamicHospitalConfigService.generateBlueprint(TENANT_A_ID, ASRTAVA_LEAD_ID);

    assert.ok(blueprint.id.startsWith('BP-'));
    assert.strictEqual(blueprint.hospitalId, TENANT_A_ID);
    assert.strictEqual(blueprint.facilityTier, 'general_multispecialty');
    assert.strictEqual(blueprint.capacityMetrics.licensedBeds, 150);
    assert.strictEqual(blueprint.capacityMetrics.icuBeds, 24);
    assert.strictEqual(blueprint.capacityMetrics.otSuites, 6);

    // Verify dynamically enabled modules
    assert.ok(blueprint.enabledModules.includes('core_hms'));
    assert.ok(blueprint.enabledModules.includes('multi_tenant_rls'));
    assert.ok(blueprint.enabledModules.includes('emergency_department_triage'));
    assert.ok(blueprint.enabledModules.includes('operation_theatre_perioperative'));
    assert.ok(blueprint.enabledModules.includes('laboratory_information_system'));
    assert.ok(blueprint.enabledModules.includes('advanced_pharmacy_narcotics'));
    assert.ok(blueprint.enabledModules.includes('hybrid_edge_offline_journal'));

    // Verify clinical workflow policies
    assert.strictEqual(blueprint.clinicalWorkflows.triageStandard, 'ESI_1_5');
    assert.strictEqual(blueprint.clinicalWorkflows.surgicalSafetyProtocol, 'WHO_3_PHASE');
    assert.strictEqual(blueprint.clinicalWorkflows.narcoticsDualSignoff, true);
    assert.strictEqual(blueprint.clinicalWorkflows.digitalSignaturePKILevel, 4);

    // Verify status is pending approval initially
    assert.strictEqual(blueprint.status, 'pending_approval');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Cryptographic Dual Sign-Off Gate
  // --------------------------------------------------------------------------
  await t.test('3. Cryptographic Dual Sign-Off: Requires mutual cryptographic signatures to approve blueprint', async () => {
    // ASRTAVA Lead signs off
    const step1 = await DynamicHospitalConfigService.signBlueprint({
      hospitalId: TENANT_A_ID,
      role: 'asrtava_lead',
      signerId: ASRTAVA_LEAD_ID,
      signerName: 'Dr. Vikram Malhotra',
      notes: 'Infrastructure benchmarks and RLS tenant separation verified.'
    });

    assert.ok(step1.asrtavaLeadSignoff);
    assert.strictEqual(step1.asrtavaLeadSignoff.leadId, ASRTAVA_LEAD_ID);
    assert.ok(step1.asrtavaLeadSignoff.signatureHash.length === 64); // SHA-256 hex
    assert.strictEqual(step1.status, 'pending_approval'); // Still pending hospital director

    // Hospital Medical Director signs off
    const step2 = await DynamicHospitalConfigService.signBlueprint({
      hospitalId: TENANT_A_ID,
      role: 'hospital_director',
      signerId: HOSPITAL_DIRECTOR_ID,
      signerName: 'Dr. B. R. Hegde',
      notes: 'Clinical department catalogs and staff access rights approved.'
    });

    assert.ok(step2.hospitalDirectorSignoff);
    assert.strictEqual(step2.hospitalDirectorSignoff.directorId, HOSPITAL_DIRECTOR_ID);
    assert.ok(step2.hospitalDirectorSignoff.signatureHash.length === 64);
    assert.strictEqual(step2.status, 'approved'); // Fully mutually approved!
  });

  // --------------------------------------------------------------------------
  // TEST 4: Staff Enrolment, NIST SP 800-63B Credential Generation & Manifest
  // --------------------------------------------------------------------------
  await t.test('4. Staff Credential Provisioning: Generates collision-safe usernames, high-entropy passwords & manifest', async () => {
    const staffRoster: StaffEnrolmentInput[] = [
      {
        name: 'Dr. Arun Varma',
        email: 'arun.varma@manipal.health',
        phone: '+91 98450 11001',
        department: 'Cardiology',
        designation: 'Consultant Cardiologist',
        role: 'Doctor / Consultant',
        employeeId: 'EMP-DOC-001',
        medicalRegistrationNo: 'MCI-77112'
      },
      {
        name: 'Dr. Arun Varma', // Collision test with identical name!
        email: 'arun.varma.jr@manipal.health',
        phone: '+91 98450 11002',
        department: 'Pediatrics',
        designation: 'Junior Resident',
        role: 'Doctor / Resident',
        employeeId: 'EMP-DOC-002',
        medicalRegistrationNo: 'MCI-88223'
      },
      {
        name: 'Sister Anita Reddy',
        email: 'anita.reddy@manipal.health',
        phone: '+91 98450 11003',
        department: 'ICU',
        designation: 'Senior ICU Nurse',
        role: 'Head Nurse',
        employeeId: 'EMP-NUR-001',
        medicalRegistrationNo: 'INC-44119'
      },
      {
        name: 'Ramesh Patel',
        email: 'ramesh.patel@manipal.health',
        phone: '+91 98450 11004',
        department: 'Pharmacy',
        designation: 'Clinical Pharmacist',
        role: 'Pharmacist',
        employeeId: 'EMP-PHM-001'
      }
    ];

    const result = await DynamicHospitalConfigService.provisionStaffAccounts({
      hospitalId: TENANT_A_ID,
      staffList: staffRoster,
      provisionedByAdminId: HOSPITAL_DIRECTOR_ID
    });

    assert.ok(result.batchId.startsWith('STF-BATCH-'));
    assert.strictEqual(result.hospitalId, TENANT_A_ID);
    assert.strictEqual(result.totalProcessed, 4);
    assert.strictEqual(result.accountsCreated, 4);
    assert.strictEqual(result.manifest.length, 4);

    // Verify generated usernames and collision handling
    const [doc1, doc2, nurse, pharm] = result.manifest;
    assert.strictEqual(doc1.generatedUsername, 'dr.arun.varma');
    assert.strictEqual(doc2.generatedUsername, 'dr.arun.varma.1'); // Collision resolved gracefully!
    assert.strictEqual(nurse.generatedUsername, 'nurse.anita.reddy');
    assert.strictEqual(pharm.generatedUsername, 'pharm.ramesh.patel');

    // Verify NIST SP 800-63B temporary password compliance for all staff
    for (const item of result.manifest) {
      assert.ok(item.temporaryPassword.length >= 12, 'Password length must be >= 12');
      assert.match(item.temporaryPassword, /[A-Z]/, 'Must contain uppercase');
      assert.match(item.temporaryPassword, /[a-z]/, 'Must contain lowercase');
      assert.match(item.temporaryPassword, /[0-9]/, 'Must contain digit');
      assert.match(item.temporaryPassword, /[!@#$%^&*+=]/, 'Must contain symbol');
      assert.strictEqual(item.forcePasswordChange, true, 'Must force password change on first login');
      assert.strictEqual(item.loginUrl, '/login/staff');

      // Check expiry is ~72 hours in future
      const expiry = new Date(item.passwordExpiresAt).getTime();
      const now = Date.now();
      const diffHours = (expiry - now) / (1000 * 60 * 60);
      assert.ok(diffHours >= 71 && diffHours <= 73, 'Temporary password must expire in 72 hours');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: Tenant Isolation & Zero Cross-Tenant Credential Bleed
  // --------------------------------------------------------------------------
  await t.test('5. Multi-Tenant Scoping: Manifest queries are strictly isolated to requesting hospital', async () => {
    // Provision a staff member for Tenant B (Apollo Hospital)
    await DynamicHospitalConfigService.provisionStaffAccounts({
      hospitalId: TENANT_B_ID,
      staffList: [
        {
          name: 'Dr. Balaram Naidu',
          email: 'balaram.naidu@apollo.health',
          department: 'Nephrology',
          role: 'Doctor / Consultant',
          employeeId: 'APOLLO-001'
        }
      ]
    });

    // Query Tenant A manifest
    const manifestA = await DynamicHospitalConfigService.getStaffManifest(TENANT_A_ID);
    assert.strictEqual(manifestA.length, 4);
    assert.ok(manifestA.every(m => !m.staffName.includes('Balaram')));

    // Query Tenant B manifest
    const manifestB = await DynamicHospitalConfigService.getStaffManifest(TENANT_B_ID);
    assert.strictEqual(manifestB.length, 1);
    assert.strictEqual(manifestB[0].staffName, 'Dr. Balaram Naidu');
    assert.strictEqual(manifestB[0].generatedUsername, 'dr.balaram.naidu');
  });
});
