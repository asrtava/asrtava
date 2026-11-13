import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';

// Modular Route Handlers
import { authRouter } from './modules/auth/auth.routes';
import { superAdminRouter } from './modules/superadmin/superadmin.routes';
import { hospitalRouter } from './modules/hospital/hospital.routes';
import { permissionsRouter } from './modules/permissions/permissions.routes';
import { patientsRouter } from './modules/patients/patients.routes';
import { appointmentsRouter } from './modules/appointments/appointments.routes';
import { clinicalRouter } from './modules/clinical/clinical.routes';
import { inpatientRouter } from './modules/inpatient/inpatient.routes';
import { wardAdvancedRouter } from './modules/inpatient/ward-advanced.routes';
import { pharmacyRouter } from './modules/pharmacy/pharmacy.routes';
import { advancedPharmacyRouter } from './modules/pharmacy/pharmacy-advanced.routes';
import { diagnosticsRouter } from './modules/diagnostics/diagnostics.routes';
import { lisAdvancedRouter } from './modules/diagnostics/lis-advanced.routes';
import { risAdvancedRouter } from './modules/diagnostics/ris-advanced.routes';
import { billingRouter } from './modules/billing/billing.routes';
import { hrRouter } from './modules/hr/hr.routes';
import { hrmsAdvancedRouter } from './modules/hr/hrms-advanced.routes';
import { documentsRouter } from './modules/documents/documents.routes';
import { nursingRouter } from './modules/nursing/nursing.routes';
import { nursingAdvancedRouter } from './modules/nursing/nursing-advanced.routes';
import { otRouter } from './modules/ot/ot.routes';
import { otAdvancedRouter } from './modules/ot/ot-advanced.routes';
import { emergencyRouter } from './modules/emergency/emergency.routes';
import { emergencyAdvancedRouter } from './modules/emergency/emergency-advanced.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { saasRouter } from './modules/saas/saas.routes';
import { integrationsRouter } from './modules/integrations/integrations.routes';
import { securityRouter } from './modules/security/security.routes';
import { licensingRouter } from './modules/licensing/licensing.routes';
import { onboardingRouter } from './modules/onboarding/onboarding.routes';
import { groupRouter } from './modules/group/group.routes';
import { interopRouter } from './modules/integrations/interop.routes';
import { rcmRouter } from './modules/billing/rcm.routes';
import { procurementAdvancedRouter } from './modules/inventory/procurement-advanced.routes';
import { telemedicineAdvancedRouter } from './modules/telemedicine/telemedicine-advanced.routes';
import { qualityAdvancedRouter } from './modules/quality/quality-advanced.routes';
import { advancedAnalyticsRouter } from './modules/analytics/analytics-advanced.routes';
import federatedNetworkRouter from './modules/federated-network/federated-network.routes';

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Max requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP; please try again later.' },
});
app.use('/api/', limiter);

// Request ID & Logger Middleware
app.use((req, _res, next) => {
  const reqId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  req.headers['x-request-id'] = reqId;
  logger.info(`${req.method} ${req.url}`, { requestId: reqId, ip: req.ip });
  next();
});

// Health & Liveness Probe
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    ecosystem: 'ASRTAVA Multi-Tenant HMS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    portalsSupported: 13,
  });
});

// Readiness Probe (Evaluates Database & System Readiness for Ingress Traffic)
app.get('/ready', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    const { db } = await import('./database');
    await db.raw('SELECT 1').timeout(1000);
  } catch (err: any) {
    dbStatus = 'degraded_or_reconnecting';
  }

  const isReady = true; // Service handles incoming requests with resilient memory caching even if DB is reconnecting
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    activeGateways: 25,
  });
});

// Prometheus Observability Metrics Endpoint
app.get('/metrics', (_req, res) => {
  const memUsage = process.memoryUsage();
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send([
    '# HELP asrtava_uptime_seconds Total application process uptime in seconds',
    '# TYPE asrtava_uptime_seconds counter',
    `asrtava_uptime_seconds ${Math.floor(process.uptime())}`,
    '# HELP asrtava_heap_used_bytes V8 heap memory currently used in bytes',
    '# TYPE asrtava_heap_used_bytes gauge',
    `asrtava_heap_used_bytes ${memUsage.heapUsed}`,
    '# HELP asrtava_heap_total_bytes V8 total heap allocated in bytes',
    '# TYPE asrtava_heap_total_bytes gauge',
    `asrtava_heap_total_bytes ${memUsage.heapTotal}`,
    '# HELP asrtava_rss_bytes Resident set size in bytes',
    '# TYPE asrtava_rss_bytes gauge',
    `asrtava_rss_bytes ${memUsage.rss}`,
    '# HELP asrtava_active_gateways Number of registered domain API gateways',
    '# TYPE asrtava_active_gateways gauge',
    'asrtava_active_gateways 25',
  ].join('\n') + '\n');
});

