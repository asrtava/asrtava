import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { OnboardingService, ImplementationStage, DataMigrationJobRecord } from './onboarding.service';
import { DynamicHospitalConfigService } from './dynamic-hospital-config.service';
import { authMiddleware, requireSuperAdmin, AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

function getParamId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// ============================================================================
// SUPER ADMIN & IMPLEMENTATION MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Register a new hospital customer organization
 * POST /api/v1/onboarding/customers
 */
router.post('/customers', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customer = await OnboardingService.registerCustomer({
      ...req.body,
      implementationOwnerUserId: req.user?.id
    });
    res.status(201).json({ success: true, message: 'Customer organization registered.', customer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Create an implementation project for a customer hospital
 * POST /api/v1/onboarding/projects
 */
router.post('/projects', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, hospitalId, deploymentModel, targetGoLiveDate } = req.body;
    if (!customerId || !hospitalId || !deploymentModel) {
      res.status(400).json({ success: false, message: 'customerId, hospitalId, and deploymentModel are required.' });
      return;
    }

    const project = await OnboardingService.createImplementationProject({
      customerId,
      hospitalId,
      deploymentModel,
      targetGoLiveDate,
      actorId: req.user?.id,
      actorName: 'Super Administrator'
    });

    res.status(201).json({ success: true, message: 'Implementation project initialized.', project });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Super Admin implementation dashboard metrics
 * GET /api/v1/onboarding/dashboard
 */
router.get('/dashboard', authMiddleware, requireSuperAdmin, (_req: AuthenticatedRequest, res: Response): void => {
  const telemetry = OnboardingService.getSuperAdminImplementationDashboard();
  res.json({ success: true, ...telemetry });
});

/**
 * Transition implementation lifecycle stage
 * POST /api/v1/onboarding/projects/:id/stage
 */
router.post('/projects/:id/stage', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetStage, notes } = req.body;
    const implId = getParamId(req.params.id);

    const updated = await OnboardingService.transitionStage({
      implementationId: implId,
      targetStage: targetStage as ImplementationStage,
      actorId: req.user?.id,
      notes
    });

    res.json({ success: true, message: `Transitioned to stage ${targetStage}.`, project: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Record deployment assessment data
 * POST /api/v1/onboarding/projects/:id/assessment
 */
router.post('/projects/:id/assessment', authMiddleware, requireSuperAdmin, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const updated = OnboardingService.recordDeploymentAssessment({
      implementationId: implId,
      assessmentData: req.body,
      actorId: req.user?.id
    });
    res.json({ success: true, message: 'Deployment assessment recorded.', project: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Add requirement to implementation catalog
 * POST /api/v1/onboarding/projects/:id/requirements
 */
router.post('/projects/:id/requirements', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const reqItem = OnboardingService.addRequirement({
      implementationId: implId,
      ...req.body
    });
    res.status(201).json({ success: true, requirement: reqItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Execute dry-run validation for data migration
 * POST /api/v1/onboarding/projects/:id/migration/dry-run
 */
router.post('/projects/:id/migration/dry-run', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const { hospitalId, category, sourceFormat, fieldMappings, rawRecords } = req.body;

    const job = OnboardingService.createMigrationJob({
      implementationId: implId,
      hospitalId,
      category: category as DataMigrationJobRecord['category'],
      sourceFormat,
      fieldMappings
    });

    const validated = OnboardingService.executeDryRunValidation(job.id, rawRecords || []);
    res.json({ success: true, message: 'Dry-run validation completed.', job: validated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Approve migration job
 * POST /api/v1/onboarding/migration/:jobId/approve
 */
router.post('/migration/:jobId/approve', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const jobId = getParamId(req.params.jobId);
    const approved = OnboardingService.approveMigrationJob(jobId, req.user!.id);
    res.json({ success: true, message: 'Migration job approved.', job: approved });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Execute production migration
 * POST /api/v1/onboarding/migration/:jobId/execute
 */
router.post('/migration/:jobId/execute', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const jobId = getParamId(req.params.jobId);
    const completed = OnboardingService.executeProductionMigration(jobId, req.user!.id);
    res.json({ success: true, message: 'Production migration executed successfully.', job: completed });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Bulk onboard staff accounts
 * POST /api/v1/onboarding/projects/:id/staff/bulk
 */
router.post('/projects/:id/staff/bulk', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const { hospitalId, staffList } = req.body;
    const result = OnboardingService.bulkOnboardStaff({
      implementationId: implId,
      hospitalId,
      staffList,
      actorId: req.user?.id
    });
    res.status(201).json({ success: true, message: 'Staff bulk enrolled successfully.', ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Create training program
 * POST /api/v1/onboarding/projects/:id/training/programs
 */
router.post('/projects/:id/training/programs', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const prog = OnboardingService.createTrainingProgram({
      implementationId: implId,
      ...req.body
    });
    res.status(201).json({ success: true, program: prog });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Record training attendance & certification
 * POST /api/v1/onboarding/training/:programId/attendance
 */
router.post('/training/:programId/attendance', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const progId = getParamId(req.params.programId);
    const record = OnboardingService.recordTrainingAttendance({
      programId: progId,
      ...req.body
    });
    res.json({ success: true, attendance: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Add UAT test case
 * POST /api/v1/onboarding/projects/:id/uat/test-cases
 */
router.post('/projects/:id/uat/test-cases', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const tc = OnboardingService.createUatTestCase({
      implementationId: implId,
      ...req.body
    });
    res.status(201).json({ success: true, testCase: tc });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Record UAT test result
 * POST /api/v1/onboarding/uat/:testCaseId/result
 */
router.post('/uat/:testCaseId/result', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const tcId = getParamId(req.params.testCaseId);
    const { implementationId, status, actualOutcome, defectReference } = req.body;
    const result = OnboardingService.recordUatResult({
      implementationId,
      testCaseId: tcId,
      status,
      actualOutcome,
      executedBy: req.user?.id,
      defectReference
    });
    res.json({ success: true, testCase: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Go-Live readiness checklist report
 * GET /api/v1/onboarding/projects/:id/readiness
 */
router.get('/projects/:id/readiness', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const implId = getParamId(req.params.id);
  const report = OnboardingService.getGoLiveReadinessReport(implId);
  res.json({ success: true, ...report });
});

/**
 * Verify checklist item
 * POST /api/v1/onboarding/projects/:id/checklist/verify
 */
router.post('/projects/:id/checklist/verify', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const { checkItemCode, notes } = req.body;
    const item = OnboardingService.verifyChecklistItem(implId, checkItemCode, req.user?.id, notes);
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Execute production go-live (Dual Sign-Off)
 * POST /api/v1/onboarding/projects/:id/go-live
 */
router.post('/projects/:id/go-live', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const implId = getParamId(req.params.id);
    const { hospitalAdminUserId, asrtavaLeadUserId, notes } = req.body;

    const result = await OnboardingService.executeProductionGoLive({
      implementationId: implId,
      hospitalAdminUserId,
      asrtavaLeadUserId,
      notes
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Create hypercare ticket
 * POST /api/v1/onboarding/projects/:id/hypercare/tickets
 */
router.post('/projects/:id/hypercare/tickets', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const implId = getParamId(req.params.id);
    const { hospitalId, subject, department, severity } = req.body;
    const ticket = OnboardingService.createHypercareTicket({
      implementationId: implId,
      hospitalId,
      subject,
      department,
      severity,
      reportedBy: req.user?.id
    });
    res.status(201).json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Resolve hypercare ticket
 * POST /api/v1/onboarding/hypercare/:ticketId/resolve
 */
router.post('/hypercare/:ticketId/resolve', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const tId = getParamId(req.params.ticketId);
    const { resolutionSummary } = req.body;
    const resolved = OnboardingService.resolveHypercareTicket(tId, resolutionSummary);
    res.json({ success: true, message: 'Ticket resolved.', ticket: resolved });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Handover to standard support
 * POST /api/v1/onboarding/projects/:id/handover
 */
router.post('/projects/:id/handover', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const implId = getParamId(req.params.id);
    const completed = await OnboardingService.handoverToStandardSupport(implId, req.user?.id);
    res.json({ success: true, message: 'Handover complete. Project marked implementation_completed.', project: completed });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================================================
// HOSPITAL ADMIN ONBOARDING PROGRESS ENDPOINT
// ============================================================================

/**
 * Hospital Admin views own onboarding & go-live progress
 * GET /api/v1/onboarding/my-hospital/progress
 */
router.get('/my-hospital/progress', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const hospitalId = (req.hospitalId || req.user?.hospitalId) as string;
  if (!hospitalId) {
    res.status(400).json({ success: false, message: 'Hospital tenant context required.' });
    return;
  }

  const progress = OnboardingService.getHospitalOnboardingProgress(hospitalId);
  res.json({ success: true, ...progress });
});

/**
 * Customer Onboarding Portal Login
 * POST /api/v1/onboarding/portal/login
 * Security Requirement: Project code alone NEVER grants access.
 * Requires verified identity credentials (email & password) and verified project membership.
 */
router.post('/portal/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password, projectCode } = req.body;
  if (!email || !projectCode) {
    res.status(400).json({
      success: false,
      message: 'Both coordinator work email and valid project resumption code/token are required for onboarding authentication.'
    });
    return;
  }

  try {
    const authResult = await OnboardingService.authenticateOnboardingLead({
      email,
      password,
      projectCode
    });

    const tokenPayload = {
      id: authResult.user.id,
      hospitalId: authResult.project.hospital_id,
      userType: 'hospital_admin',
      email: authResult.user.email,
      roles: ['hospital_admin', 'onboarding_lead'],
      activePortal: 'onboarding',
      audience: 'asrtava-onboarding-portal',
      projectCode: authResult.project.project_code,
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: '8h' });

    res.json({
      success: true,
      message: 'Onboarding project authenticated successfully.',
      data: {
        token: accessToken,
        user: {
          id: authResult.user.id,
          email: authResult.user.email,
          customerName: authResult.user.first_name || 'Project Coordinator',
          hospitalName: authResult.hospitalName,
          projectCode: authResult.project.project_code,
          role: authResult.role,
          activePortal: 'onboarding',
        },
        project: authResult.project
      }
    });
  } catch (err: any) {
    res.status(403).json({
      success: false,
      code: 'ONBOARDING_AUTH_FAILED',
      message: err.message
    });
  }
});

// ============================================================================
// DYNAMIC HOSPITAL DISCOVERY & BESPOKE CONFIGURATION ENGINE ENDPOINTS
// ============================================================================

/**
 * Submit or update a discovery questionnaire section
 * POST /api/v1/onboarding/discovery/section
 */
router.post('/discovery/section', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hospitalId, sectionNumber, payload } = req.body;
    const targetHospitalId = hospitalId || req.user?.hospitalId;

    if (!targetHospitalId) {
      res.status(400).json({ success: false, message: 'hospitalId is required.' });
      return;
    }

    const section = await DynamicHospitalConfigService.submitDiscoverySection({
      hospitalId: targetHospitalId,
      sectionNumber: Number(sectionNumber),
      payload: payload || {},
      actorId: req.user?.id
    });

    res.status(201).json({ success: true, message: `Discovery section ${sectionNumber} submitted.`, section });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Retrieve all 12 discovery sections and completeness metrics
 * GET /api/v1/onboarding/discovery/:hospitalId
 */
router.get('/discovery/:hospitalId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = getParamId(req.params.hospitalId);
    const discovery = await DynamicHospitalConfigService.getDiscoverySubmissions(hospitalId);
    res.json({ success: true, ...discovery });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Generate bespoke HMS configuration blueprint from discovery questionnaire
 * POST /api/v1/onboarding/blueprint/:hospitalId/generate
 */
router.post('/blueprint/:hospitalId/generate', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = getParamId(req.params.hospitalId);
    const blueprint = await DynamicHospitalConfigService.generateBlueprint(hospitalId, req.user?.id);
    res.status(201).json({ success: true, message: 'Bespoke HMS Blueprint generated successfully.', blueprint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get current configuration blueprint for hospital
 * GET /api/v1/onboarding/blueprint/:hospitalId
 */
router.get('/blueprint/:hospitalId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = getParamId(req.params.hospitalId);
    const blueprint = await DynamicHospitalConfigService.generateBlueprint(hospitalId, req.user?.id);
    res.json({ success: true, blueprint });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Execute cryptographic sign-off on hospital blueprint
 * POST /api/v1/onboarding/blueprint/:hospitalId/sign
 */
router.post('/blueprint/:hospitalId/sign', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = getParamId(req.params.hospitalId);
    const { role, notes } = req.body;

    if (!role || (role !== 'asrtava_lead' && role !== 'hospital_director')) {
      res.status(400).json({ success: false, message: 'role must be either asrtava_lead or hospital_director.' });
      return;
    }

    const signerName = `${req.user?.firstName || 'Authorized'} ${req.user?.lastName || 'Signer'}`.trim();
    const updated = await DynamicHospitalConfigService.signBlueprint({
      hospitalId,
      role,
      signerId: req.user?.id || 'sys-signer',
      signerName,
      notes
    });

    res.json({ success: true, message: `Cryptographic sign-off executed for ${role}.`, blueprint: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Provision staff accounts with NIST-compliant credentials & generate distribution manifest
 * POST /api/v1/onboarding/staff/provision
 */
router.post('/staff/provision', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { hospitalId, implementationId, staffList } = req.body;
    const targetHospitalId = hospitalId || req.user?.hospitalId;

    if (!targetHospitalId) {
      res.status(400).json({ success: false, message: 'hospitalId is required.' });
      return;
    }
    if (!Array.isArray(staffList) || staffList.length === 0) {
      res.status(400).json({ success: false, message: 'staffList is required and must not be empty.' });
      return;
    }

    const result = await DynamicHospitalConfigService.provisionStaffAccounts({
      hospitalId: targetHospitalId,
      implementationId,
      staffList,
      provisionedByAdminId: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: `Successfully provisioned ${result.accountsCreated} staff accounts.`,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get staff credential manifest for Hospital Admin distribution
 * GET /api/v1/onboarding/staff/manifest/:hospitalId
 */
router.get('/staff/manifest/:hospitalId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const hospitalId = getParamId(req.params.hospitalId);
    const manifest = await DynamicHospitalConfigService.getStaffManifest(hospitalId);
    res.json({ success: true, totalCount: manifest.length, manifest });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export const onboardingRouter = router;

