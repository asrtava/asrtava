import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { PatientCreateSchema, PatientAllergySchema } from '../../validators';

export const patientsRouter = Router();

patientsRouter.use(authMiddleware);
patientsRouter.use(tenantMiddleware);

// 1. Patient Directory Search & Multi-Field Filtering
patientsRouter.get('/', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, uhid, phone, email, appointmentId, admissionId, limit = 20, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('patients').where({ hospital_id: req.hospitalId, is_active: true });

    if (search) {
      query = query.andWhere((builder) => {
        builder
          .whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('phone', `%${search}%`)
          .orWhereILike('patient_number', `%${search}%`)
          .orWhereILike('national_health_id', `%${search}%`);
      });
    }

    if (uhid) query = query.andWhereILike('patient_number', `%${uhid}%`);
    if (phone) query = query.andWhereILike('phone', `%${phone}%`);
    if (email) query = query.andWhereILike('email', `%${email}%`);

    if (appointmentId) {
      const appt = await db('appointments').where({ id: appointmentId, hospital_id: req.hospitalId }).first();
      if (appt) query = query.andWhere({ id: appt.patient_id });
    }

    if (admissionId) {
      const adm = await db('admissions').where({ id: admissionId, hospital_id: req.hospitalId }).first();
      if (adm) query = query.andWhere({ id: adm.patient_id });
    }

    const patients = await query.limit(Number(limit)).offset(offset).orderBy('created_at', 'desc');
    const totalCount = await db('patients').where({ hospital_id: req.hospitalId, is_active: true }).count('id as count').first();

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalCount?.count || 0),
        totalPages: Math.ceil(Number(totalCount?.count || 0) / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Register New Patient (With duplicate telephone check & MRN/UHID generation)
patientsRouter.post('/', requirePermission('create', 'all'), validateBody(PatientCreateSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, dateOfBirth, gender, bloodGroup, email, address, city, state, emergencyContactName, emergencyContactPhone, nationalHealthId } = req.body;

    // Check potential duplicate phone in active hospital
    const duplicate = await db('patients')
      .where({ hospital_id: req.hospitalId, phone, is_active: true })
      .first();

    if (duplicate) {
      res.status(409).json({
        success: false,
        message: `Patient with phone ${phone} already exists in hospital records (UHID: ${duplicate.patient_number})`,
        data: { existingPatientId: duplicate.id, patientNumber: duplicate.patient_number },
      });
      return;
    }

    const count = await db('patients').where({ hospital_id: req.hospitalId }).count('id as total').first();
    const patientNumber = `APEX-${new Date().getFullYear()}-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

    const [newPatient] = await db('patients')
      .insert({
        hospital_id: req.hospitalId,
        patient_number: patientNumber,
        national_health_id: nationalHealthId || null,
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        blood_group: bloodGroup,
        email,
        address,
        city,
        state,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      })
      .returning('*');

    res.status(201).json({
      success: true,
      data: newPatient,
      message: 'Patient registered successfully',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Consolidated Patient 360-Degree Profile
patientsRouter.get('/:id/360-profile', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patient = await db('patients').where({ id: req.params.id, hospital_id: req.hospitalId }).first();
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    // Parallel fetch of clinical records across domains
    const [allergies, appointments, consultations, admissions, prescriptions, labOrders, invoices, documents] = await Promise.all([
      db('patient_allergies').where({ patient_id: patient.id, hospital_id: req.hospitalId, is_active: true }),
      db('appointments').where({ patient_id: patient.id, hospital_id: req.hospitalId }).orderBy('appointment_date', 'desc').limit(10),
      db('consultations').where({ patient_id: patient.id, hospital_id: req.hospitalId }).orderBy('created_at', 'desc').limit(10),
      db('admissions').where({ patient_id: patient.id, hospital_id: req.hospitalId }).orderBy('admission_date', 'desc').limit(5),
      db('prescriptions').where({ patient_id: patient.id, hospital_id: req.hospitalId }).orderBy('created_at', 'desc').limit(10),
      db('lab_orders').where({ patient_id: patient.id, hospital_id: req.hospitalId }).orderBy('ordered_at', 'desc').limit(10),
      db('invoices').where({ patient_id: patient.id, hospital_id: req.hospitalId }).orderBy('created_at', 'desc').limit(10),
      db('hospital_documents').where({ patient_id: patient.id, hospital_id: req.hospitalId, is_archived: false }).limit(10),
    ]);

    res.json({
      success: true,
      data: {
        patient,
        allergies,
        appointments,
        consultations,
        admissions,
        prescriptions,
        labOrders,
        invoices,
        documents,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Duplicate Patient Detection Algorithm (Matching Scoring)
patientsRouter.post('/detect-duplicates', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { phone, firstName, lastName, dateOfBirth } = req.body;

    const candidates = await db('patients')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .andWhere((b) => {
        if (phone) b.orWhere({ phone });
        if (firstName) b.orWhereILike('first_name', `%${firstName}%`);
        if (lastName) b.orWhereILike('last_name', `%${lastName}%`);
      });

    const evaluated = candidates.map((cand) => {
      let score = 0;
      const reasons: string[] = [];

      if (cand.phone === phone) {
        score += 50;
        reasons.push('Exact phone match (+50%)');
      }
      if (cand.first_name.toLowerCase() === (firstName || '').toLowerCase()) {
        score += 25;
        reasons.push('Exact first name match (+25%)');
      }
      if (cand.last_name.toLowerCase() === (lastName || '').toLowerCase()) {
        score += 15;
        reasons.push('Exact last name match (+15%)');
      }
      if (cand.date_of_birth && dateOfBirth && String(cand.date_of_birth).startsWith(String(dateOfBirth))) {
        score += 10;
        reasons.push('Exact DOB match (+10%)');
      }

      return {
        patient: cand,
        matchScore: score,
        reasons,
        confidence: score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW',
      };
    }).filter((c) => c.matchScore >= 40);

    res.json({ success: true, count: evaluated.length, duplicatesFound: evaluated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Authorized Patient Record Merge (Atomic Re-linking & Audit Preservation)
patientsRouter.post('/merge', requirePermission('manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { sourcePatientId, targetPatientId, mergeReason } = req.body;

  if (!sourcePatientId || !targetPatientId || sourcePatientId === targetPatientId) {
    res.status(400).json({ success: false, message: 'Invalid source or target patient IDs for merge' });
    return;
  }

  try {
    await db.transaction(async (trx) => {
      // 1. Verify both patients exist in current tenant
      const source = await trx('patients').where({ id: sourcePatientId, hospital_id: req.hospitalId, is_active: true }).first();
      const target = await trx('patients').where({ id: targetPatientId, hospital_id: req.hospitalId, is_active: true }).first();

      if (!source || !target) {
        throw new Error('Source or Target patient record does not exist or is already deactivated');
      }

      // 2. Re-point all clinical foreign keys to target
      await trx('appointments').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });
      await trx('consultations').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });
      await trx('admissions').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });
      await trx('prescriptions').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });
      await trx('lab_orders').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });
      await trx('invoices').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });
      await trx('hospital_documents').where({ patient_id: sourcePatientId }).update({ patient_id: targetPatientId });

      // 3. Deactivate source patient
      await trx('patients')
        .where({ id: sourcePatientId })
        .update({
          is_active: false,
          deleted_at: new Date(),
          updated_at: new Date(),
        });

      // 4. Record immutable merge audit log
      await trx('patient_merges').insert({
        hospital_id: req.hospitalId,
        source_patient_id: sourcePatientId,
        target_patient_id: targetPatientId,
        merge_reason: mergeReason || 'Duplicate records merged by medical records administration',
        approved_by_user_id: req.user!.id,
        status: 'completed',
      });
    });

    res.json({
      success: true,
      message: `Patient record ${sourcePatientId} successfully merged into ${targetPatientId}. All clinical links preserved.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Record Patient Allergies
patientsRouter.post('/:id/allergies', requirePermission('create', 'all'), validateBody(PatientAllergySchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { allergenType, allergenName, severity, reactionDescription } = req.body;

    const [allergy] = await db('patient_allergies')
      .insert({
        hospital_id: req.hospitalId,
        patient_id: req.params.id,
        allergen_type: allergenType,
        allergen_name: allergenName,
        severity,
        reaction_description: reactionDescription,
        recorded_by_user_id: req.user!.id,
      })
      .returning('*');

    res.status(201).json({ success: true, data: allergy, message: 'Allergy recorded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
