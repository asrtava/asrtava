import { Router, Request, Response } from 'express';
import { GroupManagementService } from './group.service';

export const groupRouter = Router();

// ----------------------------------------------------------------------------
// 1. Organization Management
// ----------------------------------------------------------------------------

groupRouter.post('/organizations', async (req: Request, res: Response) => {
  try {
    const org = await GroupManagementService.createOrganization(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.get('/organizations', (_req: Request, res: Response) => {
  const orgs = GroupManagementService.listOrganizations();
  res.json({ success: true, data: orgs });
});

groupRouter.get('/organizations/:id', (req: Request, res: Response) => {
  const org = GroupManagementService.getOrganization(String(req.params.id));
  if (!org) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }
  res.json({ success: true, data: org });
});

// ----------------------------------------------------------------------------
// 2. Hierarchy & Tree Management
// ----------------------------------------------------------------------------

groupRouter.post('/hierarchy-nodes', async (req: Request, res: Response) => {
  try {
    const node = await GroupManagementService.createHierarchyNode(req.body);
    res.status(201).json({ success: true, data: node });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.get('/hierarchy-nodes/:orgId', (req: Request, res: Response) => {
  const tree = GroupManagementService.getHierarchyTree(String(req.params.orgId));
  res.json({ success: true, data: tree });
});

groupRouter.put('/hierarchy-nodes/:id/move', (req: Request, res: Response) => {
  try {
    const node = GroupManagementService.moveHierarchyNode(String(req.params.id), req.body.newParentNodeId);
    res.json({ success: true, data: node });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. Centralized Staff Workplace Assignments
// ----------------------------------------------------------------------------

groupRouter.post('/staff-assignments', (req: Request, res: Response) => {
  try {
    const assignment = GroupManagementService.assignStaffWorkplace(req.body);
    res.status(201).json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.get('/staff-assignments/user/:userId', (req: Request, res: Response) => {
  const assignments = GroupManagementService.getStaffWorkplaces(String(req.params.userId));
  res.json({ success: true, data: assignments });
});

// ----------------------------------------------------------------------------
// 4. Scoped Access Evaluation
// ----------------------------------------------------------------------------

groupRouter.post('/check-access', (req: Request, res: Response) => {
  const result = GroupManagementService.checkScopedAccess(req.body);
  res.json({ success: true, data: result });
});

// ----------------------------------------------------------------------------
// 5. Enterprise Patient Identity (EMPI) & Cross-Hospital Links
// ----------------------------------------------------------------------------

groupRouter.post('/patients/match', async (req: Request, res: Response) => {
  try {
    const result = await GroupManagementService.registerOrMatchEnterprisePatient(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.get('/patients/links/:enterprisePatientId', (req: Request, res: Response) => {
  const links = GroupManagementService.getEnterprisePatientLinks(String(req.params.enterprisePatientId));
  res.json({ success: true, data: links });
});

// ----------------------------------------------------------------------------
// 6. Cross-Hospital Clinical Transfers
// ----------------------------------------------------------------------------

groupRouter.post('/transfers', (req: Request, res: Response) => {
  try {
    const transfer = GroupManagementService.initiatePatientTransfer(req.body);
    res.status(201).json({ success: true, data: transfer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.put('/transfers/:id/status', (req: Request, res: Response) => {
  try {
    const updated = GroupManagementService.updateTransferStatus(
      String(req.params.id),
      req.body.status,
      req.body.actorId,
      req.body.auditNotes
    );
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------------------------------
// 7. Multi-Branch Doctor Scheduling (Anti-Collision Engine)
// ----------------------------------------------------------------------------

groupRouter.post('/doctor-schedules', (req: Request, res: Response) => {
  try {
    const schedule = GroupManagementService.createDoctorSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.get('/doctor-schedules/:doctorId', (req: Request, res: Response) => {
  const schedules = GroupManagementService.getDoctorSchedules(String(req.params.doctorId));
  res.json({ success: true, data: schedules });
});

// ----------------------------------------------------------------------------
// 8. Inter-Branch Stock Transfers (Inventory)
// ----------------------------------------------------------------------------

groupRouter.post('/stock-transfers', (req: Request, res: Response) => {
  try {
    const transfer = GroupManagementService.createStockTransfer(req.body);
    res.status(201).json({ success: true, data: transfer });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.put('/stock-transfers/:id/dispatch', (req: Request, res: Response) => {
  try {
    const updated = GroupManagementService.dispatchStockTransfer(String(req.params.id), req.body.dispatchedBy);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.put('/stock-transfers/:id/receive', (req: Request, res: Response) => {
  try {
    const updated = GroupManagementService.receiveStockTransfer(String(req.params.id), req.body.receivedBy);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------------------------------
// 9. Centralized Finance & Inter-Branch Transactions
// ----------------------------------------------------------------------------

groupRouter.post('/financial-transactions', (req: Request, res: Response) => {
  try {
    const tx = GroupManagementService.recordInterBranchFinancialTransaction(req.body);
    res.status(201).json({ success: true, data: tx });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.put('/financial-transactions/:id/settle', (req: Request, res: Response) => {
  try {
    const settled = GroupManagementService.settleFinancialTransaction(String(req.params.id), req.body.authorizedBy);
    res.json({ success: true, data: settled });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.get('/financial-consolidation/:orgId', (req: Request, res: Response) => {
  const result = GroupManagementService.getGroupFinancialConsolidation(String(req.params.orgId));
  res.json({ success: true, data: result });
});

// ----------------------------------------------------------------------------
// 10. Perpetual Licensing & Location Quotas
// ----------------------------------------------------------------------------

groupRouter.post('/licenses/allocate', (req: Request, res: Response) => {
  try {
    const result = GroupManagementService.allocateLicenseBranch(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

groupRouter.post('/licenses/expansion-request', (req: Request, res: Response) => {
  const result = GroupManagementService.requestLicenseExpansion(req.body);
  res.json({ success: true, data: result });
});

// ----------------------------------------------------------------------------
// 11. Centralized Group Dashboard Telemetry
// ----------------------------------------------------------------------------

groupRouter.get('/dashboard/:orgId', (req: Request, res: Response) => {
  const telemetry = GroupManagementService.getGroupDashboardTelemetry(String(req.params.orgId), req.query as any);
  res.json({ success: true, data: telemetry });
});
