import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { GroupManagementService } from '../src/modules/group/group.service';
import { LicenseService } from '../src/modules/licensing/license.service';

// ============================================================================
// ASRTAVA TEST SUITE: ENTERPRISE MULTI-HOSPITAL GROUP & BRANCH MANAGEMENT
// Hierarchical DAG, Scoped RBAC, EMPI Patient Identity, Anti-Collision Scheduling,
// Inter-Branch Clinical Transfers, Financial Consolidation & Stock Movements
// ============================================================================

test('ASRTAVA Enterprise Multi-Hospital Group & Branch Management Suite', async (t) => {
  GroupManagementService.clearState();
  LicenseService.clearState();

  let orgId = '';
  let rootNodeId = '';
  let northRegionNodeId = '';
  let southRegionNodeId = '';
  let hospitalDelhiNodeId = '';
  let hospitalBlrNodeId = '';
  let branchSaketNodeId = '';
  let clinicWhitefieldNodeId = '';

  const HOSP_DELHI = 'hosp-delhi-saket';
  const HOSP_BLR = 'hosp-blr-indira';
  const HOSP_HYD = 'hosp-hyd-banjara';
  const BRANCH_SAKET_OPD = 'brn-saket-opd-01';
  const BRANCH_BLR_WHITEFIELD = 'brn-blr-wf-02';

  const USER_GROUP_ADMIN = 'usr-grp-admin-001';
  const USER_HOSP_ADMIN_DELHI = 'usr-hosp-admin-delhi-002';
  const USER_BRANCH_ADMIN_SAKET = 'usr-brn-admin-saket-003';
  const USER_DOCTOR_ROY = 'usr-doc-roy-004';

  // --------------------------------------------------------------------------
  // TEST 1: Enterprise Organization Creation
  // --------------------------------------------------------------------------
  await t.test('1. Organization Creation: Creates multi-facility holding organization', async () => {
    const org = await GroupManagementService.createOrganization({
      legalName: 'Apex Healthcare Holdings Global Ltd',
      displayName: 'Apex Healthcare Network',
      taxIdentificationNumber: 'GSTIN07AAACG9988P1Z5',
      hqAddress: 'Apex Towers, Sector 44',
      hqCity: 'Gurugram',
      hqState: 'Haryana',
      hqCountry: 'India',
      hqPincode: '122003',
      contactEmail: 'central.admin@apexhealth.com',
      contactPhone: '+91 124 456 7890',
      tier: 'enterprise_chain',
    });

    assert.ok(org.id);
    assert.strictEqual(org.legal_name, 'Apex Healthcare Holdings Global Ltd');
    assert.strictEqual(org.tier, 'enterprise_chain');
    assert.strictEqual(org.status, 'active');
    orgId = org.id;

    // Root node auto-created
    const tree = GroupManagementService.getHierarchyTree(orgId);
    assert.strictEqual(tree.length, 1);
    assert.strictEqual(tree[0].node_type, 'organization');
    rootNodeId = tree[0].id;
  });

  // --------------------------------------------------------------------------
  // TEST 2: Multi-Level Organizational Hierarchy Creation
  // --------------------------------------------------------------------------
  await t.test('2. Organizational Hierarchy: Configures Region -> Hospital -> Branch -> Clinic hierarchy', async () => {
    // A. Northern & Southern Regional Divisions
    const northRegion = await GroupManagementService.createHierarchyNode({
      organizationId: orgId,
      parentNodeId: rootNodeId,
      name: 'Northern Regional Directorate',
      nodeType: 'region',
      city: 'New Delhi',
      state: 'Delhi',
      sortOrder: 1,
    });
    northRegionNodeId = northRegion.id;

    const southRegion = await GroupManagementService.createHierarchyNode({
      organizationId: orgId,
      parentNodeId: rootNodeId,
      name: 'Southern Regional Directorate',
      nodeType: 'region',
      city: 'Bengaluru',
      state: 'Karnataka',
      sortOrder: 2,
    });
    southRegionNodeId = southRegion.id;

    // B. Hospitals under Regions
    const hospDelhi = await GroupManagementService.createHierarchyNode({
      organizationId: orgId,
      parentNodeId: northRegionNodeId,
      name: 'Apex Super Speciality Hospital, Saket',
      nodeType: 'hospital',
      hospitalId: HOSP_DELHI,
      city: 'New Delhi',
      state: 'Delhi',
    });
    hospitalDelhiNodeId = hospDelhi.id;

    const hospBlr = await GroupManagementService.createHierarchyNode({
      organizationId: orgId,
      parentNodeId: southRegionNodeId,
      name: 'Apex Hospital, Indiranagar',
      nodeType: 'hospital',
      hospitalId: HOSP_BLR,
      city: 'Bengaluru',
      state: 'Karnataka',
    });
    hospitalBlrNodeId = hospBlr.id;

    // C. Branches & Clinics under Hospitals
    const branchSaket = await GroupManagementService.createHierarchyNode({
      organizationId: orgId,
      parentNodeId: hospitalDelhiNodeId,
      name: 'Apex Saket Outpatient Daycare Branch',
      nodeType: 'branch',
      hospitalId: HOSP_DELHI,
      branchId: BRANCH_SAKET_OPD,
    });
    branchSaketNodeId = branchSaket.id;

    const clinicWhitefield = await GroupManagementService.createHierarchyNode({
      organizationId: orgId,
      parentNodeId: hospitalBlrNodeId,
      name: 'Apex Whitefield Diagnostic & Consultation Clinic',
      nodeType: 'clinic',
      hospitalId: HOSP_BLR,
      branchId: BRANCH_BLR_WHITEFIELD,
    });
    clinicWhitefieldNodeId = clinicWhitefield.id;

    // Verify tree depth
    const tree = GroupManagementService.getHierarchyTree(orgId);
    assert.strictEqual(tree[0].children.length, 2); // 2 Regions
    assert.strictEqual(tree[0].children[0].children.length, 1); // Delhi under North
    assert.strictEqual(tree[0].children[0].children[0].children.length, 1); // Saket branch under Delhi
  });

  // --------------------------------------------------------------------------
  // TEST 3: Hierarchy DAG Loop & Cycle Prevention
  // --------------------------------------------------------------------------
  await t.test('3. DAG Cycle Prevention: Rejects circular ancestry and self-parenting', async () => {
    // Self-parenting rejection
    assert.throws(
      () => {
        GroupManagementService.moveHierarchyNode(northRegionNodeId, northRegionNodeId);
      },
      /cannot be assigned as its own parent/
    );

    // Circular ancestry: Moving Root under a leaf node (Branch Saket) must be rejected
    assert.throws(
      () => {
        GroupManagementService.moveHierarchyNode(rootNodeId, branchSaketNodeId);
      },
      /Circular reference detected/
    );
  });

  // --------------------------------------------------------------------------
  // TEST 4: Centralized Staff Workplace Assignments (Multi-Branch)
  // --------------------------------------------------------------------------
  await t.test('4. Multi-Workplace Staff Assignments: Assigns doctor across multiple facilities with primary designation', async () => {
    // Dr. Roy: Primary at Delhi Saket Hospital
    const primaryAsgn = GroupManagementService.assignStaffWorkplace({
      userId: USER_DOCTOR_ROY,
      organizationId: orgId,
      hospitalId: HOSP_DELHI,
      branchId: BRANCH_SAKET_OPD,
      assignmentType: 'primary',
      isPrimary: true,
      designation: 'Senior Consultant Cardiologist',
      roleKey: 'doctor',
    });
    assert.strictEqual(primaryAsgn.is_primary, true);
    assert.strictEqual(primaryAsgn.hospital_id, HOSP_DELHI);

    // Dr. Roy: Visiting Consultant at Bengaluru Whitefield Clinic
    const visitingAsgn = GroupManagementService.assignStaffWorkplace({
      userId: USER_DOCTOR_ROY,
      organizationId: orgId,
      hospitalId: HOSP_BLR,
      branchId: BRANCH_BLR_WHITEFIELD,
      assignmentType: 'visiting',
      isPrimary: false,
      designation: 'Visiting Interventional Specialist',
      roleKey: 'doctor',
    });
    assert.strictEqual(visitingAsgn.is_primary, false);
    assert.strictEqual(visitingAsgn.hospital_id, HOSP_BLR);

    // Verify user has 2 active workplaces
    const doctorWorkplaces = GroupManagementService.getStaffWorkplaces(USER_DOCTOR_ROY);
    assert.strictEqual(doctorWorkplaces.length, 2);
    const primary = doctorWorkplaces.find((w) => w.is_primary);
    assert.strictEqual(primary?.hospital_id, HOSP_DELHI);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Scoped RBAC & Negative Permission Precedence
  // --------------------------------------------------------------------------
  await t.test('5. Scoped Access Evaluation: Verifies Group Admin, Hospital Admin, Branch Admin and DENY overrides', async () => {
    // Group Admin workplace setup
    GroupManagementService.assignStaffWorkplace({
      userId: USER_GROUP_ADMIN,
      organizationId: orgId,
      hospitalId: HOSP_DELHI,
      assignmentType: 'primary',
      roleKey: 'group_admin',
    });

    // Delhi Hospital Admin workplace setup
    GroupManagementService.assignStaffWorkplace({
      userId: USER_HOSP_ADMIN_DELHI,
      organizationId: orgId,
      hospitalId: HOSP_DELHI,
      assignmentType: 'primary',
      roleKey: 'hospital_admin',
    });

    // Saket Branch Admin workplace setup
    GroupManagementService.assignStaffWorkplace({
      userId: USER_BRANCH_ADMIN_SAKET,
      organizationId: orgId,
      hospitalId: HOSP_DELHI,
      branchId: BRANCH_SAKET_OPD,
      assignmentType: 'primary',
      roleKey: 'branch_admin',
    });

    // A. Group Admin has access across all facilities
    const grpCheck = GroupManagementService.checkScopedAccess({
      userId: USER_GROUP_ADMIN,
      userRole: 'group_admin',
      targetHospitalId: HOSP_BLR,
    });
    assert.strictEqual(grpCheck.allowed, true);

    // B. Delhi Hospital Admin CAN access Delhi Saket
    const hospCheckDelhi = GroupManagementService.checkScopedAccess({
      userId: USER_HOSP_ADMIN_DELHI,
      userRole: 'hospital_admin',
      targetHospitalId: HOSP_DELHI,
    });
    assert.strictEqual(hospCheckDelhi.allowed, true);

    // C. Delhi Hospital Admin CANNOT access Bengaluru Hospital
    const hospCheckBlr = GroupManagementService.checkScopedAccess({
      userId: USER_HOSP_ADMIN_DELHI,
      userRole: 'hospital_admin',
      targetHospitalId: HOSP_BLR,
    });
    assert.strictEqual(hospCheckBlr.allowed, false);
    assert.ok(hospCheckBlr.reason.includes('cannot administer unrelated hospital'));

    // D. Saket Branch Admin CANNOT administer Whitefield Branch
    const branchCheck = GroupManagementService.checkScopedAccess({
      userId: USER_BRANCH_ADMIN_SAKET,
      userRole: 'branch_admin',
      targetHospitalId: HOSP_BLR,
      targetBranchId: BRANCH_BLR_WHITEFIELD,
    });
    assert.strictEqual(branchCheck.allowed, false);

    // E. Explicit Individual DENY overrides all permissions
    const denyCheck = GroupManagementService.checkScopedAccess({
      userId: USER_GROUP_ADMIN,
      userRole: 'group_admin',
      targetHospitalId: HOSP_DELHI,
      explicitDeny: true,
    });
    assert.strictEqual(denyCheck.allowed, false);
    assert.ok(denyCheck.reason.includes('DENY overrides all'));
  });

  // --------------------------------------------------------------------------
  // TEST 6: Enterprise Master Patient Index (EMPI) & Identity Matching
  // --------------------------------------------------------------------------
  let patientEmpiId = '';
  await t.test('6. EMPI Patient Matching: Matches patient across hospitals using Phone + Name & Aadhaar Hash', async () => {
    // 1. First visit at Delhi Hospital: Generates new Master Patient Index (EMPI)
    const delRegister = await GroupManagementService.registerOrMatchEnterprisePatient({
      organizationId: orgId,
      hospitalId: HOSP_DELHI,
      localPatientId: 'pt-del-101',
      localUhid: 'UHID-DEL-000101',
      firstName: 'Ramesh',
      lastName: 'Gupta',
      phone: '+91 98111 88888',
      nationalId: '1234-5678-9012',
      gender: 'male',
      dateOfBirth: '1982-04-15',
    });

    assert.ok(delRegister.enterprisePatient.enterprise_patient_id);
    assert.strictEqual(delRegister.isNewMasterIdentity, true);
    patientEmpiId = delRegister.enterprisePatient.id;

    // 2. Second visit at Bengaluru Hospital: Patient provides same Aadhaar/Phone
    const blrRegister = await GroupManagementService.registerOrMatchEnterprisePatient({
      organizationId: orgId,
      hospitalId: HOSP_BLR,
      localPatientId: 'pt-blr-502',
      localUhid: 'UHID-BLR-000502',
      firstName: 'Ramesh',
      lastName: 'Gupta',
      phone: '+91 98111 88888',
      nationalId: '1234-5678-9012',
    });

    // Must link to the SAME Master Patient Identity
    assert.strictEqual(blrRegister.isNewMasterIdentity, false);
    assert.strictEqual(blrRegister.enterprisePatient.id, patientEmpiId);
    assert.strictEqual(blrRegister.enterprisePatient.enterprise_patient_id, delRegister.enterprisePatient.enterprise_patient_id);

    // Verify links: Both Delhi and Bengaluru local records are linked to the master EMPI
    const links = GroupManagementService.getEnterprisePatientLinks(patientEmpiId);
    assert.strictEqual(links.length, 2);
    assert.ok(links.some((l) => l.hospital_id === HOSP_DELHI && l.local_uhid === 'UHID-DEL-000101'));
    assert.ok(links.some((l) => l.hospital_id === HOSP_BLR && l.local_uhid === 'UHID-BLR-000502'));
  });

  // --------------------------------------------------------------------------
  // TEST 7: Cross-Hospital Clinical Patient Transfers
  // --------------------------------------------------------------------------
  let transferId = '';
  await t.test('7. Cross-Hospital Patient Transfer: Manages inter-facility transfer lifecycle and audit notes', async () => {
    // Initiate emergency ICU step-up transfer from Bengaluru to Delhi Super Speciality
    const transfer = GroupManagementService.initiatePatientTransfer({
      organizationId: orgId,
      patientId: 'pt-blr-502',
      enterprisePatientId: patientEmpiId,
      fromHospitalId: HOSP_BLR,
      toHospitalId: HOSP_DELHI,
      transferType: 'emergency',
      reason: 'Acute cardiac infarction requiring emergent surgical revascularization.',
      clinicalSummary: 'ECG: ST elevation in anterior leads V1-V4. Trop-I elevated at 4.2 ng/mL. Heparin IV infusion active.',
      initiatedBy: USER_DOCTOR_ROY,
    });

    assert.ok(transfer.id);
    assert.strictEqual(transfer.status, 'initiated');
    assert.strictEqual(transfer.from_hospital_id, HOSP_BLR);
    assert.strictEqual(transfer.to_hospital_id, HOSP_DELHI);
    transferId = transfer.id;

    // Transfer accepted by receiving medical team
    const accepted = GroupManagementService.updateTransferStatus(
      transferId,
      'accepted',
      USER_HOSP_ADMIN_DELHI,
      'Cath lab team 2 and CCU Bed 14 pre-allocated on bypass protocol.'
    );
    assert.strictEqual(accepted.status, 'accepted');
    assert.strictEqual(accepted.accepted_by, USER_HOSP_ADMIN_DELHI);

    // Transfer dispatched in ACLS ambulance
    const dispatched = GroupManagementService.updateTransferStatus(transferId, 'dispatched', USER_DOCTOR_ROY);
    assert.strictEqual(dispatched.status, 'dispatched');

    // Transfer received at Delhi emergency triage
    const received = GroupManagementService.updateTransferStatus(transferId, 'received', USER_HOSP_ADMIN_DELHI, 'Patient received. Vitals stable.');
    assert.strictEqual(received.status, 'received');
    assert.ok(received.arrival_timestamp);
  });

  // --------------------------------------------------------------------------
  // TEST 8: Multi-Branch Doctor Scheduling & Anti-Collision Engine
  // --------------------------------------------------------------------------
  await t.test('8. Doctor Schedule Anti-Collision: Prevents double-booking doctor across branches on overlapping hours', async () => {
    // Monday 09:00 - 13:00 at Delhi Saket Hospital
    const schedDelhi = GroupManagementService.createDoctorSchedule({
      doctorId: USER_DOCTOR_ROY,
      hospitalId: HOSP_DELHI,
      branchId: BRANCH_SAKET_OPD,
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '13:00',
      slotDurationMinutes: 15,
      roomNumber: 'OPD-Cardio-102',
    });
    assert.ok(schedDelhi.id);

    // Attempting overlapping schedule on Monday 11:00 - 15:00 at Bengaluru Hospital MUST FAIL
    assert.throws(
      () => {
        GroupManagementService.createDoctorSchedule({
          doctorId: USER_DOCTOR_ROY,
          hospitalId: HOSP_BLR,
          branchId: BRANCH_BLR_WHITEFIELD,
          dayOfWeek: 'monday',
          startTime: '11:00',
          endTime: '15:00',
          slotDurationMinutes: 20,
        });
      },
      /Schedule collision: Doctor already scheduled/
    );

    // Non-overlapping schedule on Monday 15:00 - 18:00 (or on Tuesday) SUCCEEDS
    const schedTuesday = GroupManagementService.createDoctorSchedule({
      doctorId: USER_DOCTOR_ROY,
      hospitalId: HOSP_BLR,
      branchId: BRANCH_BLR_WHITEFIELD,
      dayOfWeek: 'tuesday',
      startTime: '10:00',
      endTime: '14:00',
      slotDurationMinutes: 20,
      roomNumber: 'OPD-WF-04',
    });
    assert.ok(schedTuesday.id);

    const docSchedules = GroupManagementService.getDoctorSchedules(USER_DOCTOR_ROY);
    assert.strictEqual(docSchedules.length, 2);
  });

  // --------------------------------------------------------------------------
  // TEST 9: Inter-Branch Stock Transfers (Centralized Inventory)
  // --------------------------------------------------------------------------
  let stockTransferId = '';
  await t.test('9. Inter-Branch Stock Transfers: Manages medicine transfer dispatch and receiving', async () => {
    // Delhi Central Pharmacy sends 200 vials of Adrenaline to Bengaluru Hospital
    const stockTrf = GroupManagementService.createStockTransfer({
      organizationId: orgId,
      sourceHospitalId: HOSP_DELHI,
      destinationHospitalId: HOSP_BLR,
      destinationBranchId: BRANCH_BLR_WHITEFIELD,
      medicineId: 'med-adren-001',
      batchNumber: 'BAT-ADR-2026-X1',
      expiryDate: '2028-06-30',
      quantityTransferred: 200,
      notes: 'Emergency cold-chain transfer for trauma resupply',
    });

    assert.ok(stockTrf.id);
    assert.strictEqual(stockTrf.status, 'approved');
    assert.strictEqual(stockTrf.quantity_transferred, 200);
    stockTransferId = stockTrf.id;

    // Dispatch stock
    const dispatched = GroupManagementService.dispatchStockTransfer(stockTransferId, 'usr-pharm-delhi-01');
    assert.strictEqual(dispatched.status, 'dispatched');
    assert.ok(dispatched.dispatched_at);

    // Receive stock at Bengaluru
    const received = GroupManagementService.receiveStockTransfer(stockTransferId, 'usr-pharm-blr-02');
    assert.strictEqual(received.status, 'received');
    assert.ok(received.received_at);
  });

  // --------------------------------------------------------------------------
  // TEST 10: Centralized Finance & Inter-Branch Accounting
  // --------------------------------------------------------------------------
  let financialTxId = '';
  await t.test('10. Centralized Finance: Records inter-facility debits, settlements and consolidated reports', async () => {
    // Record inter-branch management fee / patient transfer reimbursement
    const tx = GroupManagementService.recordInterBranchFinancialTransaction({
      organizationId: orgId,
      debitedHospitalId: HOSP_BLR,
      creditedHospitalId: HOSP_DELHI,
      amount: 45000,
      category: 'patient_transfer_charge',
      referenceDocumentId: transferId,
      notes: 'Air ambulance and medical team inter-facility transfer reimbursement',
    });

    assert.ok(tx.id);
    assert.strictEqual(tx.status, 'pending_approval');
    assert.strictEqual(tx.amount, 45000);
    financialTxId = tx.id;

    // Settle transaction
    const settled = GroupManagementService.settleFinancialTransaction(financialTxId, 'usr-cfo-group-001');
    assert.strictEqual(settled.status, 'settled');
    assert.ok(settled.settled_at);

    // Group financial consolidation
    const consolidation = GroupManagementService.getGroupFinancialConsolidation(orgId);
    assert.ok(consolidation);
    assert.ok(consolidation.totalRevenue > 0);
    assert.strictEqual(consolidation.settledInterBranchTransactions, 1);
  });

  // --------------------------------------------------------------------------
  // TEST 11: Enterprise Licensing Integration & Branch Location Limits
  // --------------------------------------------------------------------------
  await t.test('11. Enterprise Licensing: Allocates branch licenses and tracks location expansion requests', async () => {
    // Register perpetual enterprise license
    const enterpriseLic = await LicenseService.issueLicense({
      hospitalId: HOSP_DELHI,
      edition: 'enterprise_multispecialty',
      licenseType: 'perpetual',
      deploymentModel: 'hybrid',
      authorizedLocations: 3,
      maxBeds: 1000,
    });

    // Allocate location 1 (Delhi Hospital)
    const alloc1 = GroupManagementService.allocateLicenseBranch({
      licenseId: enterpriseLic.id,
      organizationId: orgId,
      hospitalId: HOSP_DELHI,
      allocatedBeds: 500,
    });
    assert.ok(alloc1.allocation.id);
    assert.strictEqual(alloc1.warning, undefined);

    // Allocate location 2 (Bengaluru Hospital)
    const alloc2 = GroupManagementService.allocateLicenseBranch({
      licenseId: enterpriseLic.id,
      organizationId: orgId,
      hospitalId: HOSP_BLR,
      allocatedBeds: 300,
    });
    assert.ok(alloc2.allocation.id);

    // Allocate location 3 (Hyderabad Clinic)
    const alloc3 = GroupManagementService.allocateLicenseBranch({
      licenseId: enterpriseLic.id,
      organizationId: orgId,
      hospitalId: HOSP_HYD,
      allocatedBeds: 50,
    });
    assert.ok(alloc3.allocation.id);

    // Allocate location 4 (Exceeds 3 authorized locations): Generates expansion warning without disrupting clinical care
    const alloc4 = GroupManagementService.allocateLicenseBranch({
      licenseId: enterpriseLic.id,
      organizationId: orgId,
      hospitalId: 'hosp-chennai-04',
      allocatedBeds: 100,
    });
    assert.ok(alloc4.warning?.includes('limit reached'));

    // Request expansion for additional locations
    const expReq = GroupManagementService.requestLicenseExpansion({
      orgId,
      requestedLocations: 5,
      requestedBeds: 500,
      justification: 'Opening 2 new super-specialty hospitals in Chennai and Pune',
    });
    assert.strictEqual(expReq.status, 'pending_commercial_review');
  });

  // --------------------------------------------------------------------------
  // TEST 12: Central Group Admin Dashboard Telemetry
  // --------------------------------------------------------------------------
  await t.test('12. Central Dashboard Telemetry: Aggregates multi-hospital operations and branch performance', async () => {
    const telemetry = GroupManagementService.getGroupDashboardTelemetry(orgId);
    assert.strictEqual(telemetry.organizationId, orgId);
    assert.ok(telemetry.totalHospitals >= 2);
    assert.ok(telemetry.totalBranches >= 2);
    assert.ok(telemetry.totalActiveStaff >= 1);
    assert.ok(telemetry.consolidatedRevenueInr > 0);
    assert.strictEqual(telemetry.hospitalMetrics.length, 3);
    assert.strictEqual(telemetry.hospitalMetrics[0].hospitalId, 'hosp-delhi-saket');
  });
});
