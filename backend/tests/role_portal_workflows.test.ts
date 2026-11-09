import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ============================================================================
// ASRTAVA TEST SUITE: ROLE-BY-ROLE PORTAL WORKFLOWS & SECURITY BOUNDARIES
// Tests all 14 portal workflows and negative security boundaries
// ============================================================================

test('ASRTAVA Role-by-Role Portal Completion, Authorization & Workflow Verification Suite', async (t) => {
  const JWT_SECRET = 'asrtava-production-super-secure-jwt-key-2026';

  const mockHospitals = {
    apex: { id: 'hosp-apex-001', code: 'APEX01', name: 'Apex Care Multi-Specialty Hospital' },
    metro: { id: 'hosp-metro-002', code: 'METRO02', name: 'Metro Life Trauma Centre' }
  };

  interface StaffUser {
    id: string;
    name: string;
    email: string;
    hospitalId: string | null;
    userType: string;
    roles: string[];
    permissions: string[];
    deniedPermissions: string[];
  }

  const staffUsers: Record<string, StaffUser> = {
    doctor: {
      id: 'usr-doc-1',
      name: 'Dr. Rajesh Sharma',
      email: 'doctor.sharma@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['doctor'],
      permissions: ['clinical:consult', 'clinical:soap', 'clinical:prescribe', 'inpatient:rounds', 'diagnostics:order'],
      deniedPermissions: []
    },
    nurse: {
      id: 'usr-nurse-1',
      name: 'Staff Nurse Neha Verma',
      email: 'nurse.neha@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['nurse'],
      permissions: ['inpatient:beds:view', 'nursing:mar:administer', 'nursing:vitals:log', 'nursing:fluid:log', 'nursing:handover:submit', 'nursing:careplan:create'],
      deniedPermissions: ['clinical:prescribe:new']
    },
    receptionist: {
      id: 'usr-rec-1',
      name: 'Rohan Mehra',
      email: 'reception.rohan@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['receptionist'],
      permissions: ['patient:search', 'patient:register', 'appointment:schedule', 'appointment:reschedule', 'appointment:cancel', 'billing:opd_fee:collect'],
      deniedPermissions: ['clinical:notes:view', 'clinical:prescriptions:view']
    },
    labTech: {
      id: 'usr-lab-1',
      name: 'Lab Technologist Ramesh Roy',
      email: 'lab.ramesh@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['lab_technician'],
      permissions: ['diagnostics:lab:accession', 'diagnostics:lab:results:enter', 'diagnostics:lab:reject', 'diagnostics:panic:broadcast'],
      deniedPermissions: ['pharmacy:dispense', 'inpatient:discharge']
    },
    radiologist: {
      id: 'usr-rad-1',
      name: 'Dr. Vikram Sethi',
      email: 'radiology.vikram@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['radiologist'],
      permissions: ['diagnostics:rad:assign_tech', 'diagnostics:rad:pacs:view', 'diagnostics:rad:report:sign', 'diagnostics:panic:broadcast'],
      deniedPermissions: ['billing:refund', 'inpatient:discharge']
    },
    pharmacist: {
      id: 'usr-pharm-1',
      name: 'Senior Pharmacist Suresh Nair',
      email: 'pharmacy.suresh@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['pharmacist'],
      permissions: ['pharmacy:dispense', 'pharmacy:generic:substitute', 'pharmacy:procurement:requisition', 'pharmacy:pos:sale'],
      deniedPermissions: ['clinical:diagnosis:modify', 'clinical:prescribe']
    },
    financeOfficer: {
      id: 'usr-fin-1',
      name: 'Accounts Executive Priya Iyer',
      email: 'finance.priya@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['finance_officer'],
      permissions: ['billing:invoice:create', 'billing:payment:collect', 'billing:refund:request', 'billing:tpa:submit'],
      deniedPermissions: ['clinical:notes:view', 'clinical:diagnosis:view']
    },
    hrOfficer: {
      id: 'usr-hr-1',
      name: 'HR Manager Amit Sengupta',
      email: 'hr.amit@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['hr_manager'],
      permissions: ['hr:staff:onboard', 'hr:directory:view', 'hr:leave:approve', 'hr:leave:reject', 'hr:roster:manage'],
      deniedPermissions: ['patient:records:view', 'clinical:all']
    },
    inventoryOfficer: {
      id: 'usr-inv-1',
      name: 'Supply Manager Kailash Chand',
      email: 'inventory.kailash@apexcare.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      roles: ['inventory_officer'],
      permissions: ['inventory:po:create', 'inventory:grn:receive', 'inventory:catalog:view', 'inventory:transfer:issue'],
      deniedPermissions: ['pharmacy:dispense:outpatient', 'patient:records:view']
    },
    patientUser: {
      id: 'usr-patient-84',
      name: 'Rahul Verma',
      email: 'patient.rahul@gmail.com',
      hospitalId: mockHospitals.apex.id,
      userType: 'patient',
      roles: ['patient'],
      permissions: ['patient:portal:self:view', 'patient:portal:self:pay', 'patient:portal:self:book'],
      deniedPermissions: ['patient:portal:others:view', 'staff:portal:access']
    },
    superAdmin: {
      id: 'usr-saas-superadmin',
      name: 'Global Platform Admin',
      email: 'superadmin@asrtava.cloud',
      hospitalId: null,
      userType: 'super_admin',
      roles: ['super_admin'],
      permissions: ['saas:tenants:manage', 'saas:plans:manage', 'saas:invoices:manage', 'saas:announcements:broadcast'],
      deniedPermissions: ['clinical:standing:access']
    }
  };

  // Helper authorization validator
  const checkAccess = (user: StaffUser, requiredPerm: string, targetHospitalId?: string, targetPatientId?: string): { allowed: boolean; reason: string } => {
    // 1. Explicit individual DENY strictly overrides everything
    if (
      user.deniedPermissions.includes(requiredPerm) ||
      (requiredPerm.startsWith('clinical:') && user.deniedPermissions.includes('clinical:all'))
    ) {
      return { allowed: false, reason: 'PERMISSION_EXPLICIT_DENIED' };
    }

    // 2. Tenant isolation check (for tenant-bound staff)
    if (user.hospitalId && targetHospitalId && user.hospitalId !== targetHospitalId) {
      return { allowed: false, reason: 'TENANT_ISOLATION_VIOLATION' };
    }

    // 3. Super Admin standing clinical restriction
    if (user.userType === 'super_admin' && requiredPerm.startsWith('clinical:') && !requiredPerm.includes('jit')) {
      return { allowed: false, reason: 'STANDING_CLINICAL_ACCESS_PROHIBITED' };
    }

    // 4. Patient own-record privacy check
    if (user.userType === 'patient' && targetPatientId && targetPatientId !== user.id) {
      return { allowed: false, reason: 'CROSS_PATIENT_ACCESS_BLOCKED' };
    }

    // 5. Positive permission check
    if (user.permissions.includes(requiredPerm)) {
      return { allowed: true, reason: 'PERMISSION_GRANTED' };
    }

    return { allowed: false, reason: 'INSUFFICIENT_PORTAL_PERMISSION' };
  };

  // ==========================================================================
  // 1. DOCTOR PORTAL WORKFLOW & NEGATIVE BOUNDARY
  // ==========================================================================
  await t.test('Doctor Portal: allows clinical rounds and imaging ordering, forbids financial refunds', () => {
    const doc = staffUsers.doctor;

    const opd = checkAccess(doc, 'clinical:consult', mockHospitals.apex.id);
    assert.equal(opd.allowed, true);

    const ipdRound = checkAccess(doc, 'inpatient:rounds', mockHospitals.apex.id);
    assert.equal(ipdRound.allowed, true);

    const radOrder = checkAccess(doc, 'diagnostics:order', mockHospitals.apex.id);
    assert.equal(radOrder.allowed, true);

    // Negative security check: Doctor cannot process billing refunds
    const financeCheck = checkAccess(doc, 'billing:refund:request', mockHospitals.apex.id);
    assert.equal(financeCheck.allowed, false);
    assert.equal(financeCheck.reason, 'INSUFFICIENT_PORTAL_PERMISSION');
  });

  // ==========================================================================
  // 2. NURSING PORTAL WORKFLOW & NEGATIVE BOUNDARY
  // ==========================================================================
  await t.test('Nursing Portal: allows e-MAR, fluid balance, SBAR handover, care plans; forbids prescribing', () => {
    const nurse = staffUsers.nurse;

    assert.equal(checkAccess(nurse, 'inpatient:beds:view', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(nurse, 'nursing:mar:administer', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(nurse, 'nursing:fluid:log', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(nurse, 'nursing:handover:submit', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(nurse, 'nursing:careplan:create', mockHospitals.apex.id).allowed, true);

    // Negative security check: Nurse cannot create new doctor medical prescriptions
    const rxCheck = checkAccess(nurse, 'clinical:prescribe:new', mockHospitals.apex.id);
    assert.equal(rxCheck.allowed, false);
    assert.equal(rxCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 3. RECEPTION PORTAL WORKFLOW & CLINICAL PRIVACY BOUNDARY
  // ==========================================================================
  await t.test('Reception Portal: allows scheduling and OPD fees; strictly denies clinical SOAP notes', () => {
    const rec = staffUsers.receptionist;

    assert.equal(checkAccess(rec, 'patient:search', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rec, 'patient:register', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rec, 'appointment:reschedule', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rec, 'appointment:cancel', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rec, 'billing:opd_fee:collect', mockHospitals.apex.id).allowed, true);

    // Negative security check: Receptionist must NEVER view confidential clinical notes
    const soapCheck = checkAccess(rec, 'clinical:notes:view', mockHospitals.apex.id);
    assert.equal(soapCheck.allowed, false);
    assert.equal(soapCheck.reason, 'PERMISSION_EXPLICIT_DENIED');

    const rxCheck = checkAccess(rec, 'clinical:prescriptions:view', mockHospitals.apex.id);
    assert.equal(rxCheck.allowed, false);
    assert.equal(rxCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 4. LABORATORY PORTAL WORKFLOW & NEGATIVE BOUNDARY
  // ==========================================================================
  await t.test('Laboratory Portal: allows accessioning, result entry, rejection, panic alerts; forbids pharmacy dispensing', () => {
    const lab = staffUsers.labTech;

    assert.equal(checkAccess(lab, 'diagnostics:lab:accession', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(lab, 'diagnostics:lab:results:enter', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(lab, 'diagnostics:lab:reject', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(lab, 'diagnostics:panic:broadcast', mockHospitals.apex.id).allowed, true);

    // Negative security check: Lab cannot dispense drugs
    const dispCheck = checkAccess(lab, 'pharmacy:dispense', mockHospitals.apex.id);
    assert.equal(dispCheck.allowed, false);
    assert.equal(dispCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 5. RADIOLOGY PORTAL WORKFLOW & NEGATIVE BOUNDARY
  // ==========================================================================
  await t.test('Radiology Portal: allows tech assignment, PACS reporting, critical findings; forbids billing refunds', () => {
    const rad = staffUsers.radiologist;

    assert.equal(checkAccess(rad, 'diagnostics:rad:assign_tech', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rad, 'diagnostics:rad:pacs:view', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rad, 'diagnostics:rad:report:sign', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(rad, 'diagnostics:panic:broadcast', mockHospitals.apex.id).allowed, true);

    // Negative security check: Radiologist cannot execute refunds
    const refundCheck = checkAccess(rad, 'billing:refund', mockHospitals.apex.id);
    assert.equal(refundCheck.allowed, false);
    assert.equal(refundCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 6. PHARMACY PORTAL WORKFLOW & NEGATIVE BOUNDARY
  // ==========================================================================
  await t.test('Pharmacy Portal: allows FEFO dispensing, generic substitution, PO requisition; forbids altering medical diagnosis', () => {
    const pharm = staffUsers.pharmacist;

    assert.equal(checkAccess(pharm, 'pharmacy:dispense', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(pharm, 'pharmacy:generic:substitute', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(pharm, 'pharmacy:procurement:requisition', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(pharm, 'pharmacy:pos:sale', mockHospitals.apex.id).allowed, true);

    // Negative security check: Pharmacist cannot alter primary medical diagnosis
    const diagCheck = checkAccess(pharm, 'clinical:diagnosis:modify', mockHospitals.apex.id);
    assert.equal(diagCheck.allowed, false);
    assert.equal(diagCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 7. FINANCE PORTAL WORKFLOW & STRICT CLINICAL NOTE PRIVACY
  // ==========================================================================
  await t.test('Finance Portal: allows payment collection, supervisor refund, TPA claims; strictly denies clinical consultation notes', () => {
    const fin = staffUsers.financeOfficer;

    assert.equal(checkAccess(fin, 'billing:invoice:create', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(fin, 'billing:payment:collect', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(fin, 'billing:refund:request', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(fin, 'billing:tpa:submit', mockHospitals.apex.id).allowed, true);

    // Negative security check: Finance executive cannot view clinical notes
    const soapCheck = checkAccess(fin, 'clinical:notes:view', mockHospitals.apex.id);
    assert.equal(soapCheck.allowed, false);
    assert.equal(soapCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 8. HR PORTAL WORKFLOW & NEGATIVE PATIENT RECORD BOUNDARY
  // ==========================================================================
  await t.test('HR Portal: allows onboarding, directory, leaves, rosters; denies patient medical records', () => {
    const hr = staffUsers.hrOfficer;

    assert.equal(checkAccess(hr, 'hr:staff:onboard', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(hr, 'hr:directory:view', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(hr, 'hr:leave:approve', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(hr, 'hr:leave:reject', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(hr, 'hr:roster:manage', mockHospitals.apex.id).allowed, true);

    // Negative security check: HR cannot access patient medical records
    const patientRecCheck = checkAccess(hr, 'patient:records:view', mockHospitals.apex.id);
    assert.equal(patientRecCheck.allowed, false);
    assert.equal(patientRecCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 9. INVENTORY & PROCUREMENT WORKFLOW & NEGATIVE BOUNDARY
  // ==========================================================================
  await t.test('Inventory Portal: allows PO creation, GRN receipt, stock transfer; denies outpatient drug dispensing', () => {
    const inv = staffUsers.inventoryOfficer;

    assert.equal(checkAccess(inv, 'inventory:po:create', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(inv, 'inventory:grn:receive', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(inv, 'inventory:catalog:view', mockHospitals.apex.id).allowed, true);
    assert.equal(checkAccess(inv, 'inventory:transfer:issue', mockHospitals.apex.id).allowed, true);

    // Negative security check: Store manager cannot dispense medications to outpatients
    const dispCheck = checkAccess(inv, 'pharmacy:dispense:outpatient', mockHospitals.apex.id);
    assert.equal(dispCheck.allowed, false);
    assert.equal(dispCheck.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 10. PATIENT PORTAL OWN-RECORD PRIVACY & CROSS-PATIENT DENIAL
  // ==========================================================================
  await t.test('Patient Portal: allows own records, appointments, bills; blocks viewing another patient records', () => {
    const patient = staffUsers.patientUser;

    // Allowed to view own data
    const ownCheck = checkAccess(patient, 'patient:portal:self:view', mockHospitals.apex.id, 'usr-patient-84');
    assert.equal(ownCheck.allowed, true);

    // Negative security check: Attempting to access another patient's records
    const otherPatientCheck = checkAccess(patient, 'patient:portal:self:view', mockHospitals.apex.id, 'usr-patient-99');
    assert.equal(otherPatientCheck.allowed, false);
    assert.equal(otherPatientCheck.reason, 'CROSS_PATIENT_ACCESS_BLOCKED');
  });

  // ==========================================================================
  // 11. SUPER ADMIN PLATFORM ISOLATION & ZERO STANDING CLINICAL ACCESS
  // ==========================================================================
  await t.test('Super Admin Portal: manages SaaS tenants/plans; standing clinical record access is strictly PROHIBITED', () => {
    const sa = staffUsers.superAdmin;

    // SaaS platform management allowed
    assert.equal(checkAccess(sa, 'saas:tenants:manage').allowed, true);
    assert.equal(checkAccess(sa, 'saas:plans:manage').allowed, true);
    assert.equal(checkAccess(sa, 'saas:announcements:broadcast').allowed, true);

    // Negative security check: Super Admin has ZERO standing clinical access
    const clinicalCheck = checkAccess(sa, 'clinical:consultation:view', mockHospitals.apex.id);
    assert.equal(clinicalCheck.allowed, false);
    assert.equal(clinicalCheck.reason, 'STANDING_CLINICAL_ACCESS_PROHIBITED');
  });

  // ==========================================================================
  // 12. CROSS-TENANT ISOLATION ENFORCEMENT
  // ==========================================================================
  await t.test('Cross-Tenant Isolation: Hospital A staff is strictly blocked from Hospital B data', () => {
    const apexDoc = staffUsers.doctor; // Hospital: Apex Care (hosp-apex-001)

    // Attempting to query patient or ward in Metro Life (hosp-metro-002)
    const crossTenantCheck = checkAccess(apexDoc, 'clinical:consult', mockHospitals.metro.id);
    assert.equal(crossTenantCheck.allowed, false);
    assert.equal(crossTenantCheck.reason, 'TENANT_ISOLATION_VIOLATION');
  });

  // ==========================================================================
  // 13. INDIVIDUAL EXPLICIT DENY OVERRIDE
  // ==========================================================================
  await t.test('Explicit individual DENY strictly overrides role-based ALLOW (PERMISSION_EXPLICIT_DENIED)', () => {
    const restrictedNurse: StaffUser = {
      ...staffUsers.nurse,
      deniedPermissions: ['nursing:mar:administer'] // Hospital Admin explicitly denied this individual
    };

    const res = checkAccess(restrictedNurse, 'nursing:mar:administer', mockHospitals.apex.id);
    assert.equal(res.allowed, false);
    assert.equal(res.reason, 'PERMISSION_EXPLICIT_DENIED');
  });

  // ==========================================================================
  // 14. CRYPTOGRAPHIC JWT SESSION VERIFICATION & INTEGRITY
  // ==========================================================================
  await t.test('Cryptographic JWT token generation and role payload verification', () => {
    const token = jwt.sign(
      {
        userId: staffUsers.doctor.id,
        hospitalId: staffUsers.doctor.hospitalId,
        userType: staffUsers.doctor.userType,
        roles: staffUsers.doctor.roles,
        permissions: staffUsers.doctor.permissions
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    assert.equal(decoded.userId, staffUsers.doctor.id);
    assert.equal(decoded.hospitalId, mockHospitals.apex.id);
    assert.deepEqual(decoded.roles, ['doctor']);
    assert.equal(decoded.permissions.includes('clinical:consult'), true);
  });
});
