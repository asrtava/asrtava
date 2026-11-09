import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { lisAdvancedService } from './lis-advanced.service';

export const lisAdvancedRouter = Router();

lisAdvancedRouter.use(authMiddleware);
lisAdvancedRouter.use(tenantMiddleware);

// 1. Create Laboratory Department
lisAdvancedRouter.post('/departments', requirePermission('lab.departments.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const dept = await lisAdvancedService.createDepartment({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: dept, message: 'Laboratory department created.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Register Test Parameter
lisAdvancedRouter.post('/parameters', requirePermission('lab.test_catalog.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const param = await lisAdvancedService.registerTestParameter({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: param, message: 'Laboratory test parameter registered.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. Accession Specimen
lisAdvancedRouter.post('/specimens/accession', requirePermission('lab.specimens.collect', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specimen = await lisAdvancedService.accessionSpecimen({
      hospitalId: req.hospitalId!,
      collectedByUserId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: specimen, message: 'Specimen accessioned with barcode.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Reject Specimen
lisAdvancedRouter.post('/specimens/:id/reject', requirePermission('lab.specimens.reject', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const specimenId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason, notes } = req.body;
    const result = await lisAdvancedService.rejectSpecimen(specimenId, req.user!.id, reason, notes);
    res.status(200).json({ success: true, data: result, message: 'Specimen rejected, recollection logged.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Enter Result
lisAdvancedRouter.post('/results', requirePermission('lab.results.enter', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await lisAdvancedService.recordTestResult({
      hospitalId: req.hospitalId!,
      technologistUserId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: result, message: 'Test result entered.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Technologist Validate Result
lisAdvancedRouter.post('/results/:id/validate', requirePermission('lab.results.validate', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const resultId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await lisAdvancedService.validateResultTechnologist(resultId, req.user!.id);
    res.status(200).json({ success: true, data: result, message: 'Result technically validated.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Pathologist Authorize Result
lisAdvancedRouter.post('/results/:id/authorize', requirePermission('lab.results.authorize', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const resultId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await lisAdvancedService.authorizeReportPathologist(resultId, req.user!.id);
    res.status(200).json({ success: true, data: result, message: 'Lab report medically authorized.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Amend Authorized Result
lisAdvancedRouter.post('/results/:id/amend', requirePermission('lab.results.amend', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const resultId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newValue, reason } = req.body;
    const result = await lisAdvancedService.amendAuthorizedResult(resultId, req.user!.id, newValue, reason);
    res.status(200).json({ success: true, data: result, message: 'Authorized result amended with full audit.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Microbiology Culture
lisAdvancedRouter.post('/microbiology/cultures', requirePermission('lab.results.enter', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const culture = await lisAdvancedService.recordMicrobiologyCulture({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: culture, message: 'Microbiology culture findings saved.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. Histopathology Case
lisAdvancedRouter.post('/histopathology/cases', requirePermission('lab.results.authorize', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const histo = await lisAdvancedService.recordHistopathologyCase({
      hospitalId: req.hospitalId!,
      reportingPathologistId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: histo, message: 'Histopathology report authorized.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 11. Internal Quality Control Run
lisAdvancedRouter.post('/qc/measurements', requirePermission('lab.quality_control.manage', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const qc = await lisAdvancedService.recordQCMeasurement({
      hospitalId: req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data: qc, message: 'IQC measurement evaluated against Westgard rules.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