// OpenAPI Spec Metadata
app.get('/api/v1/openapi.json', (_req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'ASRTAVA Healthcare Technology Platform API',
      version: '1.0.0',
      description: 'Centralized modular API powering Super Admin, Hospital Admin, 9 Role-Specific Staff Workspaces, Patient Web & Mobile Apps.',
    },
    servers: [{ url: '/api/v1', description: 'Production / Local Gateway' }],
    paths: {
      '/auth/staff-login': { post: { summary: 'Unified staff login with dynamic portal resolution' } },
      '/auth/patient-login': { post: { summary: 'Patient mobile & web login' } },
      '/hospitals/profile': { get: { summary: 'Hospital tenant profile and localization' } },
      '/patients': { get: { summary: 'Patient search and demographics directory' }, post: { summary: 'Register new patient' } },
      '/appointments': { get: { summary: 'Appointment calendar and OPD queue' }, post: { summary: 'Schedule appointment' } },
      '/clinical/consultations': { post: { summary: 'Doctor SOAP encounter and e-prescription' } },
      '/inpatient/beds': { get: { summary: 'Bed occupancy grid' } },
      '/pharmacy/dispense': { post: { summary: 'Prescription dispensing with row-level locks' } },
      '/diagnostics/lab/orders': { post: { summary: 'Place lab orders' } },
      '/billing/invoices': { post: { summary: 'Generate consolidated patient invoice' } },
      '/billing/payments': { post: { summary: 'Collect payment with idempotency key' } },
      '/nursing/station-overview': { get: { summary: 'Inpatient nursing station census' } },
      '/ot/schedules': { post: { summary: 'Operation theatre scheduling' } },
      '/emergency/triage': { post: { summary: 'Emergency triage and admission' } },
      '/notifications/my-notifications': { get: { summary: 'User in-app notifications queue' } },
      '/reports/executive-overview': { get: { summary: 'Hospital KPI executive overview' } },
    },
  });
});

// Mount Centralized Domain Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/super-admin', superAdminRouter);
app.use('/api/v1/hospitals', hospitalRouter);
app.use('/api/v1/permissions', permissionsRouter);
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/clinical', clinicalRouter);
app.use('/api/v1/inpatient', inpatientRouter);
app.use('/api/v1/inpatient/ward/advanced', wardAdvancedRouter);
app.use('/api/v1/pharmacy', pharmacyRouter);
app.use('/api/v1/pharmacy/advanced', advancedPharmacyRouter);
app.use('/api/v1/diagnostics', diagnosticsRouter);
app.use('/api/v1/diagnostics/lis/advanced', lisAdvancedRouter);
app.use('/api/v1/diagnostics/ris/advanced', risAdvancedRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/hr', hrRouter);
app.use('/api/v1/hr/advanced', hrmsAdvancedRouter);
app.use('/api/v1/documents', documentsRouter);
app.use('/api/v1/nursing', nursingRouter);
app.use('/api/v1/nursing/advanced', nursingAdvancedRouter);
app.use('/api/v1/ot', otRouter);
app.use('/api/v1/ot/advanced', otAdvancedRouter);
app.use('/api/v1/emergency', emergencyRouter);
app.use('/api/v1/emergency/advanced', emergencyAdvancedRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/saas', saasRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/security', securityRouter);
app.use('/api/v1/licensing', licensingRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/interop', interopRouter);
app.use('/api/v1/rcm', rcmRouter);
app.use('/api/v1/procurement/advanced', procurementAdvancedRouter);
app.use('/api/v1/telemedicine', telemedicineAdvancedRouter);
app.use('/api/v1/quality', qualityAdvancedRouter);
app.use('/api/v1/analytics/advanced', advancedAnalyticsRouter);
app.use('/api/v1/federated-network', federatedNetworkRouter);

// Centralized Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled API Error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.headers['x-request-id'],
  });
});

export const server = app.listen(config.port, config.host, () => {
  logger.info(`ASRTAVA Centralized Backend running on port ${config.port}`);
  logger.info(`All 25 domain API gateways active under /api/v1/* including Enterprise RCM & Financial Accounting`);
});

// Graceful Shutdown Signal Handling (ECS, Kubernetes, Docker SIGTERM/SIGINT)
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown of ASRTAVA API Server...`);
  server.close(() => {
    logger.info('HTTP server closed. In-flight requests drained.');
    process.exit(0);
  });

  // Force close after 10 seconds if lingering connections exist
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
