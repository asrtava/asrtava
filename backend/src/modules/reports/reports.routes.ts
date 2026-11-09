import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest, requireSuperAdmin } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { MetricDefinitionsRegistry } from './services/metric-definitions';
import { ReportBuilderService } from './services/report-builder.service';
import { RoleDashboardsService } from './services/role-dashboards.service';
import { SpecializedAnalyticsService } from './services/specialized-analytics.service';
import { ReportExportService } from './services/report-export.service';
import { ScheduledReportsService } from './services/scheduled-reports.service';
import { DataQualityService } from './services/data-quality.service';
import { ReportQueryRequest } from './types';

export const reportsRouter = Router();

// ============================================================
// 1. PUBLIC / SHARED METRIC CATALOG
// ============================================================
reportsRouter.use(authMiddleware);

// Metric Definitions Catalog
reportsRouter.get('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const category = req.query.category as string | undefined;
  const metrics = MetricDefinitionsRegistry.listMetrics(category);
  res.json({ success: true, data: metrics });
});

// Approved Datasets Schema
reportsRouter.get('/datasets', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const datasets = ReportBuilderService.getApprovedDatasets();
  res.json({ success: true, data: datasets });
});

// ============================================================
// 2. SUPER ADMIN SAAS PLATFORM BI (Platform-Level, Not Tenant-Scoped)
// ============================================================
reportsRouter.get('/analytics/saas', requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await RoleDashboardsService.getSuperAdminSaaSDashboard();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 3. TENANT-SCOPED DASHBOARDS & REPORTING
// ============================================================
reportsRouter.use(tenantMiddleware);

// Role-Based Dashboards
reportsRouter.get('/dashboards/:role', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const role = String(req.params.role).toLowerCase();
  const hospitalId = req.hospitalId!;

  try {
    let dashboardData: any;
    switch (role) {
      case 'owner':
        dashboardData = await RoleDashboardsService.getHospitalOwnerDashboard(hospitalId);
        break;
      case 'admin':
        dashboardData = await RoleDashboardsService.getHospitalAdminDashboard(hospitalId);
        break;
      case 'doctor':
        dashboardData = await RoleDashboardsService.getDoctorDashboard(hospitalId, req.user!.id);
        break;
      case 'nursing':
        dashboardData = await RoleDashboardsService.getNursingDashboard(hospitalId);
        break;
      case 'reception':
        dashboardData = await RoleDashboardsService.getReceptionDashboard(hospitalId);
        break;
      case 'pharmacy':
        dashboardData = await RoleDashboardsService.getPharmacyDashboard(hospitalId);
        break;
      case 'laboratory':
        dashboardData = await RoleDashboardsService.getLaboratoryDashboard(hospitalId);
        break;
      case 'finance':
        dashboardData = await RoleDashboardsService.getFinanceDashboard(hospitalId);
        break;
      case 'hr':
        dashboardData = await RoleDashboardsService.getHRDashboard(hospitalId);
        break;
      default:
        res.status(400).json({ success: false, message: `Unknown dashboard role: ${role}` });
        return;
    }

    res.json({ success: true, role, data: dashboardData });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Legacy Endpoint for Backward Compatibility
reportsRouter.get('/executive-overview', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await RoleDashboardsService.getHospitalOwnerDashboard(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 4. SPECIALIZED ANALYTICS MODULES
// ============================================================
reportsRouter.get('/analytics/patients', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getPatientDemographicsAndRetention(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/analytics/appointments', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getAppointmentOPDAnalytics(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/analytics/ipd', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getIPDBedManagementAnalytics(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/analytics/clinical', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getClinicalDiagnosisAnalytics(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/analytics/pharmacy', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getPharmacyInventoryAnalytics(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/analytics/diagnostics', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getLaboratoryAndRadiologyAnalytics(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/analytics/finance', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await SpecializedAnalyticsService.getFinancialAccountingLedgers(req.hospitalId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 5. CONTROLLED REPORT BUILDER QUERY EXECUTION
// ============================================================
reportsRouter.post('/query', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = req.body as ReportQueryRequest;
    const isSuperAdmin = req.user?.userType === 'super_admin';
    const result = await ReportBuilderService.executeQuery(req.hospitalId!, query, isSuperAdmin);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================================
// 6. ASYNCHRONOUS EXPORTS & DOWNLOADS
// ============================================================
reportsRouter.post('/exports', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { reportDefinitionCode, exportFormat = 'csv', dataRows = [] } = req.body;

  try {
    const job = await ReportExportService.createExportJob(
      req.hospitalId!,
      req.user!.id,
      reportDefinitionCode,
      exportFormat,
      dataRows
    );
    res.status(202).json({ success: true, data: job, message: 'Export job initiated in background.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.get('/exports/:jobId/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const jobId = String(req.params.jobId);
  const status = ReportExportService.getJobStatus(jobId);
  if (!status) {
    res.status(404).json({ success: false, message: 'Export job not found' });
    return;
  }
  res.json({ success: true, data: status });
});

reportsRouter.get('/exports/:jobId/download', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { token } = req.query;
  const jobId = String(req.params.jobId);
  const status = ReportExportService.getJobStatus(jobId);

  if (!status || !token) {
    res.status(403).json({ success: false, message: 'Invalid or expired export download token' });
    return;
  }

  // Generate synthetic sample CSV content
  const sampleCSV = `RecordID,Timestamp,Category,Amount\n1,${new Date().toISOString()},OPD_CONSULT,850.00\n2,${new Date().toISOString()},LAB_CBC,450.00\n`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${jobId}.csv"`);
  res.send(sampleCSV);
});

// ============================================================
// 7. SCHEDULED REPORTING
// ============================================================
reportsRouter.get('/schedules', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = ScheduledReportsService.listSchedules(req.hospitalId!);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

reportsRouter.post('/schedules', requirePermission('create', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const schedule = ScheduledReportsService.createSchedule({
      ...req.body,
      hospitalId: req.hospitalId,
    });
    res.status(201).json({ success: true, data: schedule, message: 'Recurring report schedule created.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

reportsRouter.patch('/schedules/:id/toggle', requirePermission('update', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const scheduleId = String(req.params.id);
    const updated = ScheduledReportsService.toggleSchedule(scheduleId, Boolean(req.body.isActive));
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

// ============================================================
// 8. DATA QUALITY & INTEGRITY AUDITS
// ============================================================
reportsRouter.get('/data-quality/audit', requirePermission('view', 'all'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const audit = await DataQualityService.runDataQualityAudit(req.hospitalId!);
    res.json({ success: true, data: audit });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
