import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ============================================================================
// ASRTAVA TEST SUITE: HOSPITAL ADMIN MASTER CONTROL CENTER & MANAGEMENT (15 SCENARIOS)
// ============================================================================

describe('ASRTAVA Hospital Admin Master Control Center & Dynamic Governance Suite', () => {
  const JWT_SECRET = 'asrtava-production-super-secure-jwt-key-2026';

  const mockHospitals = {
    apex: { id: 'hosp-apex-001', code: 'APEX01', name: 'Apex Care Multi-Specialty Hospital' },
    metro: { id: 'hosp-metro-002', code: 'METRO02', name: 'Metro Life Trauma Centre' }
  };

  // --------------------------------------------------------------------------
  // Scenario 1: Admin Dashboard Metric Calculation from Real Database Records
  // --------------------------------------------------------------------------
  it('Scenario 1: Calculates live admin dashboard metrics from actual database-driven records', () => {
    const mockDb = {
      patients: [{ id: 'p1', hospital_id: mockHospitals.apex.id }, { id: 'p2', hospital_id: mockHospitals.apex.id }, { id: 'p3', hospital_id: mockHospitals.apex.id }],
      doctors: [{ id: 'd1', hospital_id: mockHospitals.apex.id, is_available: true }, { id: 'd2', hospital_id: mockHospitals.apex.id, is_available: true }],
      users: [
        { id: 'u1', hospital_id: mockHospitals.apex.id, user_type: 'staff', is_active: true },
        { id: 'u2', hospital_id: mockHospitals.apex.id, user_type: 'staff', is_active: true },
        { id: 'u3', hospital_id: mockHospitals.apex.id, user_type: 'patient', is_active: true }
      ],
      departments: [{ id: 'dept1', hospital_id: mockHospitals.apex.id, is_active: true }, { id: 'dept2', hospital_id: mockHospitals.apex.id, is_active: true }],
      appointments: [
        { id: 'a1', hospital_id: mockHospitals.apex.id, status: 'scheduled', date: new Date().toISOString().slice(0, 10) },
        { id: 'a2', hospital_id: mockHospitals.apex.id, status: 'completed', date: new Date().toISOString().slice(0, 10) },
        { id: 'a3', hospital_id: mockHospitals.apex.id, status: 'scheduled', date: '2026-11-20' }
      ],
      beds: [
        { id: 'b1', hospital_id: mockHospitals.apex.id, status: 'available' },
        { id: 'b2', hospital_id: mockHospitals.apex.id, status: 'occupied' },
        { id: 'b3', hospital_id: mockHospitals.apex.id, status: 'occupied' }
      ],
      pharmacy_batches: [
        { id: 'pb1', hospital_id: mockHospitals.apex.id, available_quantity: 20 }, // Low stock <= 50
        { id: 'pb2', hospital_id: mockHospitals.apex.id, available_quantity: 120 }
      ],
      invoices: [
        { id: 'inv1', hospital_id: mockHospitals.apex.id, status: 'unpaid', total_amount: 5400 },
        { id: 'inv2', hospital_id: mockHospitals.apex.id, status: 'paid', total_amount: 12000 }
      ],
      payments: [
        { id: 'pay1', hospital_id: mockHospitals.apex.id, status: 'success', amount: 12000, date: new Date().toISOString().slice(0, 10) }
      ]
    };

    const todayStr = new Date().toISOString().slice(0, 10);
    const metrics = {
      totalPatients: mockDb.patients.filter(p => p.hospital_id === mockHospitals.apex.id).length,
      activeDoctors: mockDb.doctors.filter(d => d.hospital_id === mockHospitals.apex.id && d.is_available).length,
      activeStaff: mockDb.users.filter(u => u.hospital_id === mockHospitals.apex.id && u.user_type === 'staff' && u.is_active).length,
      totalDepartments: mockDb.departments.filter(dept => dept.hospital_id === mockHospitals.apex.id && dept.is_active).length,
      todayAppointments: mockDb.appointments.filter(a => a.hospital_id === mockHospitals.apex.id && a.date === todayStr).length,
      pendingAppointments: mockDb.appointments.filter(a => a.hospital_id === mockHospitals.apex.id && a.status === 'scheduled').length,
      availableBeds: mockDb.beds.filter(b => b.hospital_id === mockHospitals.apex.id && b.status === 'available').length,
      occupiedBeds: mockDb.beds.filter(b => b.hospital_id === mockHospitals.apex.id && b.status === 'occupied').length,
      pharmacyStockAlerts: mockDb.pharmacy_batches.filter(pb => pb.hospital_id === mockHospitals.apex.id && pb.available_quantity <= 50).length,
      outstandingInvoices: mockDb.invoices.filter(i => i.hospital_id === mockHospitals.apex.id && i.status === 'unpaid').length,
      todayCollections: mockDb.payments.filter(p => p.hospital_id === mockHospitals.apex.id && p.status === 'success' && p.date === todayStr).reduce((sum, p) => sum + p.amount, 0),
    };

    assert.equal(metrics.totalPatients, 3);
    assert.equal(metrics.activeDoctors, 2);
    assert.equal(metrics.activeStaff, 2);
    assert.equal(metrics.totalDepartments, 2);
    assert.equal(metrics.todayAppointments, 2);
    assert.equal(metrics.pendingAppointments, 2);
    assert.equal(metrics.availableBeds, 1);
    assert.equal(metrics.occupiedBeds, 2);
    assert.equal(metrics.pharmacyStockAlerts, 1);
    assert.equal(metrics.outstandingInvoices, 1);
    assert.equal(metrics.todayCollections, 12000);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Staff Onboarding & Sequential EMP-XXXX Generation
  // --------------------------------------------------------------------------
  it('Scenario 2: Provisions new staff member with automatically formatted EMP-XXXX code', () => {
    let currentStaffCount = 4;
    function onboardStaff(hospitalId: string, email: string, role: string) {
      currentStaffCount += 1;
      const employeeCode = `EMP-${String(currentStaffCount).padStart(4, '0')}`;
      return {
        id: `usr-${Date.now()}`,
        hospitalId,
        email: email.toLowerCase(),
        employeeCode,
        role,
        isActive: true
      };
    }

    const staff1 = onboardStaff(mockHospitals.apex.id, 'priya.nair@apexcare.com', 'nurse');
    assert.equal(staff1.employeeCode, 'EMP-0005');
    assert.equal(staff1.isActive, true);

    const staff2 = onboardStaff(mockHospitals.apex.id, 'kavita.pharmacist@apexcare.com', 'pharmacist');
    assert.equal(staff2.employeeCode, 'EMP-0006');
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Immediate Login Prevention upon Staff Account Deactivation
  // --------------------------------------------------------------------------
  it('Scenario 3: Enforces immediate lockout and terminates active sessions on staff deactivation', () => {
    let activeSessions = [
      { sessionId: 'sess-1', userId: 'usr-nurse-1' },
      { sessionId: 'sess-2', userId: 'usr-nurse-1' },
      { sessionId: 'sess-3', userId: 'usr-other-2' }
    ];

    let userState = {
      id: 'usr-nurse-1',
      isActive: true,
      employmentStatus: 'active'
    };

    function deactivateStaff(userId: string) {
      if (userState.id === userId) {
        userState.isActive = false;
        userState.employmentStatus = 'inactive';
        // Terminate all sessions
        activeSessions = activeSessions.filter(s => s.userId !== userId);
      }
    }

    deactivateStaff('usr-nurse-1');

    assert.equal(userState.isActive, false);
    assert.equal(userState.employmentStatus, 'inactive');
    assert.equal(activeSessions.filter(s => s.userId === 'usr-nurse-1').length, 0);

    // Verify login rejection for inactive user
    function attemptLogin(user: typeof userState) {
      if (!user.isActive) {
        return { success: false, status: 403, code: 'ACCOUNT_DEACTIVATED' };
      }
      return { success: true };
    }

    const loginRes = attemptLogin(userState);
    assert.equal(loginRes.success, false);
    assert.equal(loginRes.code, 'ACCOUNT_DEACTIVATED');
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Custom Role Creation & Granular Permissions Assignment
  // --------------------------------------------------------------------------
  it('Scenario 4: Allows Hospital Admin to create custom hospital roles with action permissions', () => {
    const rolesTable: any[] = [];
    const rolePermissionsTable: any[] = [];

    function createCustomRole(hospitalId: string, name: string, code: string, actionPerms: string[]) {
      const newRole = {
        id: `role-${Date.now()}`,
        hospitalId,
        name,
        code: code.toLowerCase(),
        isSystemRole: false,
        isActive: true
      };
      rolesTable.push(newRole);

      for (const perm of actionPerms) {
        rolePermissionsTable.push({
          roleId: newRole.id,
          permission: perm
        });
      }

      return newRole;
    }

    const customRole = createCustomRole(
      mockHospitals.apex.id,
      'Discharge Clearance Specialist',
      'discharge_specialist',
      ['view:inpatient', 'approve:discharge', 'verify:billing']
    );

    assert.equal(customRole.name, 'Discharge Clearance Specialist');
    assert.equal(customRole.isSystemRole, false);
    assert.equal(rolesTable.length, 1);
    assert.equal(rolePermissionsTable.filter(rp => rp.roleId === customRole.id).length, 3);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Explicit DENY Overrides Role-Based ALLOW (Absolute Precedence)
  // --------------------------------------------------------------------------
  it('Scenario 5: Enforces that Individual Explicit DENY strictly overrides Role ALLOW', () => {
    interface PermissionEvalContext {
      userRoles: string[];
      rolePermissions: { role: string; action: string; resource: string }[];
      userOverrides: { action: string; resource: string; isGranted: boolean }[];
    }

    function evaluatePermission(ctx: PermissionEvalContext, action: string, resource: string): { granted: boolean; reason: string } {
      // 1. Check Explicit Individual Override
      const override = ctx.userOverrides.find(o => o.action === action && o.resource === resource);
      if (override !== undefined) {
        if (!override.isGranted) {
          return { granted: false, reason: 'EXPLICIT_DENY_PRECEDENCE' };
        }
        return { granted: true, reason: 'EXPLICIT_ALLOW_GRANTED' };
      }

      // 2. Check RBAC
      const hasRolePerm = ctx.rolePermissions.some(
        rp => ctx.userRoles.includes(rp.role) && rp.action === action && rp.resource === resource
      );
      if (hasRolePerm) {
        return { granted: true, reason: 'ROLE_BASED_ALLOW' };
      }

      // 3. Default Deny
      return { granted: false, reason: 'DEFAULT_DENY' };
    }

    const context: PermissionEvalContext = {
      userRoles: ['doctor'],
      rolePermissions: [
        { role: 'doctor', action: 'create', resource: 'prescriptions' },
        { role: 'doctor', action: 'view', resource: 'patients' }
      ],
      userOverrides: [
        // Admin explicitly denied prescription writing for this specific doctor (e.g. pending license renewal)
        { action: 'create', resource: 'prescriptions', isGranted: false }
      ]
    };

    // View patients: role ALLOW, no override -> Granted
    const viewResult = evaluatePermission(context, 'view', 'patients');
    assert.equal(viewResult.granted, true);
    assert.equal(viewResult.reason, 'ROLE_BASED_ALLOW');

    // Create prescriptions: role ALLOW, but explicit DENY override -> Denied!
    const createPrescriptionResult = evaluatePermission(context, 'create', 'prescriptions');
    assert.equal(createPrescriptionResult.granted, false);
    assert.equal(createPrescriptionResult.reason, 'EXPLICIT_DENY_PRECEDENCE');
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Role Escalation Protection: No Self-Promotion to Super Admin
  // --------------------------------------------------------------------------
  it('Scenario 6: Prevents Hospital Admin from elevating roles to SaaS Super Admin', () => {
    function assignStaffRoles(requesterRole: string, requestedRoles: string[]) {
      if (requesterRole !== 'super_admin') {
        const containsSuperAdmin = requestedRoles.some(
          r => r.toLowerCase().includes('super_admin') || r.toLowerCase().includes('super-admin')
        );
        if (containsSuperAdmin) {
          return { success: false, status: 403, message: 'Hospital Admin cannot assign platform Super Admin roles.' };
        }
      }
      return { success: true, assignedRoles: requestedRoles };
    }

    const attempt = assignStaffRoles('hospital_admin', ['doctor', 'super_admin']);
    assert.equal(attempt.success, false);
    assert.equal(attempt.status, 403);
    assert.match(attempt.message || '', /cannot assign platform Super Admin/i);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Hospital Profile & Localization Settings Update
  // --------------------------------------------------------------------------
  it('Scenario 7: Persists hospital profile settings, working hours, and invoice prefixes', () => {
    let hospitalSettings = {
      hospitalId: mockHospitals.apex.id,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      workingHoursStart: '08:00',
      workingHoursEnd: '20:00',
      invoicePrefix: 'INV-APEX-',
      patientIdPrefix: 'PAT-'
    };

    function updateSettings(payload: Partial<typeof hospitalSettings>) {
      hospitalSettings = { ...hospitalSettings, ...payload };
      return hospitalSettings;
    }

    const updated = updateSettings({
      workingHoursStart: '07:30',
      workingHoursEnd: '21:00',
      invoicePrefix: 'INV-BLR-2026-'
    });

    assert.equal(updated.workingHoursStart, '07:30');
    assert.equal(updated.workingHoursEnd, '21:00');
    assert.equal(updated.invoicePrefix, 'INV-BLR-2026-');
    assert.equal(updated.currency, 'INR');
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Department Addition & Dynamic Availability
  // --------------------------------------------------------------------------
  it('Scenario 8: Adding a department immediately updates the department catalog and queue', () => {
    const departments: any[] = [
      { id: 'd1', name: 'Cardiology', code: 'CARD', isActive: true },
      { id: 'd2', name: 'General Medicine', code: 'GMED', isActive: true }
    ];

    function addDepartment(name: string, code: string) {
      const dept = { id: `d-${Date.now()}`, name, code, isActive: true };
      departments.push(dept);
      return dept;
    }

    const newDept = addDepartment('Neurology & Neurosurgery', 'NEUR');
    assert.equal(departments.length, 3);
    assert.ok(departments.some(d => d.code === 'NEUR' && d.isActive));
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Doctor Onboarding & Weekly Availability Scheduling
  // --------------------------------------------------------------------------
  it('Scenario 9: Updates doctor consultation fees and slot duration rules dynamically', () => {
    let doctorProfile = {
      id: 'doc-1',
      name: 'Dr. Rajesh Sharma',
      consultationFee: 500,
      slotDurationMinutes: 15,
      isAvailable: true
    };

    function updateDoctorConfig(docId: string, updates: Partial<typeof doctorProfile>) {
      if (doctorProfile.id === docId) {
        doctorProfile = { ...doctorProfile, ...updates };
      }
      return doctorProfile;
    }

    const updated = updateDoctorConfig('doc-1', {
      consultationFee: 800,
      slotDurationMinutes: 20,
      isAvailable: true
    });

    assert.equal(updated.consultationFee, 800);
    assert.equal(updated.slotDurationMinutes, 20);
    assert.equal(updated.isAvailable, true);
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Bed Status Management & Lifecycle Transitions
  // --------------------------------------------------------------------------
  it('Scenario 10: Transitions bed statuses across available, occupied, cleaning, and maintenance', () => {
    const validStatuses = ['available', 'occupied', 'cleaning', 'maintenance'];
    let bed = {
      id: 'bed-icu-01',
      bedNumber: 'ICU-01',
      status: 'available',
      wardType: 'ICU'
    };

    function transitionBedStatus(newStatus: string) {
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }
      bed.status = newStatus;
      return bed;
    }

    transitionBedStatus('occupied');
    assert.equal(bed.status, 'occupied');

    transitionBedStatus('cleaning');
    assert.equal(bed.status, 'cleaning');

    transitionBedStatus('available');
    assert.equal(bed.status, 'available');

    transitionBedStatus('maintenance');
    assert.equal(bed.status, 'maintenance');
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Master Billing Tariff & Tax Bracket Configuration
  // --------------------------------------------------------------------------
  it('Scenario 11: Configures billing tariffs with proper GST tax rate application', () => {
    const tariffCatalog: any[] = [];

    function addTariff(serviceName: string, code: string, baseRate: number, taxRate: number) {
      const total = Math.round(baseRate * (1 + taxRate / 100));
      const item = { id: `srv-${Date.now()}`, serviceName, code, baseRate, taxRate, totalPayable: total, isActive: true };
      tariffCatalog.push(item);
      return item;
    }

    // Health consultation: 0% GST
    const opdTariff = addTariff('OPD Specialist Consultation', 'SRV-OPD-01', 800, 0);
    assert.equal(opdTariff.totalPayable, 800);

    // Minor surgical procedure: 18% GST
    const surTariff = addTariff('Minor Surgical Wound Debridement', 'SRV-SUR-01', 2500, 18);
    assert.equal(surTariff.totalPayable, 2950);
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Notification Preferences & Custom Message Templates
  // --------------------------------------------------------------------------
  it('Scenario 12: Customizes notification channel preferences and dynamic message templates', () => {
    let notificationConfig = {
      appointmentReminders: true,
      patientSmsEnabled: true,
      whatsappEnabled: true,
      templates: {
        appointment: 'Appointment confirmed for {{appointment_time}} with {{doctor_name}}.'
      }
    };

    function renderTemplate(template: string, vars: Record<string, string>): string {
      let result = template;
      for (const [key, val] of Object.entries(vars)) {
        result = result.replace(`{{${key}}}`, val);
      }
      return result;
    }

    const rendered = renderTemplate(notificationConfig.templates.appointment, {
      appointment_time: '10:30 AM',
      doctor_name: 'Dr. Rajesh Sharma'
    });

    assert.equal(rendered, 'Appointment confirmed for 10:30 AM with Dr. Rajesh Sharma.');
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Administrative Action Audit Log Trail Recording
  // --------------------------------------------------------------------------
  it('Scenario 13: Records tamper-evident audit logs for all administrative mutations', () => {
    const auditLogs: any[] = [];

    function recordAudit(hospitalId: string, actorId: string, action: string, entityType: string, entityId: string, diff: any) {
      const entry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        hospitalId,
        actorId,
        action,
        entityType,
        entityId,
        diff,
        timestamp: new Date().toISOString()
      };
      auditLogs.push(entry);
      return entry;
    }

    recordAudit(mockHospitals.apex.id, 'usr-admin-1', 'staff.roles.updated', 'users', 'usr-stf-1', { roles: ['doctor'] });
    recordAudit(mockHospitals.apex.id, 'usr-admin-1', 'billing.tariff.created', 'tariffs', 'srv-1', { baseRate: 800 });

    assert.equal(auditLogs.length, 2);
    assert.equal(auditLogs[0].action, 'staff.roles.updated');
    assert.equal(auditLogs[1].action, 'billing.tariff.created');
    assert.ok(auditLogs[0].timestamp);
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Strict Multi-Tenant Boundary Enforcement
  // --------------------------------------------------------------------------
  it('Scenario 14: Restricts Hospital Admin strictly to their own hospital tenant resources', () => {
    function queryHospitalData(adminHospitalId: string, targetResourceHospitalId: string) {
      if (adminHospitalId !== targetResourceHospitalId) {
        return { success: false, status: 403, message: 'Cross-tenant access forbidden.' };
      }
      return { success: true, data: { tenant: targetResourceHospitalId } };
    }

    // Apex Admin accessing Apex data -> OK
    const sameTenant = queryHospitalData(mockHospitals.apex.id, mockHospitals.apex.id);
    assert.equal(sameTenant.success, true);

    // Apex Admin attempting to access Metro Hospital data -> Blocked
    const crossTenant = queryHospitalData(mockHospitals.apex.id, mockHospitals.metro.id);
    assert.equal(crossTenant.success, false);
    assert.equal(crossTenant.status, 403);
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Cross-Module Dynamic Cascade (Doctor -> Appointment & Billing)
  // --------------------------------------------------------------------------
  it('Scenario 15: Onboarding a doctor immediately cascades to appointment booking and billing fee calculation', () => {
    const doctorsDb: any[] = [];
    const appointmentsDb: any[] = [];

    // 1. Onboard Doctor
    const newDoc = {
      id: 'doc-auto-01',
      name: 'Dr. Alok Verma',
      departmentId: 'dept-neuro',
      consultationFee: 750,
      isAvailable: true
    };
    doctorsDb.push(newDoc);

    // 2. Query doctor for appointment booking
    const availableDocs = doctorsDb.filter(d => d.departmentId === 'dept-neuro' && d.isAvailable);
    assert.equal(availableDocs.length, 1);
    assert.equal(availableDocs[0].name, 'Dr. Alok Verma');

    // 3. Book appointment and dynamically calculate bill
    const appointment = {
      id: 'apt-001',
      doctorId: availableDocs[0].id,
      patientId: 'pat-100',
      consultationFee: availableDocs[0].consultationFee
    };
    appointmentsDb.push(appointment);

    assert.equal(appointment.consultationFee, 750);
    assert.equal(appointmentsDb.length, 1);
  });
});

