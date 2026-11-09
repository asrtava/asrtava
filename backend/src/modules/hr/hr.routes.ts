import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const hrRouter = Router();

hrRouter.use(authMiddleware);
hrRouter.use(tenantMiddleware);

// 1. Staff Duty Roster Listing
hrRouter.get('/rosters', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date, departmentId } = req.query;

    let query = db('staff_duty_rosters as sdr')
      .join('staff_profiles as sp', 'sdr.staff_profile_id', 'sp.id')
      .join('users as u', 'sp.user_id', 'u.id')
      .leftJoin('departments as d', 'sp.department_id', 'd.id')
      .where({ 'sdr.hospital_id': req.hospitalId })
      .select(
        'sdr.*',
        'u.first_name',
        'u.last_name',
        'sp.employee_code',
        'sp.designation',
        'd.name as department_name'
      );

    if (date) query = query.andWhere({ 'sdr.shift_date': date });
    if (departmentId) query = query.andWhere({ 'sp.department_id': departmentId });

    const rosters = await query.orderBy('sdr.shift_date', 'desc');
    res.json({ success: true, data: rosters });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Publish Shift Assignment
hrRouter.post('/rosters', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { staffProfileId, shiftDate, shiftCode, shiftStart, shiftEnd } = req.body;

  try {
    const [roster] = await db('staff_duty_rosters')
      .insert({
        hospital_id: req.hospitalId,
        staff_profile_id: staffProfileId,
        shift_date: shiftDate,
        shift_code: shiftCode,
        shift_start: shiftStart,
        shift_end: shiftEnd,
      })
      .returning('*');

    res.status(201).json({ success: true, data: roster, message: 'Shift duty roster published' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Attendance Clock-in & Clock-out
hrRouter.post('/attendance/clock-in', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const [attendance] = await db('staff_attendance')
      .insert({
        hospital_id: req.hospitalId,
        user_id: req.user!.id,
        attendance_date: today,
        clock_in: new Date(),
        status: 'present',
      })
      .onConflict(['hospital_id', 'user_id', 'attendance_date'])
      .merge({ clock_in: new Date(), status: 'present' })
      .returning('*');

    res.json({ success: true, data: attendance, message: 'Clock-in time recorded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hrRouter.post('/attendance/clock-out', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const [attendance] = await db('staff_attendance')
      .where({ hospital_id: req.hospitalId, user_id: req.user!.id, attendance_date: today })
      .update({ clock_out: new Date() })
      .returning('*');

    res.json({ success: true, data: attendance, message: 'Clock-out time recorded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Staff Leave Application & Supervisor Approval
hrRouter.get('/leaves', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const leaves = await db('staff_leaves as sl')
      .join('users as u', 'sl.user_id', 'u.id')
      .leftJoin('staff_profiles as sp', 'u.id', 'sp.user_id')
      .leftJoin('departments as d', 'sp.department_id', 'd.id')
      .where({ 'sl.hospital_id': req.hospitalId })
      .select('sl.*', 'u.first_name', 'u.last_name', 'sp.employee_code', 'd.name as department_name')
      .orderBy('sl.created_at', 'desc');

    res.json({ success: true, data: leaves });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hrRouter.post('/leaves', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { leaveType, startDate, endDate, reason } = req.body;

  try {
    const [leave] = await db('staff_leaves')
      .insert({
        hospital_id: req.hospitalId,
        user_id: req.user!.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'pending',
      })
      .returning('*');

    res.status(201).json({ success: true, data: leave, message: 'Leave request submitted for supervisor approval' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hrRouter.patch('/leaves/:id/status', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, approvalNotes } = req.body;

  try {
    const [updated] = await db('staff_leaves')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({
        status,
        approved_by_user_id: req.user!.id,
        approval_notes: approvalNotes,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ success: true, data: updated, message: `Leave request marked as ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Payroll Management
hrRouter.get('/payroll', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { month } = req.query; // YYYY-MM

  try {
    let query = db('payroll_runs as pr')
      .join('users as u', 'pr.employee_user_id', 'u.id')
      .leftJoin('staff_profiles as sp', 'u.id', 'sp.user_id')
      .leftJoin('departments as d', 'sp.department_id', 'd.id')
      .where({ 'pr.hospital_id': req.hospitalId })
      .select('pr.*', 'u.first_name', 'u.last_name', 'sp.employee_code', 'd.name as department_name');

    if (month) query = query.andWhere({ 'pr.pay_period_month': month });

    const records = await query.orderBy('pr.created_at', 'desc');
    res.json({ success: true, data: records });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hrRouter.post('/payroll/generate', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { employeeUserId, payPeriodMonth, basicSalary, hra, medical, special, pf, pTax, tds } = req.body;

  try {
    const [payroll] = await db('payroll_runs')
      .insert({
        hospital_id: req.hospitalId,
        employee_user_id: employeeUserId,
        pay_period_month: payPeriodMonth,
        basic_salary: basicSalary,
        hra_allowance: hra || 0,
        medical_allowance: medical || 0,
        special_allowance: special || 0,
        provident_fund_deduction: pf || 0,
        professional_tax_deduction: pTax || 0,
        income_tax_tds: tds || 0,
        status: 'approved',
      })
      .onConflict(['hospital_id', 'employee_user_id', 'pay_period_month'])
      .merge({
        basic_salary: basicSalary,
        hra_allowance: hra,
        medical_allowance: medical,
        special_allowance: special,
        provident_fund_deduction: pf,
        professional_tax_deduction: pTax,
        income_tax_tds: tds,
        status: 'approved',
        updated_at: new Date(),
      })
      .returning('*');

    res.status(201).json({ success: true, data: payroll, message: 'Monthly payroll run generated and approved' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
