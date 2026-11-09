import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { ConsultationCreateSchema } from '../../validators';

export const clinicalRouter = Router();

clinicalRouter.use(authMiddleware);
clinicalRouter.use(tenantMiddleware);

// 1. Conduct & Finalize Clinical Consultation (Atomic Transaction)
clinicalRouter.post('/consultations', requirePermission('create', 'all'), validateBody(ConsultationCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const {
    appointmentId,
    patientId,
    doctorId,
    chiefComplaint,
    historyOfPresentIllness,
    examinationFindings,
    clinicalNotes,
    managementPlan,
    followUpDate,
    followUpInstructions,
    vitals,
    diagnoses,
    prescriptions,
    labTestIds,
  } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      // Generate consultation sequence number
      const count = await trx('consultations').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const consultNumber = `CON-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

      // Insert consultation header
      const [consultation] = await trx('consultations')
        .insert({
          hospital_id: req.hospitalId,
          appointment_id: appointmentId,
          patient_id: patientId,
          doctor_id: doctorId,
          consultation_number: consultNumber,
          chief_complaint: chiefComplaint,
          history_of_present_illness: historyOfPresentIllness,
          examination_findings: examinationFindings,
          clinical_notes: clinicalNotes,
          management_plan: managementPlan,
          follow_up_date: followUpDate,
          follow_up_instructions: followUpInstructions,
          status: 'completed',
        })
        .returning('*');

      // Update linked appointment to 'completed'
      if (appointmentId) {
        await trx('appointments')
          .where({ id: appointmentId, hospital_id: req.hospitalId })
          .update({ status: 'completed', updated_at: new Date() });
      }

      // Record vitals if provided
      if (vitals) {
        await trx('consultation_vitals').insert({
          consultation_id: consultation.id,
          hospital_id: req.hospitalId,
          blood_pressure_systolic: vitals.systolicBp,
          blood_pressure_diastolic: vitals.diastolicBp,
          pulse: vitals.pulse,
          temperature: vitals.temperature,
          respiratory_rate: vitals.respiratoryRate,
          oxygen_saturation: vitals.spo2,
          weight: vitals.weight,
          height: vitals.height,
          bmi: vitals.weight && vitals.height ? Number((vitals.weight / Math.pow(vitals.height / 100, 2)).toFixed(2)) : null,
          blood_sugar: vitals.bloodSugar,
          recorded_by_user_id: req.user!.id,
        });
      }

      // Record diagnoses
      if (diagnoses && diagnoses.length > 0) {
        const diagRows = diagnoses.map((d: any) => ({
          hospital_id: req.hospitalId,
          consultation_id: consultation.id,
          diagnosis_name: d.diagnosisName,
          icd10_code: d.icd10Code,
          diagnosis_type: d.diagnosisType || 'provisional',
        }));
        await trx('clinical_diagnoses').insert(diagRows);
      }

      // Generate E-Prescription & items
      let createdPrescription = null;
      if (prescriptions && prescriptions.length > 0) {
        const prescCount = await trx('prescriptions').where({ hospital_id: req.hospitalId }).count('id as total').first();
        const prescNumber = `RX-${String(Number(prescCount?.total || 0) + 1).padStart(5, '0')}`;

        const [rx] = await trx('prescriptions')
          .insert({
            hospital_id: req.hospitalId,
            consultation_id: consultation.id,
            patient_id: patientId,
            doctor_id: doctorId,
            prescription_number: prescNumber,
            status: 'active',
          })
          .returning('*');

        const itemRows = prescriptions.map((p: any) => ({
          hospital_id: req.hospitalId,
          prescription_id: rx.id,
          medicine_name: p.medicineName,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          route: p.route || 'Oral',
          instructions: p.instructions,
          quantity: p.quantity || 1,
          is_dispensed: false,
        }));
        await trx('prescription_items').insert(itemRows);
        createdPrescription = rx;
      }

      // Dispatch Lab Requisitions if tests were ordered
      if (labTestIds && labTestIds.length > 0) {
        const labCount = await trx('lab_orders').where({ hospital_id: req.hospitalId }).count('id as total').first();
        const labOrderNumber = `LAB-${String(Number(labCount?.total || 0) + 1).padStart(5, '0')}`;

        const [labOrder] = await trx('lab_orders')
          .insert({
            hospital_id: req.hospitalId,
            patient_id: patientId,
            ordering_doctor_id: doctorId,
            consultation_id: consultation.id,
            order_number: labOrderNumber,
            priority: 'routine',
            order_status: 'ordered',
            clinical_notes: `Ordered from OPD Consultation ${consultNumber}`,
          })
          .returning('*');

        const labItemRows = labTestIds.map((tid: string) => ({
          lab_order_id: labOrder.id,
          hospital_id: req.hospitalId,
          test_id: tid,
          item_status: 'pending',
        }));
        await trx('lab_order_items').insert(labItemRows);
      }

      return { consultation, prescription: createdPrescription };
    });

    res.status(201).json({
      success: true,
      message: 'Consultation completed, E-Prescription issued and diagnostics dispatched',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Amend Finalized Clinical Record (Strict Audit Versioning without Overwrite)
clinicalRouter.post('/consultations/:id/amend', requirePermission('edit', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { amendmentReason, amendedClinicalNotes } = req.body;

  if (!amendmentReason || !amendedClinicalNotes) {
    res.status(400).json({ success: false, message: 'Amendment reason and amended notes are required.' });
    return;
  }

  try {
    const consultation = await db('consultations').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!consultation) {
      res.status(404).json({ success: false, message: 'Consultation record not found' });
      return;
    }

    const count = await db('consultation_amendments').where({ consultation_id: consultation.id }).count('id as total').first();
    const amendmentNumber = Number(count?.total || 0) + 1;

    await db.transaction(async (trx) => {
      // 1. Record immutable historical amendment record
      await trx('consultation_amendments').insert({
        hospital_id: req.hospitalId,
        consultation_id: consultation.id,
        amendment_number: amendmentNumber,
        amended_by_user_id: req.user!.id,
        amendment_reason: amendmentReason,
        previous_clinical_notes: consultation.clinical_notes,
        amended_clinical_notes: amendedClinicalNotes,
      });

      // 2. Append amendment trace to clinical record
      const updatedNotes = `${consultation.clinical_notes}\n\n[AMENDMENT #${amendmentNumber} - ${new Date().toISOString()} by ${req.user!.email}]: ${amendedClinicalNotes} (Reason: ${amendmentReason})`;
      await trx('consultations').where({ id: consultation.id }).update({
        clinical_notes: updatedNotes,
        updated_at: new Date(),
      });
    });

    res.json({ success: true, message: `Clinical note amended with amendment audit #${amendmentNumber}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get Patient Prescriptions
clinicalRouter.get('/patients/:patientId/prescriptions', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const prescriptions = await db('prescriptions as rx')
      .join('doctors as d', 'rx.doctor_id', 'd.id')
      .join('users as u', 'd.user_id', 'u.id')
      .where({ 'rx.hospital_id': req.hospitalId, 'rx.patient_id': req.params.patientId })
      .select('rx.*', 'u.first_name as doctor_first_name', 'u.last_name as doctor_last_name', 'd.specialization')
      .orderBy('rx.created_at', 'desc');

    for (const rx of prescriptions) {
      rx.items = await db('prescription_items').where({ prescription_id: rx.id });
    }

    res.json({ success: true, data: prescriptions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
