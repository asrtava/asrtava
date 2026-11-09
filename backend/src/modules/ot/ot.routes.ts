import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const otRouter = Router();

otRouter.use(authMiddleware);
otRouter.use(tenantMiddleware);

// 1. List Operation Theatres
otRouter.get('/theatres', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const theatres = await db('operation_theatres')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .orderBy('code', 'asc');
    res.json({ success: true, data: theatres });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create Operation Theatre Room
otRouter.post('/theatres', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, code, floor, branchId } = req.body;

  try {
    const [ot] = await db('operation_theatres')
      .insert({
        hospital_id: req.hospitalId,
        branch_id: branchId || null,
        name,
        code: code.toUpperCase(),
        floor,
      })
      .returning('*');

    res.status(201).json({ success: true, data: ot, message: 'Operation theatre room registered' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Schedule Surgical Procedure (With Conflict Checking)
otRouter.post('/schedules', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { operationTheatreId, patientId, admissionId, leadSurgeonId, anesthetistId, procedureName, procedureCode, scheduledStart, scheduledEnd, preOpChecklist } = req.body;

  try {
    const conflict = await db('ot_schedules')
      .where({
        hospital_id: req.hospitalId,
        operation_theatre_id: operationTheatreId,
      })
      .whereNotIn('status', ['cancelled', 'completed'])
      .andWhere((b) => {
        b.whereBetween('scheduled_start', [scheduledStart, scheduledEnd])
         .orWhereBetween('scheduled_end', [scheduledStart, scheduledEnd]);
      })
      .first();

    if (conflict) {
      res.status(409).json({ success: false, message: 'Selected Operation Theatre is already booked for this schedule window.' });
      return;
    }

    const [schedule] = await db('ot_schedules')
      .insert({
        hospital_id: req.hospitalId,
        operation_theatre_id: operationTheatreId,
        patient_id: patientId,
        admission_id: admissionId || null,
        lead_surgeon_id: leadSurgeonId,
        anesthetist_id: anesthetistId || null,
        procedure_name: procedureName,
        procedure_code: procedureCode,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        status: 'scheduled',
        pre_op_checklist: preOpChecklist || { consent_verified: true, site_marked: true, anesthesia_cleared: true },
      })
      .returning('*');

    res.status(201).json({ success: true, data: schedule, message: 'Surgical procedure scheduled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update Operative Findings & Post-Op Recovery Notes
otRouter.patch('/schedules/:id/operative-notes', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, operativeFindings, postOpOrders } = req.body;

  try {
    const [updated] = await db('ot_schedules')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({
        status: status || 'completed',
        operative_findings: operativeFindings,
        post_op_orders: postOpOrders,
        actual_end: status === 'completed' ? new Date() : undefined,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ success: true, data: updated, message: 'Operative notes and recovery orders finalized' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

