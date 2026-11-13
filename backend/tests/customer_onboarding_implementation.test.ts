import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { OnboardingService, MANDATORY_GO_LIVE_ITEMS } from '../src/modules/onboarding/onboarding.service';
import { LicenseService } from '../src/modules/licensing/license.service';

// ============================================================================
// ASRTAVA TEST SUITE: CUSTOMER ONBOARDING, HOSPITAL IMPLEMENTATION,
// DATA MIGRATION, TRAINING & GO-LIVE MANAGEMENT
// ============================================================================

test('ASRTAVA Customer Onboarding & Hospital Implementation Suite', async (t) => {
  OnboardingService.clearState();
  LicenseService.clearState();

  let customerOrgId = '';
  let implementationId = '';
  const HOSPITAL_ID = 'hosp-max-delhi-01';
  const ADMIN_USER_ID = 'usr-admin-hosp-001';
  const ASRTAVA_LEAD_USER_ID = 'usr-lead-asrtava-999';

  // --------------------------------------------------------------------------
  // TEST 1: Customer Organization Registration
  // --------------------------------------------------------------------------
  await t.test('1. Customer Organization Registration: Registers entity with multi-contact profiles & commercial SLA', async () => {
    const org = await OnboardingService.registerCustomer({
      legalName: 'Max Healthcare Institute Limited',
      displayName: 'Max Healthcare Group Ltd',
      registrationNumber: 'GSTIN07AABCM5678Q1Z2',
      category: 'tertiary_teaching',
      authorizedBranchesCount: 3,
      authorizedContactName: 'Dr. Vikram Mehra',
      authorizedContactEmail: 'vikram.mehra@maxhealth.in',
      authorizedContactPhone: '+91 98110 12345',
      technicalContactName: 'Rajesh Sharma (CTO)',
      technicalContactEmail: 'rajesh.sharma@maxhealth.in',
      commercialContactName: 'Anil Singhal (CFO)',
      commercialContactEmail: 'anil.singhal@maxhealth.in',
      addressLine1: '1, Press Enclave Road, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
      implementationPriority: 'high',
      targetGoLiveDate: '2026-12-15',
    });

    assert.ok(org.id);
    assert.strictEqual(org.legal_name, 'Max Healthcare Institute Limited');
    assert.strictEqual(org.display_name, 'Max Healthcare Group Ltd');
    assert.strictEqual(org.authorized_branches_count, 3);
    assert.strictEqual(org.status, 'onboarding_initiated');
    assert.strictEqual(org.implementation_priority, 'high');
    customerOrgId = org.id;
  });

  // --------------------------------------------------------------------------
  // TEST 2: Implementation Project Creation & 18-Stage Lifecycle Transitions
  // --------------------------------------------------------------------------
  await t.test('2. Implementation Project Creation & Lifecycle Transitions: Enforces valid state machine', async () => {
    const impl = await OnboardingService.createImplementationProject({
      customerId: customerOrgId,
      hospitalId: HOSPITAL_ID,
      deploymentModel: 'hybrid',
      targetGoLiveDate: '2026-12-15',
      actorId: ASRTAVA_LEAD_USER_ID,
      actorName: 'Pooja Iyer (ASRTAVA Lead)',
    });

    assert.ok(impl.id);
    assert.strictEqual(impl.current_stage, 'requirements_gathering');
    assert.strictEqual(impl.deployment_model, 'hybrid');
    assert.strictEqual(impl.customer_id, customerOrgId);
    implementationId = impl.id;

    // Advance through subsequent stages
    const step1 = await OnboardingService.transitionStage({
      implementationId,
      targetStage: 'infrastructure_assessment',
      actorId: ASRTAVA_LEAD_USER_ID,
      notes: 'Requirements workshops completed, assessing server sizing',
    });
    assert.strictEqual(step1.current_stage, 'infrastructure_assessment');

    const step2 = await OnboardingService.transitionStage({
      implementationId,
      targetStage: 'environment_preparation',
      actorId: ASRTAVA_LEAD_USER_ID,
      notes: 'Infrastructure vetted, setting up Docker and local DB cluster',
    });
    assert.strictEqual(step2.current_stage, 'environment_preparation');

    // Attempting invalid transition directly to production_go_live should fail because mandatory gates are unverified
    await assert.rejects(
      async () => {
        await OnboardingService.transitionStage({
          implementationId,
          targetStage: 'production_go_live',
          actorId: ASRTAVA_LEAD_USER_ID,
        });
      },
      /Cannot transition to Production Go-Live/
    );
  });

  // --------------------------------------------------------------------------
  // TEST 3: Deployment Model Assessment
  // --------------------------------------------------------------------------
  await t.test('3. Deployment Model Assessment: Evaluates Hybrid architecture requirements & auto-verifies env gate', async () => {
    const assessed = OnboardingService.recordDeploymentAssessment({
      implementationId,
      assessmentData: {
        cpuCores: 64,
        ramGb: 256,
        storageGb: 10240,
        osVersion: 'Ubuntu 24.04 LTS (Air-Gapped Local Cluster)',
        localNetworkReady: true,
        backupDriveMounted: true,
        firewallConfigured: true,
        internetIndependenceVerified: true,
      },
      actorId: ASRTAVA_LEAD_USER_ID,
    });

    assert.strictEqual(assessed.id, implementationId);
    assert.strictEqual(assessed.deployment_assessment_data.cpuCores, 64);
    assert.strictEqual(assessed.deployment_assessment_data.localNetworkReady, true);

    // Verify readiness report shows DEPLOYMENT_ENV_OPERATIONAL marked as verified
    const readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    const envGate = readiness.checklist.find((c) => c.check_item_code === 'DEPLOYMENT_ENV_OPERATIONAL');
    assert.ok(envGate);
    assert.strictEqual(envGate?.is_verified, true);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Hospital Requirements Gathering Catalog & Approval
  // --------------------------------------------------------------------------
  await t.test('4. Hospital Requirements Gathering: Logs and approves cataloged requirements', async () => {
    const req1 = OnboardingService.addRequirement({
      implementationId,
      category: 'clinical',
      title: 'Pediatric Emergency 4-Tier Triage Protocol',
      description: 'Support AIIMS pediatric emergency triage severity classification with 1-click resuscitation bypass.',
      priority: 'must_have',
      ownerName: 'Dr. Vikram Mehra',
    });
    assert.ok(req1.id);
    assert.strictEqual(req1.status, 'pending');

    const req2 = OnboardingService.addRequirement({
      implementationId,
      category: 'billing',
      title: 'CGHS/ECHS Co-Payment Auto-Splitting',
      description: 'Auto-split CGHS package tariffs with co-pay deduction and claim batch generation.',
      priority: 'must_have',
      ownerName: 'Anil Singhal',
    });
    assert.ok(req2.id);

    // Approve requirements
    const approvedReq1 = OnboardingService.updateRequirementStatus(req1.id, 'approved', ASRTAVA_LEAD_USER_ID);
    assert.strictEqual(approvedReq1.status, 'approved');
    assert.strictEqual(approvedReq1.approved_by, ASRTAVA_LEAD_USER_ID);

    const approvedReq2 = OnboardingService.updateRequirementStatus(req2.id, 'approved', ASRTAVA_LEAD_USER_ID);
    assert.strictEqual(approvedReq2.status, 'approved');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Data Migration Dry-Run & Duplicate Detection
  // --------------------------------------------------------------------------
  let migrationJobId = '';
  await t.test('5. Data Migration Dry-Run: Validates legacy records, mappings & duplicate detection', async () => {
    // Advance stages
    await OnboardingService.transitionStage({ implementationId, targetStage: 'installation_in_progress', actorId: ASRTAVA_LEAD_USER_ID });
    await OnboardingService.transitionStage({ implementationId, targetStage: 'configuration_in_progress', actorId: ASRTAVA_LEAD_USER_ID });
    await OnboardingService.transitionStage({ implementationId, targetStage: 'data_migration', actorId: ASRTAVA_LEAD_USER_ID });

    // Create legacy patient records (with an exact duplicate and an invalid missing name row)
    const rawLegacyData = [
      { legacy_id: 'LEG-001', pt_name: 'Amitabh Bachchan', pt_dob: '1975-10-11', pt_gender: 'M', pt_phone: '9876543210' },
      { legacy_id: 'LEG-002', pt_name: 'Kareena Kapoor', pt_dob: '1980-09-21', pt_gender: 'F', pt_phone: '9876543211' },
      { legacy_id: 'LEG-003', pt_name: 'Amitabh Bachchan', pt_dob: '1975-10-11', pt_gender: 'M', pt_phone: '9876543210' }, // Duplicate
      { legacy_id: 'LEG-004', pt_name: '', pt_dob: 'invalid-date', pt_gender: 'X', pt_phone: '123' }, // Invalid (no name)
    ];

    const migrationJob = OnboardingService.createMigrationJob({
      implementationId,
      hospitalId: HOSPITAL_ID,
      category: 'patients',
      sourceFormat: 'json',
      fieldMappings: {
        'pt_name': 'fullName',
        'pt_dob': 'dob',
        'pt_gender': 'gender',
        'pt_phone': 'phone',
      },
    });

    assert.ok(migrationJob.id);
    assert.strictEqual(migrationJob.status, 'uploaded');
    migrationJobId = migrationJob.id;

    // Execute dry-run validation
    const dryRunResult = OnboardingService.executeDryRunValidation(migrationJobId, rawLegacyData);
    assert.strictEqual(dryRunResult.status, 'preview_ready');
    assert.strictEqual(dryRunResult.total_records, 4);
    assert.strictEqual(dryRunResult.valid_records, 2);
    assert.strictEqual(dryRunResult.duplicate_records, 1);
    assert.strictEqual(dryRunResult.failed_records, 1);
    assert.strictEqual(dryRunResult.dry_run_preview.length, 2);
    assert.strictEqual(dryRunResult.validation_errors.length, 2);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Data Migration Execution & Reconciliation Report
  // --------------------------------------------------------------------------
  await t.test('6. Data Migration Human Sign-Off & Production Execution: Reconciles counts cleanly', async () => {
    // Attempting execution before sign-off must fail
    assert.throws(
      () => {
        OnboardingService.executeProductionMigration(migrationJobId, ADMIN_USER_ID);
      },
      /is not approved for execution/
    );

    // Sign off preview
    const approvedJob = OnboardingService.approveMigrationJob(migrationJobId, ADMIN_USER_ID);
    assert.strictEqual(approvedJob.status, 'approved_for_execution');
    assert.strictEqual(approvedJob.approved_by, ADMIN_USER_ID);

    // Execute production migration
    const execResult = OnboardingService.executeProductionMigration(migrationJobId, ADMIN_USER_ID);
    assert.strictEqual(execResult.status, 'completed');
    assert.strictEqual(execResult.migrated_records, 2);
    assert.ok(execResult.reconciliation_report);
    assert.strictEqual(execResult.reconciliation_report.successfullyMigrated, 2);
    assert.strictEqual(execResult.reconciliation_report.duplicatesExcluded, 1);
    assert.strictEqual(execResult.reconciliation_report.dataIntegrityVerified, true);

    // Migration gate in checklist should be auto-verified
    const readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    const migGate = readiness.checklist.find((c) => c.check_item_code === 'DATA_MIGRATION_RECONCILED');
    assert.strictEqual(migGate?.is_verified, true);
  });

  // --------------------------------------------------------------------------
  // TEST 7: Staff Bulk Onboarding & Role Assignment
  // --------------------------------------------------------------------------
  await t.test('7. Staff Bulk Onboarding: Securely provisions clinical, nursing, and administrative accounts', async () => {
    const staffList = [
      { name: 'Dr. Ananya Roy', email: 'ananya.roy@maxhealth.in', phone: '+91 98111 22334', department: 'Cardiology', role: 'doctor', employeeId: 'EMP-DOC-001' },
      { name: 'Sister Mary Joseph', email: 'mary.joseph@maxhealth.in', phone: '+91 98222 33445', department: 'ICU', role: 'nurse', employeeId: 'EMP-NUR-002' },
      { name: 'Sanjay Kapoor', email: 'sanjay.kapoor@maxhealth.in', phone: '+91 98333 44556', department: 'Central Pharmacy', role: 'pharmacist', employeeId: 'EMP-PHARM-003' },
      { name: 'Sunita Rao', email: 'sunita.rao@maxhealth.in', phone: '+91 98444 55667', department: 'Front Office', role: 'receptionist', employeeId: 'EMP-REC-004' },
    ];

    const bulkResult = OnboardingService.bulkOnboardStaff({
      implementationId,
      hospitalId: HOSPITAL_ID,
      staffList,
      actorId: ADMIN_USER_ID,
    });

    assert.strictEqual(bulkResult.totalImported, 4);
    assert.strictEqual(bulkResult.accountsCreated, 4);

    // Verify STAFF_ACCOUNTS_ACTIVATED gate in checklist
    const readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    const staffGate = readiness.checklist.find((c) => c.check_item_code === 'STAFF_ACCOUNTS_ACTIVATED');
    assert.strictEqual(staffGate?.is_verified, true);
  });

  // --------------------------------------------------------------------------
  // TEST 8: Role-Specific Training Management & Assessment Certification
  // --------------------------------------------------------------------------
  let trainingProgramId = '';
  await t.test('8. Role-Specific Training Management: Tracks attendance & certifies with >= 80% passing grade', async () => {
    await OnboardingService.transitionStage({ implementationId, targetStage: 'user_training', actorId: ASRTAVA_LEAD_USER_ID });

    const program = OnboardingService.createTrainingProgram({
      implementationId,
      hospitalId: HOSPITAL_ID,
      roleTarget: 'doctor',
      title: 'Doctor Consultation, SOAP Notes, e-Prescription & CPOE',
      trainerName: 'Dr. Alok Verma (ASRTAVA Clinical Specialist)',
      totalModules: 5,
    });

    assert.ok(program.id);
    assert.strictEqual(program.role_target, 'doctor');
    trainingProgramId = program.id;

    // Dr. Ananya Roy achieves 92% -> certified
    const cert1 = OnboardingService.recordTrainingAttendance({
      programId: trainingProgramId,
      userId: 'EMP-DOC-001',
      sessionsAttended: 5,
      assessmentScore: 92,
      trainerNotes: 'Comprehensive mastery of clinical EMR workflow',
    });
    assert.strictEqual(cert1.is_certified, true);
    assert.strictEqual(cert1.assessment_score, 92);

    // Dr. Sen achieves 65% -> failed
    const cert2 = OnboardingService.recordTrainingAttendance({
      programId: trainingProgramId,
      userId: 'EMP-DOC-002',
      sessionsAttended: 3,
      assessmentScore: 65,
      trainerNotes: 'Needs refresher on narcotics formulary dispensing',
    });
    assert.strictEqual(cert2.is_certified, false);

    // MANDATORY_TRAINING_CERTIFIED gate is verified
    const readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    const trnGate = readiness.checklist.find((c) => c.check_item_code === 'MANDATORY_TRAINING_CERTIFIED');
    assert.strictEqual(trnGate?.is_verified, true);
  });

  // --------------------------------------------------------------------------
  // TEST 9: UAT Test Case Execution & Defect Gate Verification
  // --------------------------------------------------------------------------
  let uatTestCaseId = '';
  await t.test('9. UAT Management & Defect Gate: Critical defects block readiness', async () => {
    await OnboardingService.transitionStage({ implementationId, targetStage: 'uat', actorId: ASRTAVA_LEAD_USER_ID });

    const tc1 = OnboardingService.createUatTestCase({
      implementationId,
      module: 'billing',
      testScenario: 'OPD Consultation Bill Generation with CGHS Split',
      expectedOutcome: 'System creates two line allocations and marks claim pending.',
      severity: 'critical',
    });
    assert.ok(tc1.id);
    uatTestCaseId = tc1.id;

    // Execute with failure (critical defect)
    const failedTc = OnboardingService.recordUatResult({
      implementationId,
      testCaseId: uatTestCaseId,
      status: 'failed',
      actualOutcome: 'CGHS tax calculation omitted GST for non-exempt services.',
      executedBy: 'Anil Singhal (CFO)',
      defectReference: 'DEFECT-CRIT-001',
    });
    assert.strictEqual(failedTc.status, 'failed');

    // Report indicates open critical defect
    let readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    assert.strictEqual(readiness.openCriticalUatDefects, 1);
    assert.strictEqual(readiness.isReadyForGoLive, false);

    // Fix defect and re-execute test case
    const passedTc = OnboardingService.recordUatResult({
      implementationId,
      testCaseId: uatTestCaseId,
      status: 'passed',
      actualOutcome: 'GST calculation patched and verified against CGHS schedule.',
      executedBy: 'Anil Singhal (CFO)',
    });
    assert.strictEqual(passedTc.status, 'passed');

    // UAT gate is now verified
    readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    assert.strictEqual(readiness.openCriticalUatDefects, 0);
    const uatGate = readiness.checklist.find((c) => c.check_item_code === 'UAT_SIGN_OFF');
    assert.strictEqual(uatGate?.is_verified, true);
  });

  // --------------------------------------------------------------------------
  // TEST 10: Go-Live Readiness Checklist Verification
  // --------------------------------------------------------------------------
  await t.test('10. Go-Live Readiness Evaluation: Evaluates all 14 mandatory gates', async () => {
    await OnboardingService.transitionStage({ implementationId, targetStage: 'go_live_readiness', actorId: ASRTAVA_LEAD_USER_ID });

    let readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    assert.strictEqual(readiness.totalChecklistCount, 14);

    // Verify remaining unverified checklist gates
    const remainingCodes = [
      'LICENSE_VERIFIED',
      'SECURITY_AUDIT_CLEARED',
      'BACKUP_RESTORATION_VERIFIED',
      'HOSPITAL_CONFIG_COMPLETED',
      'INTEGRATIONS_VERIFIED',
      'COMMUNICATION_PLAN_APPROVED',
      'SUPPORT_TEAM_ASSIGNED',
    ];

    for (const code of remainingCodes) {
      OnboardingService.verifyChecklistItem(implementationId, code, ASRTAVA_LEAD_USER_ID, 'Verified during pre-flight check');
    }

    readiness = OnboardingService.getGoLiveReadinessReport(implementationId);
    // Hospital Admin & ASRTAVA Lead approval gates are verified during dual sign-off execution
    assert.strictEqual(readiness.unverifiedMandatoryCount, 2);
  });

  // --------------------------------------------------------------------------
  // TEST 11: Production Go-Live Dual Sign-Off Execution
  // --------------------------------------------------------------------------
  await t.test('11. Controlled Production Go-Live: Enforces mandatory dual sign-off (Hospital Admin + ASRTAVA Lead)', async () => {
    // Missing ASRTAVA lead sign-off must fail
    await assert.rejects(
      async () => {
        await OnboardingService.executeProductionGoLive({
          implementationId,
          hospitalAdminUserId: ADMIN_USER_ID,
          asrtavaLeadUserId: '',
        });
      },
      /Both Hospital Admin and ASRTAVA Implementation Lead signatures are mandatory/
    );

    // Missing Hospital Admin sign-off must fail
    await assert.rejects(
      async () => {
        await OnboardingService.executeProductionGoLive({
          implementationId,
          hospitalAdminUserId: '',
          asrtavaLeadUserId: ASRTAVA_LEAD_USER_ID,
        });
      },
      /Both Hospital Admin and ASRTAVA Implementation Lead signatures are mandatory/
    );

    // Dual sign-off succeeds
    const goLiveResult = await OnboardingService.executeProductionGoLive({
      implementationId,
      hospitalAdminUserId: ADMIN_USER_ID,
      asrtavaLeadUserId: ASRTAVA_LEAD_USER_ID,
      notes: 'Executed go-live with complete 14-gate verification.',
    });

    assert.strictEqual(goLiveResult.success, true);
    assert.strictEqual(goLiveResult.implementation.current_stage, 'production_go_live');
    assert.strictEqual(goLiveResult.implementation.hospital_admin_signoff_by, ADMIN_USER_ID);
    assert.strictEqual(goLiveResult.implementation.asrtava_lead_signoff_by, ASRTAVA_LEAD_USER_ID);
    assert.ok(goLiveResult.implementation.hypercare_ends_at);
  });

  // --------------------------------------------------------------------------
  // TEST 12: 30-Day Hypercare Support & Handover
  // --------------------------------------------------------------------------
  let hypercareTicketId = '';
  await t.test('12. Hypercare Support & Handover: Manages high-priority tickets and formal handover', async () => {
    await OnboardingService.transitionStage({ implementationId, targetStage: 'hypercare_initial_support', actorId: ASRTAVA_LEAD_USER_ID });

    // Create hypercare ticket
    const ticket = OnboardingService.createHypercareTicket({
      implementationId,
      hospitalId: HOSPITAL_ID,
      subject: 'Barcode scanner intermittent lag in central OPD pharmacy',
      department: 'Pharmacy',
      severity: 'medium',
      reportedBy: 'Sanjay Kapoor (Pharmacist)',
    });

    assert.ok(ticket.id);
    assert.strictEqual(ticket.status, 'open');
    assert.strictEqual(ticket.severity, 'medium');
    hypercareTicketId = ticket.id;

    // Resolve ticket
    const resolvedTicket = OnboardingService.resolveHypercareTicket(
      hypercareTicketId,
      'Updated USB COM driver and increased baud rate in workstation settings.'
    );
    assert.strictEqual(resolvedTicket.status, 'resolved');
    assert.ok(resolvedTicket.resolved_at);

    // Handover to standard support
    const completedImpl = await OnboardingService.handoverToStandardSupport(implementationId, ASRTAVA_LEAD_USER_ID);
    assert.strictEqual(completedImpl.current_stage, 'implementation_completed');
  });

  // --------------------------------------------------------------------------
  // TEST 13: Super Admin Implementation Telemetry & Hospital Admin Progress
  // --------------------------------------------------------------------------
  await t.test('13. Observability & Telemetry: Aggregates enterprise onboarding KPIs and hospital dashboard', async () => {
    // Super Admin telemetry
    const superAdminDashboard = OnboardingService.getSuperAdminImplementationDashboard();
    assert.strictEqual(superAdminDashboard.totalCustomers, 1);
    assert.strictEqual(superAdminDashboard.completedCount, 1);
    assert.strictEqual(superAdminDashboard.stageDistribution['implementation_completed'], 1);
    assert.strictEqual(superAdminDashboard.blockedProjectsCount, 0);

    // Hospital Admin onboarding progress view
    const hospitalProgress = OnboardingService.getHospitalOnboardingProgress(HOSPITAL_ID);
    assert.ok(hospitalProgress.implementation);
    assert.strictEqual(hospitalProgress.implementation?.hospital_id, HOSPITAL_ID);
    assert.strictEqual(hospitalProgress.checklist.length, 14);
    assert.strictEqual(hospitalProgress.migrationJobs.length, 1);
    assert.strictEqual(hospitalProgress.readinessReport.isReadyForGoLive, true);
  });

  // --------------------------------------------------------------------------
  // TEST 14: Onboarding Resumption & Identity Verification Gate
  // --------------------------------------------------------------------------
  await t.test('14. Security Invariant: Project code alone NEVER grants access without verified identity and project membership', async () => {
    // 1. Standalone project code without email must be strictly rejected
    await assert.rejects(
      async () => {
        await OnboardingService.authenticateOnboardingLead({
          email: '',
          projectCode: 'IMP-2026-HOSP-MAX'
        });
      },
      /Identity verification required/
    );

    // 2. Invalid project code with valid email must be rejected
    await assert.rejects(
      async () => {
        await OnboardingService.authenticateOnboardingLead({
          email: 'vikram.mehra@maxhealth.in',
          projectCode: 'NON-EXISTENT-PROJECT-CODE'
        });
      },
      /Invalid project resumption code/
    );

    // 3. Unauthorized email (outside customer organization) must be rejected
    await assert.rejects(
      async () => {
        await OnboardingService.authenticateOnboardingLead({
          email: 'attacker@stranger.org',
          projectCode: 'IMP-2026-HOSP-MAX'
        });
      },
      /Access Denied/
    );

    // 4. Authorized coordinator email with valid project code must succeed
    const validAuth = await OnboardingService.authenticateOnboardingLead({
      email: 'vikram.mehra@maxhealth.in',
      projectCode: 'IMP-2026-HOSP-MAX'
    });
    assert.ok(validAuth.project);
    assert.strictEqual(validAuth.user.email, 'vikram.mehra@maxhealth.in');
    assert.strictEqual(validAuth.role, 'Hospital Implementation Coordinator');
  });
});
