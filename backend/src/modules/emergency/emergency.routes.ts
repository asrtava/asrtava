import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const emergencyRouter = Router();

emergencyRouter.use(authMiddleware);
emergencyRouter.use(tenantMiddleware);

// 1. Live Emergency Worklist & Triage Queue
emergencyRouter.get('/queue', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await db('emergency_admissions as ea')
      .join('patients as p', 'ea.patient_id', 'p.id')
      .leftJoin('doctors as d', 'ea.assigned_doctor_id', 'd.id')
      .leftJoin('users as u', 'd.user_id', 'u.id')
      .where({ 'ea.hospital_id': req.hospitalId, 'ea.disposition': 'in_er' })
      .select(
        'ea.*',
        'p.first_name',
        'p.last_name',
        'p.patient_number',
        'p.blood_group',
        'p.gender',
        'p.date_of_birth',
        'u.first_name as doctor_first_name',
        'u.last_name as doctor_last_name'
      )
      .orderByRaw(`
        CASE ea.triage_level
          WHEN 'level_1_resuscitation' THEN 1
          WHEN 'level_2_emergent' THEN 2
          WHEN 'level_3_urgent' THEN 3
          WHEN 'level_4_less_urgent' THEN 4
          ELSE 5
        END ASC, ea.arrival_time ASC
      `);

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Emergency Patient Intake & Triage Priority Assignment
emergencyRouter.post('/triage', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, triageLevel, chiefComplaint, triageVitals, arrivalMode, assignedDoctorId } = req.body;

  try {
    const count = await db('emergency_admissions').where({ hospital_id: req.hospitalId }).count('id as total').first();
    const erNumber = `ER-${new Date().getFullYear()}-${String(Number(count?.total || 0) + 1).padStart(4, '0')}`;

    const [erCase] = await db('emergency_admissions')
      .insert({
        hospital_id: req.hospitalId,
        patient_id: patientId,
        emergency_number: erNumber,
        triage_level: triageLevel,
        chief_complaint: chiefComplaint,
        triage_vitals: triageVitals || {},
        arrival_mode: arrivalMode || 'walk_in',
        assigned_doctor_id: assignedDoctorId || null,
        disposition: 'in_er',
      })
      .returning('*');

    res.status(201).json({ success: true, data: erCase, message: 'Emergency triage case registered with high clinical priority.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Emergency Disposition (Transfer to ICU/OT/IPD or Discharged)
emergencyRouter.patch('/:id/disposition', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { disposition, clinicalNotes } = req.body;

  try {
    const [updated] = await db('emergency_admissions')
      .where({ id: req.params.id, hospital_id: req.hospitalId })
      .update({
        disposition,
        clinical_notes: clinicalNotes,
        disposition_time: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    res.json({ success: true, data: updated, message: `Emergency disposition completed: ${disposition}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

