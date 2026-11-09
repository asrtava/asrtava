import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { AdmissionCreateSchema, BedAllocateSchema } from '../../validators';

export const inpatientRouter = Router();

inpatientRouter.use(authMiddleware);
inpatientRouter.use(tenantMiddleware);

// 1. Bed Management Grid & Live Occupancy Directory
inpatientRouter.get('/beds', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const beds = await db('beds as b')
      .join('rooms as r', 'b.room_id', 'r.id')
      .join('wards as w', 'b.ward_id', 'w.id')
      .leftJoin('bed_allocations as ba', function () {
        this.on('b.id', '=', 'ba.bed_id').andOn('ba.is_current', '=', db.raw('?', [true]));
      })
      .leftJoin('admissions as adm', 'ba.admission_id', 'adm.id')
      .leftJoin('patients as p', 'adm.patient_id', 'p.id')
      .where({ 'b.hospital_id': req.hospitalId, 'b.is_active': true })
      .select(
        'b.id as bed_id',
        'b.bed_number',
        'b.bed_type',
        'b.status as bed_status',
        'r.room_number',
        'r.daily_rate',
        'w.name as ward_name',
        'w.ward_type',
        'p.id as patient_id',
        'p.first_name as patient_first_name',
        'p.last_name as patient_last_name',
        'p.patient_number',
        'adm.id as admission_id',
        'adm.admission_number',
        'adm.initial_diagnosis',
        'ba.allocated_from'
      )
      .orderBy(['w.name', 'r.room_number', 'b.bed_number']);

    res.json({ success: true, data: beds });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Inpatient Admission Intake (With Concurrency Bed Lock)
inpatientRouter.post('/admissions', requirePermission('manage', 'all'), validateBody(AdmissionCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, admittingDoctorId, departmentId, admissionType, initialDiagnosis, bedId } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      const count = await trx('admissions').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const admNumber = `ADM-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

      const [admission] = await trx('admissions')
        .insert({
          hospital_id: req.hospitalId,
          patient_id: patientId,
          admitting_doctor_id: admittingDoctorId,
          department_id: departmentId,
          admission_number: admNumber,
          admission_type: admissionType,
          initial_diagnosis: initialDiagnosis,
          status: 'admitted',
          admitted_by_user_id: req.user!.id,
        })
        .returning('*');

      // If Bed allocated during intake, atomically assign with concurrency lock
      if (bedId) {
        const bed = await trx('beds')
          .where({ id: bedId, hospital_id: req.hospitalId })
          .forUpdate()
          .first();

        if (!bed || bed.status !== 'available') {
          throw new Error('Selected bed is occupied, under maintenance, or not available');
        }

        await trx('bed_allocations').insert({
          hospital_id: req.hospitalId,
          admission_id: admission.id,
          bed_id: bedId,
          is_current: true,
          allocated_by_user_id: req.user!.id,
        });

        await trx('beds').where({ id: bedId }).update({ status: 'occupied', updated_at: new Date() });
      }

      return admission;
    });

    res.status(201).json({
      success: true,
      message: 'Inpatient admission created successfully',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Bed Transfer / Reallocation (Concurrency-Protected)
inpatientRouter.post('/bed-transfers', requirePermission('manage', 'all'), validateBody(BedAllocateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { admissionId, bedId, transferReason } = req.body;

  try {
    await db.transaction(async (trx) => {
      // Lock target bed
      const targetBed = await trx('beds')
        .where({ id: bedId, hospital_id: req.hospitalId })
        .forUpdate()
        .first();

      if (!targetBed || targetBed.status !== 'available') {
        throw new Error('Target bed is no longer available');
      }

      // Find current bed allocation & release it
      const currentAlloc = await trx('bed_allocations')
        .where({ admission_id: admissionId, hospital_id: req.hospitalId, is_current: true })
        .first();

      if (currentAlloc) {
        await trx('bed_allocations')
          .where({ id: currentAlloc.id })
          .update({ is_current: false, allocated_until: new Date(), released_by_user_id: req.user!.id });

        await trx('beds')
          .where({ id: currentAlloc.bed_id })
          .update({ status: 'cleaning', updated_at: new Date() });
      }

      // Allocate new bed
      await trx('bed_allocations').insert({
        hospital_id: req.hospitalId,
        admission_id: admissionId,
        bed_id: bedId,
        is_current: true,
        transfer_reason: transferReason,
        allocated_by_user_id: req.user!.id,
      });

      await trx('beds').where({ id: bedId }).update({ status: 'occupied', updated_at: new Date() });
    });

    res.json({ success: true, message: 'Bed transfer completed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Inpatient Daily Clinical Rounds & Doctor Notes
inpatientRouter.post('/admissions/:id/rounds', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { doctorId, clinicalObservations, treatmentChanges, dietaryOrders, isReadyForDischarge } = req.body;

  try {
    const admission = await db('admissions').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!admission) {
      res.status(404).json({ success: false, message: 'Inpatient record not found' });
      return;
    }

    const [round] = await db('consultations')
      .insert({
        hospital_id: req.hospitalId,
        patient_id: admission.patient_id,
        doctor_id: doctorId || admission.admitting_doctor_id,
        consultation_number: `RND-${Date.now().toString().slice(-6)}`,
        chief_complaint: 'Inpatient Daily Round',
        clinical_notes: clinicalObservations,
        management_plan: treatmentChanges,
        follow_up_instructions: dietaryOrders,
        status: isReadyForDischarge ? 'ready_for_discharge' : 'completed',
      })
      .returning('*');

    if (isReadyForDischarge) {
      await db('admissions').where({ id: admission.id }).update({ status: 'ready_for_discharge', updated_at: new Date() });
    }

    res.status(201).json({ success: true, data: round, message: 'Daily clinical round logged successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Patient Discharge & Automated Bed Release
inpatientRouter.post('/admissions/:id/discharge', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { dischargeDiagnosis, dischargeSummary, dischargeCondition, followUpDate, dischargeMedications } = req.body;

  try {
    await db.transaction(async (trx) => {
      const admission = await trx('admissions')
        .where({ id: req.params.id, hospital_id: req.hospitalId })
        .first();

      if (!admission || admission.status === 'discharged') {
        throw new Error('Admission record not found or patient already discharged');
      }

      // Update admission record
      await trx('admissions')
        .where({ id: admission.id })
        .update({
          status: 'discharged',
          actual_discharge_date: new Date(),
          updated_at: new Date(),
        });

      // Find active bed allocation and release it
      const currentAlloc = await trx('bed_allocations')
        .where({ admission_id: admission.id, is_current: true })
        .first();

      if (currentAlloc) {
        await trx('bed_allocations')
          .where({ id: currentAlloc.id })
          .update({ is_current: false, allocated_until: new Date(), released_by_user_id: req.user!.id });

        // Bed transitions to cleaning
        await trx('beds').where({ id: currentAlloc.bed_id }).update({ status: 'cleaning', updated_at: new Date() });
      }

      // Record discharge summary document
      await trx('hospital_documents').insert({
        hospital_id: req.hospitalId,
        patient_id: admission.patient_id,
        document_category: 'discharge_summary',
        title: `Discharge Summary - ${admission.admission_number}`,
        file_path: `/reports/discharge/${admission.id}.pdf`,
        uploaded_by_user_id: req.user!.id,
      });
    });

    res.json({
      success: true,
      message: 'Patient successfully discharged. Bed released and scheduled for sanitization.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
