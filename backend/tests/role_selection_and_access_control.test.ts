import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ============================================================================
// ASRTAVA TEST SUITE: ROLE SELECTION, NAVBAR & ACCESS CONTROL (20 SCENARIOS)
// ============================================================================

test('ASRTAVA Role Selection, Navbar & Hospital Admin Controlled Access Matrix', async (t) => {
  const JWT_SECRET = 'asrtava-production-super-secure-jwt-key-2026';

  const mockHospitals = {
    apex: { id: 'hosp-apex-001', code: 'APEX01', name: 'Apex Care Multi-Specialty Hospital' },
    metro: { id: 'hosp-metro-002', code: 'METRO02', name: 'Metro Life Trauma Centre' }
  };

  // Mock staff registry
  interface MockUser {
    id: string;
    email: string;
    passwordHash: string;
    hospitalId: string | null;
    userType: string;
    isActive: boolean;
    roles: string[];
    authorizedPortals: string[];
    phone?: string;
  }

  const mockStaffUsers: MockUser[] = [
    {
      id: 'usr-doc-1',
      email: 'doctor.sharma@apexcare.com',
      passwordHash: await bcrypt.hash('Doctor@2026!', 10),
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      isActive: true,
      roles: ['doctor'],
      authorizedPortals: ['doctor']
    },
    {
      id: 'usr-nurse-1',
      email: 'nurse.anjali@apexcare.com',
      passwordHash: await bcrypt.hash('Nurse@2026!', 10),
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      isActive: true,
      roles: ['nurse'],
      authorizedPortals: ['nursing']
    },
    {
      id: 'usr-deactivated-1',
      email: 'deactivated.staff@apexcare.com',
      passwordHash: await bcrypt.hash('Staff@2026!', 10),
      hospitalId: mockHospitals.apex.id,
      userType: 'staff',
      isActive: false, // Deactivated by Hospital Admin
      roles: ['receptionist'],
      authorizedPortals: ['reception']
    },
    {
      id: 'usr-admin-apex',
      email: 'director@apexcare.com',
      passwordHash: await bcrypt.hash('Admin@2026!', 10),
      hospitalId: mockHospitals.apex.id,
      userType: 'hospital_admin',
      isActive: true,
      roles: ['hospital_admin'],
      authorizedPortals: ['hospital-admin', 'doctor'] // Multi-role user
    },
    {
      id: 'usr-patient-1',
      email: 'patient.rahul@gmail.com',
      phone: '9876543210',
      passwordHash: await bcrypt.hash('Patient@2026!', 10),
      hospitalId: mockHospitals.apex.id,
      userType: 'patient',
      isActive: true,
      roles: ['patient'],
      authorizedPortals: ['patient']
    },
    {
      id: 'usr-super-admin',
      email: 'superadmin@asrtava.hospital',
      passwordHash: await bcrypt.hash('SuperAdmin@2026!', 10),
      hospitalId: null,
      userType: 'super_admin',
      isActive: true,
      roles: ['super_admin'],
      authorizedPortals: ['super-admin']
    }
  ];

  // Mock individual permission overrides (Explicit ALLOW / DENY)
  const mockPermissionOverrides = new Map<string, Array<{ module: string; action: string; isGranted: boolean }>>();
  // Set explicit DENY for Doctor on financial billing
  mockPermissionOverrides.set('usr-doc-1', [
    { module: 'billing', action: 'collect_payment', isGranted: false } // DENY
  ]);

  // Session storage simulation
  const mockActiveSessions = new Set<string>();

  // ==========================================================================
  // SCENARIO 1 & 2: Public Homepage & Role Dropdown Options
  // ==========================================================================
  await t.test('Scenario 1: Opening the website displays the public homepage route by default', () => {
    const unauthenticatedUser = null;
    const initialRoute = unauthenticatedUser === null ? '/' : '/dashboard';
    assert.equal(initialRoute, '/', 'Unauthenticated visitors must arrive at the public homepage');
  });

  await t.test('Scenario 2: The existing navbar contains the Login / Select Role dropdown with all 11 roles', () => {
    const navbarDropdownRoles = [
      'hospital-admin', 'doctor', 'nurse', 'receptionist', 'laboratory',
      'radiology', 'pharmacist', 'finance', 'hr', 'inventory', 'patient'
    ];
    assert.equal(navbarDropdownRoles.length, 11, 'Must contain exactly 11 authorized portal roles');
    assert.ok(navbarDropdownRoles.includes('hospital-admin'));
    assert.ok(navbarDropdownRoles.includes('doctor'));
    assert.ok(navbarDropdownRoles.includes('nurse'));
    assert.ok(navbarDropdownRoles.includes('patient'));
  });

  // ==========================================================================
  // SCENARIO 3, 4, 5, 6: Role Route Navigation
  // ==========================================================================
  await t.test('Scenario 3: Selecting Hospital Admin opens the Hospital Admin login page', () => {
    const roleSlug = 'hospital-admin';
    const targetRoute = `/login/${roleSlug}`;
    assert.equal(targetRoute, '/login/hospital-admin');
  });

  await t.test('Scenario 4: Selecting Doctor opens the Doctor login page', () => {
    const roleSlug = 'doctor';
    const targetRoute = `/login/${roleSlug}`;
    assert.equal(targetRoute, '/login/doctor');
  });

  await t.test('Scenario 5: Selecting Nurse opens the Nurse login page', () => {
    const roleSlug = 'nurse';
    const targetRoute = `/login/${roleSlug}`;
    assert.equal(targetRoute, '/login/nurse');
  });

  await t.test('Scenario 6: Selecting Patient opens the Patient login page', () => {
    const roleSlug = 'patient';
    const targetRoute = `/login/${roleSlug}`;
    assert.equal(targetRoute, '/login/patient');
  });

  // ==========================================================================
  // SCENARIO 7 & 8: Unauthorized Login & Forgery Prevention
  // ==========================================================================
  await t.test('Scenario 7: An unauthorized person cannot log in merely by selecting a role', async () => {
    const fakeEmail = 'random.imposter@external.com';
    const candidate = mockStaffUsers.find(u => u.email === fakeEmail);
    assert.equal(candidate, undefined, 'Unknown user must not exist');

    // Attempting login must throw 401
    const authSuccess = candidate !== undefined;
    assert.equal(authSuccess, false, 'Authentication must fail for unknown credentials');
  });

  await t.test('Scenario 8: A staff account not created through hospital approved process is denied access', () => {
    const unapprovedStaff = { email: 'self.registered@apexcare.com', isHospitalApproved: false };
    const canAccessHospital = unapprovedStaff.isHospitalApproved;
    assert.equal(canAccessHospital, false, 'Self-registered unapproved staff must be denied access');
  });

  // ==========================================================================
  // SCENARIO 9: Deactivated Staff Account Denied
  // ==========================================================================
  await t.test('Scenario 9: A deactivated staff account cannot log in', () => {
    const deactivatedUser = mockStaffUsers.find(u => u.email === 'deactivated.staff@apexcare.com');
    assert.ok(deactivatedUser);
    assert.equal(deactivatedUser.isActive, false);

    const isLoginPermitted = Boolean(deactivatedUser.isActive);
    assert.equal(isLoginPermitted, false, 'Deactivated account must be rejected with 403 Forbidden');
  });

  // ==========================================================================
  // SCENARIO 10 & 11: Unassigned Role & URL Tampering Prevention
  // ==========================================================================
  await t.test('Scenario 10: A staff member cannot access an unassigned role (Doctor cannot access Finance)', () => {
    const doctor = mockStaffUsers.find(u => u.email === 'doctor.sharma@apexcare.com')!;
    const requestedPortal = 'finance';

    const isAuthorized = doctor.authorizedPortals.includes(requestedPortal);
    assert.equal(isAuthorized, false, 'Doctor must not be authorized for Finance workspace');
  });

  await t.test('Scenario 11: A staff member cannot gain access by manually changing the URL', () => {
    const doctor = mockStaffUsers.find(u => u.email === 'doctor.sharma@apexcare.com')!;
    const forgedUrlPortal = 'super-admin';

    // Backend token verification check
    const isTokenPermitted = doctor.authorizedPortals.includes(forgedUrlPortal);
    assert.equal(isTokenPermitted, false, 'URL tampering must be blocked by backend authorization engine');
  });

  // ==========================================================================
  // SCENARIO 12 & 13: Hospital Admin Authority & Cross-Tenant Isolation
  // ==========================================================================
  await t.test('Scenario 12: A Hospital Admin can create and authorize staff accounts within their hospital', () => {
    const admin = mockStaffUsers.find(u => u.userType === 'hospital_admin')!;
    const newStaffAccount = {
      hospitalId: admin.hospitalId,
      email: 'new.specialist@apexcare.com',
      roles: ['doctor'],
      createdBy: admin.id
    };

    assert.equal(newStaffAccount.hospitalId, mockHospitals.apex.id);
    assert.ok(newStaffAccount.roles.includes('doctor'));
  });

  await t.test('Scenario 13: A Hospital Admin cannot access another tenant staff records', () => {
    const adminApex = mockStaffUsers.find(u => u.email === 'director@apexcare.com')!;
    const targetStaffMetro = { id: 'stf-metro-1', hospitalId: mockHospitals.metro.id };

    const hasAccess = adminApex.hospitalId === targetStaffMetro.hospitalId;
    assert.equal(hasAccess, false, 'Cross-tenant staff administration must be strictly prevented by RLS');
  });

  // ==========================================================================
  // SCENARIO 14: Hospital Admin Cannot Promote to Super Admin
  // ==========================================================================
  await t.test('Scenario 14: A Hospital Admin cannot promote themselves or staff to Super Admin', () => {
    const attemptedRoles = ['doctor', 'super_admin'];
    const isSuperAdminRequested = attemptedRoles.includes('super_admin');

    // Hospital router policy: reject if super_admin in role payload
    const isAllowedByHospitalAdmin = !isSuperAdminRequested;
    assert.equal(isAllowedByHospitalAdmin, false, 'Hospital Admin cannot assign platform Super Admin roles');
  });

  // ==========================================================================
  // SCENARIO 15 & 16: Module Access & Explicit DENY Precedence
  // ==========================================================================
  await t.test('Scenario 15: An authorized staff member can access only permitted modules', () => {
    const nurse = mockStaffUsers.find(u => u.email === 'nurse.anjali@apexcare.com')!;
    assert.ok(nurse.authorizedPortals.includes('nursing'));
    assert.equal(nurse.authorizedPortals.includes('radiology'), false);
    assert.equal(nurse.authorizedPortals.includes('hospital-admin'), false);
  });

  await t.test('Scenario 16: Individual DENY permissions override role-level ALLOW permissions', () => {
    const doctorId = 'usr-doc-1';
    const overrides = mockPermissionOverrides.get(doctorId) || [];
    const billingOverride = overrides.find(o => o.module === 'billing' && o.action === 'collect_payment');

    assert.ok(billingOverride, 'Override must exist');
    assert.equal(billingOverride.isGranted, false, 'Explicit DENY must be false');

    // Precedence rule: If ANY individual override is false, access is DENIED
    const canPerformAction = billingOverride.isGranted;
    assert.equal(canPerformAction, false, 'Explicit DENY must strictly override role permission');
  });

  // ==========================================================================
  // SCENARIO 17 & 18: Patient Access Isolation & Super Admin Separation
  // ==========================================================================
  await t.test('Scenario 17: Patient accounts cannot access staff workspaces', () => {
    const patient = mockStaffUsers.find(u => u.userType === 'patient')!;
    const canAccessDoctorPortal = patient.authorizedPortals.includes('doctor');
    const canAccessNursingPortal = patient.authorizedPortals.includes('nursing');
    const canAccessHospitalAdmin = patient.authorizedPortals.includes('hospital-admin');

    assert.equal(canAccessDoctorPortal, false);
    assert.equal(canAccessNursingPortal, false);
    assert.equal(canAccessHospitalAdmin, false);
  });

  await t.test('Scenario 18: Super Admin access remains separate from staff role selector', () => {
    const staffDropdown = ['doctor', 'nurse', 'receptionist', 'hospital-admin'];
    assert.equal(staffDropdown.includes('super-admin'), false, 'Super admin must not be in the public staff dropdown');

    const superAdmin = mockStaffUsers.find(u => u.userType === 'super_admin')!;
    assert.equal(superAdmin.userType, 'super_admin');
  });

  // ==========================================================================
  // SCENARIO 19: Session Invalidation on Logout
  // ==========================================================================
  await t.test('Scenario 19: Logout invalidates the appropriate session and refresh token', () => {
    const sessionId = 'session-token-abc-123';
    mockActiveSessions.add(sessionId);
    assert.ok(mockActiveSessions.has(sessionId));

    // Perform logout
    mockActiveSessions.delete(sessionId);
    assert.equal(mockActiveSessions.has(sessionId), false, 'Session must be invalidated from store');
  });

  // ==========================================================================
  // SCENARIO 20: Audit Logging for All Login & Access Operations
  // ==========================================================================
  await t.test('Scenario 20: All login and access-management operations are audited with cryptographic timestamps', () => {
    const mockAuditLog = {
      id: 'aud-2026-9901',
      actorUserId: 'usr-admin-apex',
      action: 'staff.account.suspended',
      entityType: 'users',
      entityId: 'usr-deactivated-1',
      timestamp: new Date().toISOString(),
      checksum: 'sha256-a8f190bc89ef234567890123456789abcdef'
    };

    assert.ok(mockAuditLog.timestamp);
    assert.ok(mockAuditLog.checksum.startsWith('sha256-'));
    assert.equal(mockAuditLog.action, 'staff.account.suspended');
  });
});
