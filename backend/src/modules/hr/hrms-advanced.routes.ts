import { Router, Response } from 'express';
import { hrmsAdvancedService } from './hrms-advanced.service';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

export const hrmsAdvancedRouter = Router();

hrmsAdvancedRouter.use(authMiddleware);
hrmsAdvancedRouter.use(tenantMiddleware);

// 1. Workforce Metrics & Analytics
hrmsAdvancedRouter.get('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId;
    const metrics = await hrmsAdvancedService.getWorkforceMetrics(hospitalId!);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Designations
hrmsAdvancedRouter.post('/designations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createDesignation({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.get('/designations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const data = await hrmsAdvancedService.listDesignations(hospitalId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Employee Master Record
hrmsAdvancedRouter.post('/employees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createEmployee({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.get('/employees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const filter = {
      departmentId: req.query.departmentId as string | undefined,
      status: req.query.status as string | undefined,
    };
    const data = await hrmsAdvancedService.listEmployees(hospitalId, filter);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.get('/employees/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.getEmployee(req.params.id as string);
    if (!data) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/employees/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.updateEmployee(req.params.id as string, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 4. Employee Documents & Verification
hrmsAdvancedRouter.post('/employees/:id/documents', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.uploadEmployeeDocument({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      employeeId: req.params.id as string,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/documents/:id/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.verifyEmployeeDocument(
      req.params.id as string,
      req.user?.id || 'admin-verifier',
      req.body.status,
      req.body.notes
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. Account Linking
hrmsAdvancedRouter.post('/employees/:id/link-user', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.linkUserAccount(
      req.params.id as string,
      req.body.userId,
      req.user?.id || 'admin'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 6. Recruitment & ATS
hrmsAdvancedRouter.post('/requisitions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createJobRequisition({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/requisitions/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.approveJobRequisition(
      req.params.id as string,
      req.user?.id || 'admin-approver'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/candidates', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.registerCandidate({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/applications', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createApplication({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/applications/:id/evaluate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.evaluateInterview({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      applicationId: req.params.id as string,
      interviewerUserId: req.user?.id || 'interviewer-01',
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/applications/:id/offer', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.issueJobOffer(
      req.params.id as string,
      req.body.offeredCtc,
      req.body.joiningDate
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/applications/:id/accept-offer', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.acceptJobOffer(req.params.id as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 7. Attendance
hrmsAdvancedRouter.post('/attendance/devices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.registerAttendanceDevice({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/attendance/punch', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.recordAttendancePunch({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/attendance/corrections', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.requestAttendanceCorrection({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/attendance/corrections/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.approveAttendanceCorrection(
      req.params.id as string,
      req.user?.id || 'admin',
      req.body.approved,
      req.body.notes
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 8. Shift Templates & Duty Rosters
hrmsAdvancedRouter.post('/shifts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createShiftTemplate({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/rosters', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.assignDutyRoster({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.get('/rosters', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const filter = {
      date: req.query.date as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
    };
    const data = await hrmsAdvancedService.listDutyRosters(hospitalId, filter);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Leave Management
hrmsAdvancedRouter.post('/leaves/types', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createLeaveType({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/leaves/balances', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.initializeLeaveBalance({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/leaves/apply', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.applyLeave({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/leaves/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.approveLeave(
      req.params.id as string,
      req.user?.id || 'admin',
      req.body.approved,
      req.body.notes
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 10. Payroll & General Ledger
hrmsAdvancedRouter.post('/payroll/salary-structures', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.setupSalaryStructure({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/payroll/batches', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createPayrollBatch(
      req.body.hospitalId || req.hospitalId!,
      req.body.periodMonth
    );
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/payroll/batches/:id/calculate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.calculateEmployeePayslip(
      req.params.id as string,
      req.body.employeeId,
      req.body.daysWorked || {}
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/payroll/batches/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.approvePayrollBatch(
      req.params.id as string,
      req.user?.id || 'finance-approver'
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/payroll/batches/:id/post-gl', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.postPayrollToGeneralLedger(req.params.id as string);
    res.json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes('Conflict') ? 409 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
});

// 11. Credentials & Alerts
hrmsAdvancedRouter.post('/credentials', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.recordCredential({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/credentials/:id/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.verifyCredential(
      req.params.id as string,
      req.user?.id || 'admin',
      req.body.approved
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.get('/credentials/expiring', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = (req.query.hospitalId as string) || req.hospitalId!;
    const daysAhead = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const data = await hrmsAdvancedService.getExpiringCredentials(hospitalId, daysAhead);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Training & Certifications
hrmsAdvancedRouter.post('/training/programs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.createTrainingProgram({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/training/attendees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.recordTrainingCompletion({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 13. Employee Separation
hrmsAdvancedRouter.post('/separations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.initiateSeparation({
      hospitalId: req.body.hospitalId || req.hospitalId!,
      ...req.body,
    });
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.patch('/separations/:id/clearance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.updateSeparationClearance(
      req.params.id as string,
      req.body
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

hrmsAdvancedRouter.post('/separations/:id/finalize', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await hrmsAdvancedService.finalizeSeparationAndRevokeAccess(req.params.id as string);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

