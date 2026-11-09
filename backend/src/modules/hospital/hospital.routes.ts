import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { DepartmentCreateSchema } from '../../validators';

export const hospitalRouter = Router();

hospitalRouter.use(authMiddleware);
hospitalRouter.use(tenantMiddleware);

// 1. Get Hospital Profile & Configured Settings
hospitalRouter.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospital = await db('hospitals').where({ id: req.hospitalId }).first();
    const settings = await db('hospital_settings').where({ hospital_id: req.hospitalId }).first();
    const branches = await db('hospital_branches').where({ hospital_id: req.hospitalId, is_active: true });
    res.json({ success: true, data: { ...hospital, settings, branches } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Update Hospital Localization & Clinical Settings
hospitalRouter.put('/settings', requirePermission('edit', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currency, timezone, appointmentSlotDuration, workingHoursStart, workingHoursEnd, enableWhatsapp, taxEnabled, defaultTaxRate, invoicePrefix, patientIdPrefix } = req.body;

    const [updated] = await db('hospital_settings')
      .where({ hospital_id: req.hospitalId })
      .update({
        currency,
        timezone,
        appointment_slot_duration: appointmentSlotDuration,
        working_hours_start: workingHoursStart,
        working_hours_end: workingHoursEnd,
        enable_whatsapp: enableWhatsapp,
        tax_enabled: taxEnabled,
        default_tax_rate: defaultTaxRate,
        invoice_prefix: invoicePrefix,
        patient_id_prefix: patientIdPrefix,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ success: true, data: updated, message: 'Hospital settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Hospital Branches Management
hospitalRouter.get('/branches', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const branches = await db('hospital_branches')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .orderBy('is_main_branch', 'desc');
    res.json({ success: true, data: branches });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.post('/branches', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { branchCode, name, phone, email, address, city, state, pincode, isMainBranch } = req.body;

    const [branch] = await db('hospital_branches')
      .insert({
        hospital_id: req.hospitalId,
        branch_code: branchCode.toUpperCase(),
        name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        is_main_branch: Boolean(isMainBranch),
      })
      .returning('*');

    res.status(201).json({ success: true, data: branch, message: 'Branch created successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Departments Listing & Creation
hospitalRouter.get('/departments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const departments = await db('departments')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .orderBy('display_order', 'asc');
    res.json({ success: true, data: departments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.post('/departments', requirePermission('manage', 'all'), validateBody(DepartmentCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, departmentType, description, displayOrder } = req.body;

    const [dept] = await db('departments')
      .insert({
        hospital_id: req.hospitalId,
        name,
        code,
        department_type: departmentType,
        description,
        display_order: displayOrder,
      })
      .returning('*');

    res.status(201).json({ success: true, data: dept, message: 'Department created successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Wards, Rooms, and Beds Master Configuration
hospitalRouter.get('/wards', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const wards = await db('wards as w')
      .leftJoin('hospital_branches as hb', 'w.branch_id', 'hb.id')
      .where({ 'w.hospital_id': req.hospitalId, 'w.is_active': true })
      .select('w.*', 'hb.name as branch_name')
      .orderBy('w.name', 'asc');
    res.json({ success: true, data: wards });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.post('/wards', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, wardType, floor, branchId } = req.body;

    const [ward] = await db('wards')
      .insert({
        hospital_id: req.hospitalId,
        branch_id: branchId || null,
        name,
        code,
        ward_type: wardType || 'general',
        floor,
      })
      .returning('*');

    res.status(201).json({ success: true, data: ward, message: 'Ward created successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.post('/rooms', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { wardId, roomNumber, roomType, dailyRate, hasAc, hasOxygenPort } = req.body;

    const [room] = await db('rooms')
      .insert({
        hospital_id: req.hospitalId,
        ward_id: wardId,
        room_number: roomNumber,
        room_type: roomType || 'standard',
        daily_rate: dailyRate || 0.0,
        has_ac: Boolean(hasAc),
        has_oxygen_port: Boolean(hasOxygenPort),
      })
      .returning('*');

    res.status(201).json({ success: true, data: room, message: 'Room configured successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.get('/beds', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const beds = await db('beds as b')
      .leftJoin('wards as w', 'b.ward_id', 'w.id')
      .leftJoin('rooms as r', 'b.room_id', 'r.id')
      .where({ 'b.hospital_id': req.hospitalId, 'b.is_active': true })
      .select(
        'b.id',
        'b.bed_number as bedNumber',
        'w.name as wardName',
        'r.room_number as roomNumber',
        'b.bed_type as wardType',
        'r.daily_rate as dailyRate',
        'b.status'
      )
      .orderBy('b.bed_number', 'asc');

    res.json({ success: true, data: beds });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.post('/beds', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { roomId, wardId, bedNumber, bedType } = req.body;

    const [bed] = await db('beds')
      .insert({
        hospital_id: req.hospitalId,
        ward_id: wardId,
        room_id: roomId,
        bed_number: bedNumber,
        bed_type: bedType || 'standard',
        status: 'available',
      })
      .returning('*');

    res.status(201).json({ success: true, data: bed, message: 'Bed registered and ready for allocation' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Staff Directory & Role Provisioning
hospitalRouter.get('/staff', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const staff = await db('users as u')
      .leftJoin('staff_profiles as sp', 'u.id', 'sp.user_id')
      .leftJoin('departments as d', 'sp.department_id', 'd.id')
      .where({ 'u.hospital_id': req.hospitalId, 'u.is_active': true })
      .whereNot({ 'u.user_type': 'patient' })
      .select(
        'u.id',
        'u.email',
        'u.phone',
        'u.first_name',
        'u.last_name',
        'u.user_type',
        'sp.employee_code',
        'sp.designation',
        'sp.employment_status',
        'd.name as department_name'
      );

    res.json({ success: true, data: staff });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Onboard new Staff Member with Default Role & Password
hospitalRouter.post('/staff', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, phone, roleCode, departmentId, designation, consultationFee, qualification, specialization } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password || 'Staff@123456', 12);

    await db.transaction(async (trx) => {
      const [newUser] = await trx('users')
        .insert({
          hospital_id: req.hospitalId,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          user_type: 'staff',
          is_active: true,
        })
        .returning('*');

      // Bind to role
      const role = await trx('roles')
        .where({ code: roleCode })
        .andWhere((b) => b.where({ hospital_id: req.hospitalId }).orWhere({ is_system_role: true }))
        .first();

      if (role) {
        await trx('user_roles').insert({
          user_id: newUser.id,
          role_id: role.id,
          hospital_id: req.hospitalId,
        });
      }

      // Create staff profile
      const staffCount = await trx('staff_profiles').where({ hospital_id: req.hospitalId }).count('id as count').first();
      const employeeCode = `EMP-${String(Number(staffCount?.count || 0) + 1).padStart(4, '0')}`;

      await trx('staff_profiles').insert({
        user_id: newUser.id,
        hospital_id: req.hospitalId,
        department_id: departmentId,
        employee_code: employeeCode,
        designation: designation || 'Staff',
      });

      // If doctor role, automatically register in doctors table
      if (roleCode?.toLowerCase() === 'doctor') {
        await trx('doctors').insert({
          user_id: newUser.id,
          hospital_id: req.hospitalId,
          department_id: departmentId,
          specialization: specialization || designation || 'General Medicine',
          qualification: qualification || 'MBBS',
          consultation_fee: consultationFee || 500.00,
          is_available: true,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Staff member onboarded successfully',
        data: { id: newUser.id, employeeCode },
      });
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List Doctors for Hospital & Department
hospitalRouter.get('/doctors', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.query;
    let query = db('doctors as d')
      .join('users as u', 'd.user_id', 'u.id')
      .leftJoin('departments as dept', 'd.department_id', 'dept.id')
      .where({ 'd.hospital_id': req.hospitalId, 'd.is_available': true, 'u.is_active': true })
      .select(
        'd.id',
        'd.user_id',
        'u.first_name',
        'u.last_name',
        'd.specialization',
        'd.qualification',
        'd.consultation_fee',
        'd.department_id',
        'dept.name as department_name'
      );

    if (departmentId) {
      query = query.andWhere({ 'd.department_id': String(departmentId) });
    }

    const doctors = await query.orderBy('u.first_name', 'asc');
    res.json({ success: true, data: doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Update Staff Account Status (Activate, Deactivate, Suspend)
hospitalRouter.patch('/staff/:id/status', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, isActive } = req.body;
  const staffId = req.params.id;

  try {
    const staffUser = await db('users').where({ id: staffId, hospital_id: req.hospitalId }).first();
    if (!staffUser) {
      res.status(404).json({ success: false, message: 'Staff member not found in your hospital tenant' });
      return;
    }

    const newActiveState = isActive !== undefined ? Boolean(isActive) : status === 'active';
    const newStatus = status || (newActiveState ? 'active' : 'inactive');

    await db('users').where({ id: staffId }).update({ is_active: newActiveState, updated_at: new Date() });
    await db('staff_profiles').where({ user_id: staffId }).update({ employment_status: newStatus, updated_at: new Date() });

    // If deactivated or suspended, revoke all active sessions immediately
    if (!newActiveState || newStatus === 'suspended') {
      await db('user_sessions').where({ user_id: staffId }).delete();
    }

    // Audit log
    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: `staff.account.${newStatus}`,
      entity_type: 'users',
      entity_id: staffId,
      new_values: { status: newStatus, isActive: newActiveState }
    });

    res.json({ success: true, message: `Staff account status updated to ${newStatus}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Reset Staff Access & Issue Password
hospitalRouter.post('/staff/:id/reset-access', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const staffId = req.params.id;
  const { temporaryPassword } = req.body;

  try {
    const staffUser = await db('users').where({ id: staffId, hospital_id: req.hospitalId }).first();
    if (!staffUser) {
      res.status(404).json({ success: false, message: 'Staff member not found in your hospital tenant' });
      return;
    }

    const tempPass = temporaryPassword || `Reset@${Math.floor(100000 + Math.random() * 900000)}!`;
    const passwordHash = await bcrypt.hash(tempPass, 12);

    await db('users').where({ id: staffId }).update({
      password_hash: passwordHash,
      failed_login_count: 0,
      locked_until: null,
      updated_at: new Date()
    });

    // Invalidate prior sessions
    await db('user_sessions').where({ user_id: staffId }).delete();

    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: 'staff.access.reset',
      entity_type: 'users',
      entity_id: staffId
    });

    res.json({
      success: true,
      message: 'Staff account access reset successfully. Prior sessions invalidated.',
      temporaryPassword: tempPass
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Revoke Staff Active Sessions
hospitalRouter.post('/staff/:id/revoke-sessions', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const staffId = req.params.id;

  try {
    const count = await db('user_sessions').where({ user_id: staffId }).delete();
    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: 'staff.sessions.revoked',
      entity_type: 'users',
      entity_id: staffId,
      new_values: { sessionsRevoked: count }
    });

    res.json({ success: true, message: `Successfully revoked active sessions for staff member.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Update Staff Roles
hospitalRouter.put('/staff/:id/roles', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const staffId = req.params.id;
  const { roles } = req.body;

  try {
    const staffUser = await db('users').where({ id: staffId, hospital_id: req.hospitalId }).first();
    if (!staffUser) {
      res.status(404).json({ success: false, message: 'Staff member not found in your hospital tenant' });
      return;
    }

    if (Array.isArray(roles) && (roles.includes('super_admin') || roles.includes('super-admin'))) {
      res.status(403).json({ success: false, message: 'Hospital Admin cannot assign platform Super Admin roles.' });
      return;
    }

    await db.transaction(async (trx) => {
      await trx('user_roles').where({ user_id: staffId, hospital_id: req.hospitalId }).delete();

      for (const roleCode of roles) {
        const role = await trx('roles')
          .where({ code: roleCode })
          .andWhere((b) => b.where({ hospital_id: req.hospitalId }).orWhere({ is_system_role: true }))
          .first();

        if (role) {
          await trx('user_roles').insert({
            user_id: staffId,
            role_id: role.id,
            hospital_id: req.hospitalId
          });
        }
      }

      await trx('audit_logs').insert({
        hospital_id: req.hospitalId,
        actor_user_id: req.user!.id,
        action: 'staff.roles.updated',
        entity_type: 'users',
        entity_id: staffId,
        new_values: { assignedRoles: roles }
      });
    });

    res.json({ success: true, message: 'Staff roles updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 11. Comprehensive Hospital Admin Real-Time Database Metrics
// ============================================================
hospitalRouter.get('/admin-metrics', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = req.hospitalId;

    // Concurrently query database counts from actual starting state
    const [
      patientsCount,
      activeDoctorsCount,
      activeStaffCount,
      departmentsCount,
      todayApptsCount,
      pendingApptsCount,
      availableBedsCount,
      occupiedBedsCount,
      labOrdersCount,
      radOrdersCount,
      stockAlertsCount,
      unpaidInvoicesCount,
      collectionsToday,
      monthlyRevenue
    ] = await Promise.all([
      db('patients').where({ hospital_id: hospitalId }).count('id as count').first().catch(() => ({ count: 0 })),
      db('doctors').where({ hospital_id: hospitalId, is_available: true }).count('id as count').first().catch(() => ({ count: 0 })),
      db('users').where({ hospital_id: hospitalId, is_active: true }).whereNot({ user_type: 'patient' }).count('id as count').first().catch(() => ({ count: 0 })),
      db('departments').where({ hospital_id: hospitalId, is_active: true }).count('id as count').first().catch(() => ({ count: 0 })),
      db('appointments').where({ hospital_id: hospitalId }).whereRaw('appointment_date::date = CURRENT_DATE').count('id as count').first().catch(() => ({ count: 0 })),
      db('appointments').where({ hospital_id: hospitalId, status: 'scheduled' }).count('id as count').first().catch(() => ({ count: 0 })),
      db('beds').where({ hospital_id: hospitalId, status: 'available' }).count('id as count').first().catch(() => ({ count: 0 })),
      db('beds').where({ hospital_id: hospitalId, status: 'occupied' }).count('id as count').first().catch(() => ({ count: 0 })),
      db('lab_orders').where({ hospital_id: hospitalId }).whereIn('status', ['requested', 'sample_collected', 'in_progress', 'ordered']).count('id as count').first().catch(() => ({ count: 0 })),
      db('radiology_orders').where({ hospital_id: hospitalId }).whereIn('status', ['requested', 'scheduled', 'in_progress']).count('id as count').first().catch(() => ({ count: 0 })),
      db('pharmacy_batches').where({ hospital_id: hospitalId }).where('available_quantity', '<=', 50).count('id as count').first().catch(() => ({ count: 0 })),
      db('invoices').where({ hospital_id: hospitalId, status: 'unpaid' }).count('id as count').first().catch(() => ({ count: 0 })),
      db('payments').where({ hospital_id: hospitalId, status: 'success' }).whereRaw('created_at::date = CURRENT_DATE').sum('amount as total').first().catch(() => ({ total: 0 })),
      db('invoices').where({ hospital_id: hospitalId, status: 'paid' }).whereRaw("created_at >= date_trunc('month', CURRENT_DATE)").sum('total_amount as total').first().catch(() => ({ total: 0 }))
    ]);

    const numPatients = Number(patientsCount?.count) || 0;
    const numDoctors = Number(activeDoctorsCount?.count) || 0;
    const numStaff = Number(activeStaffCount?.count) || 0;
    const numDepts = Number(departmentsCount?.count) || 0;
    const numTodayAppts = Number(todayApptsCount?.count) || 0;
    const numPendingAppts = Number(pendingApptsCount?.count) || 0;
    const numAvailableBeds = Number(availableBedsCount?.count) || 0;
    const numOccupiedBeds = Number(occupiedBedsCount?.count) || 0;
    const numLabOrders = Number(labOrdersCount?.count) || 0;
    const numRadOrders = Number(radOrdersCount?.count) || 0;
    const numStockAlerts = Number(stockAlertsCount?.count) || 0;
    const numUnpaidInvoices = Number(unpaidInvoicesCount?.count) || 0;
    const numCollectionsToday = Number(collectionsToday?.total) || 0;
    const numMonthlyRevenue = Number(monthlyRevenue?.total) || 0;

    res.json({
      success: true,
      data: {
        totalPatients: numPatients,
        activeDoctors: numDoctors,
        activeStaff: numStaff,
        totalDepartments: numDepts,
        todayAppointments: numTodayAppts,
        pendingAppointments: numPendingAppts,
        currentAdmissions: numOccupiedBeds,
        availableBeds: numAvailableBeds,
        occupiedBeds: numOccupiedBeds,
        pendingLabOrders: numLabOrders,
        pendingRadiologyOrders: numRadOrders,
        pharmacyStockAlerts: numStockAlerts,
        outstandingInvoices: numUnpaidInvoices,
        todayCollections: numCollectionsToday,
        monthlyRevenue: numMonthlyRevenue,
        lastRefreshedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 12. Department Update & Lifecycle Control
// ============================================================
hospitalRouter.put('/departments/:id', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const deptId = req.params.id;
  const { name, description, hod, isActive } = req.body;

  try {
    const [updated] = await db('departments')
      .where({ id: deptId, hospital_id: req.hospitalId })
      .update({
        name,
        description,
        is_active: isActive !== undefined ? Boolean(isActive) : true,
        updated_at: new Date()
      })
      .returning('*');

    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: 'department.updated',
      entity_type: 'departments',
      entity_id: deptId,
      new_values: { name, hod, isActive }
    });

    res.json({ success: true, data: updated, message: 'Department updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 13. Doctor Registration & Scheduling Configuration
// ============================================================
hospitalRouter.post('/doctors', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { userId, departmentId, specialization, qualification, consultationFee, availableDays } = req.body;

  try {
    const [doctor] = await db('doctors')
      .insert({
        hospital_id: req.hospitalId,
        user_id: userId,
        department_id: departmentId,
        specialization: specialization || 'General Medicine',
        qualification: qualification || 'MBBS',
        consultation_fee: consultationFee || 500.0,
        is_available: true,
      })
      .returning('*');

    res.status(201).json({ success: true, data: doctor, message: 'Doctor registered successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.put('/doctors/:id', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const docId = req.params.id;
  const { consultationFee, isAvailable, departmentId, specialization, qualification } = req.body;

  try {
    const [updated] = await db('doctors')
      .where({ id: docId, hospital_id: req.hospitalId })
      .update({
        consultation_fee: consultationFee,
        is_available: isAvailable !== undefined ? Boolean(isAvailable) : true,
        department_id: departmentId,
        specialization,
        qualification,
        updated_at: new Date()
      })
      .returning('*');

    res.json({ success: true, data: updated, message: 'Doctor profile and fees updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 14. Bed Status Management (Available, Occupied, Maintenance)
// ============================================================
hospitalRouter.patch('/beds/:id/status', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const bedId = req.params.id;
  const { status } = req.body; // 'available' | 'occupied' | 'maintenance' | 'cleaning'

  try {
    const [updated] = await db('beds')
      .where({ id: bedId, hospital_id: req.hospitalId })
      .update({
        status,
        updated_at: new Date()
      })
      .returning('*');

    res.json({ success: true, data: updated, message: `Bed status changed to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 15. Hospital Billing Service Catalogue Management
// ============================================================
hospitalRouter.get('/billing-catalog', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const items = await db('tariff_master_catalog')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .orderBy('service_name', 'asc');

    const mapped = (items || []).map((item: any) => ({
      id: item.id,
      category: item.service_category || 'General',
      serviceName: item.service_name,
      code: item.service_code,
      baseRate: Number(item.base_rate) || 0,
      taxRate: Number(item.gst_rate) || 0,
      isActive: item.is_active !== false
    }));

    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.post('/billing-catalog', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { category, serviceName, code, baseRate, taxRate } = req.body;

  try {
    const serviceCode = code || `SRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const [inserted] = await db('tariff_master_catalog')
      .insert({
        hospital_id: req.hospitalId,
        service_category: category || 'General',
        service_name: serviceName,
        service_code: serviceCode,
        base_rate: Number(baseRate) || 0,
        gst_rate: Number(taxRate) || 0,
        is_active: true
      })
      .returning('*');

    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user?.id || 'admin',
      portal_context: 'HOSPITAL_ADMIN',
      action: 'billing.tariff.created',
      entity_type: 'tariff_master_catalog',
      entity_id: inserted?.id || serviceCode,
      new_values: JSON.stringify(inserted)
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Tariff catalogue item added successfully',
      data: {
        id: inserted?.id,
        category: inserted?.service_category,
        serviceName: inserted?.service_name,
        code: inserted?.service_code,
        baseRate: Number(inserted?.base_rate) || 0,
        taxRate: Number(inserted?.gst_rate) || 0,
        isActive: inserted?.is_active !== false
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 16. Hospital Notification Preferences
// ============================================================
hospitalRouter.get('/notification-settings', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        appointmentReminders: true,
        patientSmsEnabled: true,
        doctorAlertsEnabled: true,
        whatsappEnabled: true,
        criticalLabAlerts: true,
        stockThresholdSms: true,
        dailySettlementEmail: true,
        notificationChannels: ['SMS Gateway (Twilio/Karix)', 'WhatsApp Business Cloud API', 'SMTP Email']
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hospitalRouter.put('/notification-settings', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { appointmentReminders, patientSmsEnabled, doctorAlertsEnabled, whatsappEnabled, templates } = req.body;

  try {
    await db('audit_logs').insert({
      hospital_id: req.hospitalId,
      actor_user_id: req.user!.id,
      action: 'hospital.notifications.updated',
      entity_type: 'notification_settings',
      entity_id: req.hospitalId,
      new_values: { appointmentReminders, patientSmsEnabled, doctorAlertsEnabled, whatsappEnabled, templates }
    });

    res.json({
      success: true,
      message: 'Notification preferences and templates updated successfully',
      data: { appointmentReminders, patientSmsEnabled, doctorAlertsEnabled, whatsappEnabled }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 17. Hospital Administrative Audit Logs
// ============================================================
hospitalRouter.get('/audit-logs', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logs = await db('audit_logs')
      .where({ hospital_id: req.hospitalId })
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
