import { Router, Response } from 'express';
import { qualityAdvancedService } from './quality-advanced.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

export const qualityAdvancedRouter = Router();

qualityAdvancedRouter.use(authMiddleware);
qualityAdvancedRouter.use(tenantMiddleware);

// 1. Incidents
qualityAdvancedRouter.post('/incidents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.reportIncident({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      reportedByUserId: (req as any).user?.id || 'usr-nurse-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

qualityAdvancedRouter.post('/incidents/:id/investigate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.assignInvestigation({
      incidentId: req.params.id as string,
      leadInvestigatorUserId: (req as any).user?.id || 'usr-qm-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

qualityAdvancedRouter.post('/incidents/:id/rca', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.performRootCauseAnalysis({
      incidentId: req.params.id as string,
      createdByUserId: (req as any).user?.id || 'usr-qm-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Closed-Loop CAPA
qualityAdvancedRouter.post('/capa', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.createCapaAction({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

qualityAdvancedRouter.post('/capa/:id/complete', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.completeCapaAction(
      req.params.id as string,
      req.body.completionNotes || 'Completed according to standard operating procedure.'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

qualityAdvancedRouter.post('/capa/:id/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.verifyCapaEffectiveness(
      req.params.id as string,
      (req as any).user?.id || 'usr-qm-lead',
      req.body.isEffective !== false
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. Infection Control & HAI Surveillance
qualityAdvancedRouter.post('/hai', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.recordHaiSurveillance({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      investigatedByUserId: (req as any).user?.id || 'usr-icn-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

qualityAdvancedRouter.post('/hand-hygiene', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.recordHandHygieneAudit({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      auditorUserId: (req as any).user?.id || 'usr-auditor-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Medication Safety Events
qualityAdvancedRouter.post('/medication-safety', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.recordMedicationSafetyEvent({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      reportedByUserId: (req as any).user?.id || 'usr-pharm-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Clinical Audits
qualityAdvancedRouter.post('/clinical-audits', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.conductClinicalAudit({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      auditorUserId: (req as any).user?.id || 'usr-auditor-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Patient Complaints
qualityAdvancedRouter.post('/complaints', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.registerPatientComplaint({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

qualityAdvancedRouter.post('/complaints/:id/resolve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.resolvePatientComplaint(
      req.params.id as string,
      req.body.resolutionNotes || 'Grievance reviewed and resolved to patient satisfaction.'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Hospital Risk Register
qualityAdvancedRouter.post('/risks', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.assessHospitalRisk({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      riskOwnerUserId: (req as any).user?.id || 'usr-qm-lead',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Controlled Documents (Policies/SOPs)
qualityAdvancedRouter.post('/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.publishControlledDocument({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      approvedByUserId: (req as any).user?.id || 'usr-med-director',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 9. Mock Inspections & Accreditation Readiness
qualityAdvancedRouter.post('/mock-inspections', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await qualityAdvancedService.conductMockInspection({
      organizationId: (req as any).organizationId || 'org-apex-01',
      hospitalId: req.hospitalId || 'hosp-apex-01',
      leadAssessorUserId: (req as any).user?.id || 'usr-nabh-assessor',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

