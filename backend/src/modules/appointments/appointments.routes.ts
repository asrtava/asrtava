import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { AppointmentCreateSchema } from '../../validators';

export const appointmentsRouter = Router();

appointmentsRouter.use(authMiddleware);
appointmentsRouter.use(tenantMiddleware);

// 1. List Appointments (with Doctor, Date & Status Filtering)
appointmentsRouter.get('/', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, date, status, branchId } = req.query;

    let query = db('appointments as a')
      .join('patients as p', 'a.patient_id', 'p.id')
      .join('doctors as d', 'a.doctor_id', 'd.id')
      .join('users as u', 'd.user_id', 'u.id')
      .leftJoin('departments as dept', 'a.department_id', 'dept.id')
      .where({ 'a.hospital_id': req.hospitalId })
      .select(
        'a.id',
        'a.appointment_number',
        'a.appointment_date',
        'a.start_time',
        'a.end_time',
        'a.appointment_type',
        'a.status',
        'a.queue_token_number',
        'a.reason',
        'p.id as patient_id',
        'p.first_name as patient_first_name',
        'p.last_name as patient_last_name',
        'p.patient_number',
        'p.phone as patient_phone',
        'd.id as doctor_id',
        'u.first_name as doctor_first_name',
        'u.last_name as doctor_last_name',
        'd.specialization',
        'dept.name as department_name'
      );

    if (doctorId) query = query.andWhere({ 'a.doctor_id': doctorId });
    if (date) query = query.andWhere({ 'a.appointment_date': date });
    if (status) query = query.andWhere({ 'a.status': status });

    const appointments = await query.orderBy('a.start_time', 'asc');
    res.json({ success: true, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Schedule Appointment (With Strict Double-Booking Prevention & Concurrency Locks)
appointmentsRouter.post('/', requirePermission('create', 'all'), validateBody(AppointmentCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, doctorId, departmentId, appointmentDate, startTime, endTime, appointmentType, reason, bookingSource = 'reception' } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      // Concurrency protection: Lock any existing appointments on that date for this doctor
      const conflict = await trx('appointments')
        .where({
          hospital_id: req.hospitalId,
          doctor_id: doctorId,
          appointment_date: appointmentDate,
        })
        .whereNotIn('status', ['cancelled', 'no_show'])
        .andWhere((b) => {
          b.whereBetween('start_time', [startTime, endTime])
           .orWhereBetween('end_time', [startTime, endTime]);
        })
        .forUpdate()
        .first();

      if (conflict) {
        throw new Error('Doctor already has a confirmed consultation booked in this time slot.');
      }

      // Generate sequence number and daily token number
      const count = await trx('appointments').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const apptNumber = `APT-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

      const dailyTokenCount = await trx('appointments')
        .where({ hospital_id: req.hospitalId, doctor_id: doctorId, appointment_date: appointmentDate })
        .count('id as daily').first();
      const queueTokenNumber = Number(dailyTokenCount?.daily || 0) + 1;

      const [appointment] = await trx('appointments')
        .insert({
          hospital_id: req.hospitalId,
          patient_id: patientId,
          doctor_id: doctorId,
          department_id: departmentId,
          appointment_number: apptNumber,
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          appointment_type: appointmentType,
          status: 'confirmed',
          queue_token_number: queueTokenNumber,
          reason,
        })
        .returning('*');

      // Record in notifications table
      await trx('notifications').insert({
        hospital_id: req.hospitalId,
        recipient_user_id: req.user!.id,
        channel: 'in_app',
        event_type: 'appointment_confirmed',
        title: `Appointment ${apptNumber} Confirmed`,
        message: `Scheduled for ${appointmentDate} at ${startTime}. Token #${queueTokenNumber}.`,
        status: 'delivered',
      });

      return appointment;
    });

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed and scheduled successfully',
      data: result,
    });
  } catch (err: any) {
    res.status(409).json({ success: false, message: err.message });
  }
});

// 3. Appointment Lifecycle Transition (Check-in, In Consultation, Completed, Cancelled)
appointmentsRouter.patch('/:id/status', requirePermission('edit', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { status, cancellationReason } = req.body;
  const validStatuses = ['requested', 'confirmed', 'checked_in', 'waiting', 'in_consultation', 'completed', 'cancelled', 'no_show', 'rescheduled'];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const [updated] = await db('appointments')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({
        status,
        updated_at: new Date(),
      })
      .returning('*');

    if (!updated) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    res.json({ success: true, data: updated, message: `Appointment status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Reschedule Appointment
appointmentsRouter.post('/:id/reschedule', requirePermission('edit', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { newDate, newStartTime, newEndTime, reason } = req.body;

  try {
    const appointment = await db('appointments').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // Verify target slot availability
    const conflict = await db('appointments')
      .where({
        hospital_id: req.hospitalId,
        doctor_id: appointment.doctor_id,
        appointment_date: newDate,
      })
      .whereNotIn('status', ['cancelled', 'no_show'])
      .whereNot({ id: appointment.id })
      .andWhere((b) => {
        b.whereBetween('start_time', [newStartTime, newEndTime])
         .orWhereBetween('end_time', [newStartTime, newEndTime]);
      })
      .first();

    if (conflict) {
      res.status(409).json({ success: false, message: 'Target time slot has an active conflict' });
      return;
    }

    const [rescheduled] = await db('appointments')
      .where({ id: appointment.id })
      .update({
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        status: 'rescheduled',
        reason: reason ? `${appointment.reason || ''} [Rescheduled: ${reason}]` : appointment.reason,
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ success: true, data: rescheduled, message: 'Appointment rescheduled successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
