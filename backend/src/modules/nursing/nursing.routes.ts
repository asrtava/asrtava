import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const nursingRouter = Router();

nursingRouter.use(authMiddleware);
nursingRouter.use(tenantMiddleware);

// 1. Nursing Station Dashboard Census & Alerts
nursingRouter.get('/station-overview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { wardId } = req.query;

    let bedsQuery = db('beds as b')
      .join('wards as w', 'b.ward_id', 'w.id')
      .join('rooms as r', 'b.room_id', 'r.id')
      .leftJoin('bed_allocations as ba', function () {
        this.on('b.id', '=', 'ba.bed_id').andOn('ba.is_current', '=', db.raw('?', [true]));
      })
      .leftJoin('admissions as adm', 'ba.admission_id', 'adm.id')
      .leftJoin('patients as p', 'adm.patient_id', 'p.id')
      .where({ 'b.hospital_id': req.hospitalId, 'b.is_active': true });

    if (wardId) bedsQuery = bedsQuery.andWhere({ 'b.ward_id': wardId });

    const beds = await bedsQuery.select(
      'b.id as bed_id',
      'b.bed_number',
      'b.status as bed_status',
      'w.name as ward_name',
      'r.room_number',
      'p.id as patient_id',
      'p.first_name',
      'p.last_name',
      'p.patient_number',
      'adm.id as admission_id',
      'adm.initial_diagnosis'
    );

    const totalBeds = beds.length;
    const occupiedCount = beds.filter((b) => b.bed_status === 'occupied').length;
    const availableCount = beds.filter((b) => b.bed_status === 'available').length;

    res.json({
      success: true,
      data: {
        totalBeds,
        occupiedCount,
        availableCount,
        beds,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. e-MAR Medication Administration (With 5-Rights Verification & Electronic Sign-off)
nursingRouter.post('/medications/administer', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { prescriptionItemId, patientId, admissionId, administeredDose, routeUsed, nurseSignatureNotes, fiveRightsVerified } = req.body;

  if (!fiveRightsVerified) {
    res.status(400).json({ success: false, message: '5 Rights of medication administration must be verified by licensed nurse.' });
    return;
  }

  try {
    const [marRecord] = await db('medication_administrations')
      .insert({
        hospital_id: req.hospitalId,
        prescription_item_id: prescriptionItemId,
        patient_id: patientId,
        admission_id: admissionId,
        dose_administered: administeredDose,
        route: routeUsed,
        notes: nurseSignatureNotes,
        administered_by_user_id: req.user!.id,
        administered_at: new Date(),
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: marRecord,
      message: 'Medication dose administration verified and signed in e-MAR.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Fluid Balance (Intake / Output Monitoring)
nursingRouter.post('/intake-output', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { admissionId, patientId, oralMl = 0, ivFluidMl = 0, tubeFeedingMl = 0, urineMl = 0, drainMl = 0, vomitusMl = 0 } = req.body;

  try {
    const [record] = await db('nursing_intake_output')
      .insert({
        hospital_id: req.hospitalId,
        admission_id: admissionId,
        patient_id: patientId,
        intake_oral_ml: oralMl,
        intake_iv_fluid_ml: ivFluidMl,
        intake_tube_feeding_ml: tubeFeedingMl,
        output_urine_ml: urineMl,
        output_drain_ml: drainMl,
        output_vomitus_ml: vomitusMl,
        recorded_by_nurse_id: req.user!.id,
      })
      .returning('*');

    res.status(201).json({ success: true, data: record, message: 'Fluid balance intake/output recorded' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Shift Handover Notes
nursingRouter.post('/shift-handovers', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { wardId, shiftType, incomingNurseId, censusOccupied, censusVacant, criticalNotes, pendingTasks } = req.body;

  try {
    const [handover] = await db('nursing_shift_handovers')
      .insert({
        hospital_id: req.hospitalId,
        ward_id: wardId,
        shift_type: shiftType,
        outgoing_nurse_id: req.user!.id,
        incoming_nurse_id: incomingNurseId,
        census_occupied: censusOccupied || 0,
        census_vacant: censusVacant || 0,
        critical_patients_notes: criticalNotes,
        pending_tasks: pendingTasks,
        handover_confirmed: true,
      })
      .returning('*');

    res.status(201).json({ success: true, data: handover, message: 'Nursing shift handover submitted and confirmed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Nursing Care Plans
nursingRouter.post('/care-plans', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { admissionId, patientId, nursingDiagnosis, expectedOutcome, interventions } = req.body;

  try {
    const [plan] = await db('nursing_care_plans')
      .insert({
        hospital_id: req.hospitalId,
        admission_id: admissionId,
        patient_id: patientId,
        nursing_diagnosis: nursingDiagnosis,
        expected_outcome: expectedOutcome,
        interventions: interventions,
        created_by_nurse_id: req.user!.id,
      })
      .returning('*');

    res.status(201).json({ success: true, data: plan, message: 'Nursing care plan established' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

