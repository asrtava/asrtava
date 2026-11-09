import { Router, Response } from 'express';
import { db } from '../../database';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';

export const diagnosticsRouter = Router();

diagnosticsRouter.use(authMiddleware);
diagnosticsRouter.use(tenantMiddleware);

// ============================================================
// LABORATORY WORKFLOW
// ============================================================

// 1. Lab Test Catalog
diagnosticsRouter.get('/lab/catalog', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tests = await db('lab_test_catalog')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .orderBy('test_name', 'asc');
    res.json({ success: true, data: tests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Order Lab Tests
diagnosticsRouter.post('/lab/orders', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, orderingDoctorId, consultationId, priority = 'routine', testIds, clinicalNotes } = req.body;

  try {
    const result = await db.transaction(async (trx) => {
      const count = await trx('lab_orders').where({ hospital_id: req.hospitalId }).count('id as total').first();
      const orderNumber = `LAB-${String(Number(count?.total || 0) + 1).padStart(5, '0')}`;

      const [order] = await trx('lab_orders')
        .insert({
          hospital_id: req.hospitalId,
          patient_id: patientId,
          ordering_doctor_id: orderingDoctorId,
          consultation_id: consultationId,
          order_number: orderNumber,
          priority,
          order_status: 'ordered',
          clinical_notes: clinicalNotes,
        })
        .returning('*');

      // Insert order items
      if (testIds && testIds.length > 0) {
        const itemRows = testIds.map((tid: string) => ({
          lab_order_id: order.id,
          hospital_id: req.hospitalId,
          test_id: tid,
          item_status: 'pending',
        }));
        await trx('lab_order_items').insert(itemRows);
      }

      return order;
    });

    res.status(201).json({ success: true, data: result, message: 'Laboratory order placed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Enter Diagnostic Test Result & Pathologist Approval
diagnosticsRouter.post('/lab/order-items/:itemId/result', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { quantitativeValue, qualitativeValue, isAbnormal, isCriticalPanicValue, technologistRemarks, isApproved } = req.body;

  try {
    const [result] = await db('lab_results')
      .insert({
        hospital_id: req.hospitalId,
        lab_order_item_id: req.params.itemId,
        quantitative_value: quantitativeValue,
        qualitative_value: qualitativeValue,
        is_abnormal: isAbnormal || false,
        is_critical_panic_value: isCriticalPanicValue || false,
        technologist_remarks: technologistRemarks,
        entered_by_tech_id: req.user!.id,
        approved_by_pathologist_id: isApproved ? req.user!.id : null,
        approved_at: isApproved ? new Date() : null,
      })
      .onConflict('lab_order_item_id')
      .merge({
        quantitative_value: quantitativeValue,
        qualitative_value: qualitativeValue,
        is_abnormal: isAbnormal,
        is_critical_panic_value: isCriticalPanicValue,
        technologist_remarks: technologistRemarks,
        approved_by_pathologist_id: isApproved ? req.user!.id : null,
        approved_at: isApproved ? new Date() : null,
        updated_at: new Date(),
      })
      .returning('*');

    await db('lab_order_items')
      .where({ id: req.params.itemId })
      .update({ item_status: isApproved ? 'approved' : 'result_entered' });

    res.json({ success: true, data: result, message: 'Laboratory result saved and verified' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// RADIOLOGY WORKFLOW
// ============================================================

// 4. Radiology Procedure Directory
diagnosticsRouter.get('/radiology/procedures', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const procedures = await db('radiology_procedures')
      .where({ hospital_id: req.hospitalId, is_active: true })
      .orderBy('name', 'asc');
    res.json({ success: true, data: procedures });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Author Radiology Structured Imaging Report
diagnosticsRouter.post('/radiology/orders/:orderId/report', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { clinicalIndication, techniqueDescription, imagingFindings, impressionSummary, recommendations, pacsDicomStudyUid, attachmentUrls } = req.body;

  try {
    const [report] = await db('radiology_reports')
      .insert({
        hospital_id: req.hospitalId,
        radiology_order_id: req.params.orderId,
        clinical_indication: clinicalIndication,
        technique_description: techniqueDescription,
        imaging_findings: imagingFindings,
        impression_summary: impressionSummary,
        recommendations,
        pacs_dicom_study_uid: pacsDicomStudyUid,
        attachment_urls: attachmentUrls || '[]',
        reported_by_radiologist_id: req.user!.id,
        status: 'finalized',
      })
      .returning('*');

    await db('radiology_orders')
      .where({ id: req.params.orderId })
      .update({ status: 'reported', updated_at: new Date() });

    res.status(201).json({ success: true, data: report, message: 'Radiology imaging report finalized and signed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
