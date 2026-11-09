import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { risAdvancedService } from './ris-advanced.service';

export const risAdvancedRouter = Router();

risAdvancedRouter.use(authMiddleware);
risAdvancedRouter.use(tenantMiddleware);

// 1. Modality Registration
risAdvancedRouter.post('/modalities', requirePermission('radiology.equipment.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mod = await risAdvancedService.registerModality({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: mod, message: 'Modality station registered.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Procedure Master Registration
risAdvancedRouter.post('/procedures', requirePermission('radiology.orders.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const proc = await risAdvancedService.registerProcedure({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: proc, message: 'Radiology procedure master created.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. Create Imaging Order
risAdvancedRouter.post('/orders', requirePermission('radiology.orders.create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const order = await risAdvancedService.createImagingOrder({
      hospitalId: req.hospitalId!,
      orderingDoctorId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: order, message: 'Radiology imaging order submitted.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Modality Appointment Scheduling
risAdvancedRouter.post('/appointments', requirePermission('radiology.scheduling.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const appt = await risAdvancedService.scheduleAppointment({
      hospitalId: req.hospitalId!,
      radiographerUserId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: appt, message: 'Scanner appointment slot reserved.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Pre-Procedure Screening
risAdvancedRouter.post('/screenings', requirePermission('radiology.patient_screening.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const screening = await risAdvancedService.recordPatientScreening({
      hospitalId: req.hospitalId!,
      screenedByUserId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: screening, message: 'Pre-procedure screening checklist documented.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Index PACS Study Metadata
risAdvancedRouter.post('/pacs/studies', requirePermission('radiology.studies.retrieve', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const study = await risAdvancedService.indexPACSStudy({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: study, message: 'PACS study metadata indexed.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Structured Radiology Report
risAdvancedRouter.post('/reports', requirePermission('radiology.reports.create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await risAdvancedService.createRadiologyReport({
      hospitalId: req.hospitalId!,
      reportingRadiologistId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: result, message: 'Radiology report created.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Authorize Radiology Report
risAdvancedRouter.post('/reports/:id/authorize', requirePermission('radiology.reports.authorize', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const report = await risAdvancedService.authorizeReport(reportId, req.user!.id);
    res.status(200).json({ success: true, data: report, message: 'Report authorized with digital signature seal.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Amend Radiology Report
risAdvancedRouter.post('/reports/:id/amend', requirePermission('radiology.reports.amend', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { addendumNotes } = req.body;
    const report = await risAdvancedService.amendReport(reportId, req.user!.id, addendumNotes);
    res.status(200).json({ success: true, data: report, message: 'Report addendum filed.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. Contrast Media Administration
risAdvancedRouter.post('/contrast', requirePermission('radiology.orders.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const contrast = await risAdvancedService.recordContrastAdministration({
      hospitalId: req.hospitalId!,
      administeredByUserId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: contrast, message: 'Contrast media injection documented.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

