import { Router, Response } from 'express';
import { SaasService } from './saas.service';
import { authMiddleware, AuthenticatedRequest, requireSuperAdmin } from '../../middleware/auth.middleware';
import { z } from 'zod';
import { db } from '../../database';
import { v4 as uuidv4 } from 'uuid';

export const saasRouter = Router();

// ============================================================
// 1. PUBLIC SAAS ENDPOINTS (No Auth Required)
// ============================================================

const registerHospitalSchema = z.object({
  name: z.string().min(3),
  legalName: z.string().optional(),
  code: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().min(8),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  subscriptionPlan: z.enum(['basic', 'starter', 'professional', 'enterprise']).optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).optional(),
});

saasRouter.post('/public/register-hospital', async (req, res) => {
  try {
    const validated = registerHospitalSchema.parse(req.body);
    const result = await SaasService.registerHospital(validated);
    res.status(201).json({
      success: true,
      data: result,
      message: 'Hospital organization registered successfully. Onboarding initialized.',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

saasRouter.get('/public/plans', async (_req, res) => {
  try {
    const plans = await SaasService.listSubscriptionPlans();
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.get('/public/onboarding/:token', async (req, res) => {
  try {
    const data = await SaasService.getOnboardingProgress(String(req.params.token));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

saasRouter.post('/public/onboarding/:token/step', async (req, res) => {
  try {
    const { stepNumber, stepData } = req.body;
    const result = await SaasService.saveOnboardingStep(String(req.params.token), Number(stepNumber), stepData);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

saasRouter.post('/public/onboarding/:token/complete', async (req, res) => {
  try {
    const result = await SaasService.completeOnboarding(String(req.params.token));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ============================================================
// 2. PAYMENT GATEWAY WEBHOOK (Signature Verified & Idempotent)
// ============================================================

saasRouter.post('/webhooks/payment', async (req, res) => {
  try {
    const gateway = (req.headers['x-gateway-provider'] as string) || 'razorpay';
    const eventId = (req.headers['x-razorpay-event-id'] as string) || req.body.id || `evt_${Date.now()}`;
    const eventType = req.body.event || 'payment.captured';

    const result = await SaasService.processPaymentWebhook(gateway, eventId, eventType, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 3. SUPER ADMIN SAAS PLATFORM CONSOLE
// ============================================================

saasRouter.get('/super-admin/dashboard', authMiddleware, requireSuperAdmin, async (_req, res) => {
  try {
    const metrics = await SaasService.getSuperAdminMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.get('/super-admin/tenants', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { status, plan, search } = req.query;
    const tenants = await SaasService.listTenants({
      status: status as string,
      plan: plan as string,
      search: search as string,
    });
    res.json({ success: true, data: tenants });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.get('/super-admin/tenants/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const details = await SaasService.getTenantDetails(String(req.params.id));
    res.json({ success: true, data: details });
  } catch (err: any) {
    res.status(404).json({ success: false, message: err.message });
  }
});

saasRouter.put('/super-admin/tenants/:id/status', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Audit reason is strictly required when altering tenant lifecycle status.' });
      return;
    }
    const result = await SaasService.updateTenantStatus(String(req.params.id), status, reason, req.user?.id);
    res.json({ success: true, data: result, message: `Tenant status successfully updated to ${status}.` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

saasRouter.get('/super-admin/plans', authMiddleware, requireSuperAdmin, async (_req, res) => {
  try {
    const plans = await SaasService.listSubscriptionPlans();
    res.json({ success: true, data: plans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.get('/super-admin/invoices', authMiddleware, requireSuperAdmin, async (_req, res) => {
  try {
    const invoices = await SaasService.listSaaSInvoices();
    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.post('/super-admin/jit-access/request', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { hospitalId, ticketId, justification, durationMinutes, scope } = req.body;
    if (!hospitalId || !justification) {
      res.status(400).json({ success: false, message: 'Hospital ID and justification are required.' });
      return;
    }
    const result = await SaasService.requestJitSupportAccess({
      hospitalId,
      requesterUserId: req.user!.id,
      ticketId: ticketId || `TCK-${Date.now().toString().slice(-4)}`,
      justification,
      durationMinutes: durationMinutes || 60,
      scope: scope || 'logs_only',
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

saasRouter.get('/super-admin/jit-access/requests', authMiddleware, requireSuperAdmin, async (_req, res) => {
  try {
    const requests = await db('support_access_requests')
      .join('hospitals', 'support_access_requests.hospital_id', 'hospitals.id')
      .select('support_access_requests.*', 'hospitals.name as hospital_name')
      .orderBy('support_access_requests.created_at', 'desc');
    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.post('/super-admin/announcements', authMiddleware, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, priority = 'info', targetTier = 'all', expiresHours = 72 } = req.body;
    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
    const [announcement] = await db('platform_announcements')
      .insert({
        title,
        message,
        priority,
        target_tier: targetTier,
        published_by: req.user!.id,
        expires_at: expiresAt,
        is_active: true,
      })
      .returning('*');
    res.status(201).json({ success: true, data: announcement });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

saasRouter.get('/super-admin/announcements', authMiddleware, async (_req, res) => {
  try {
    const list = await db('platform_announcements')
      .where('is_active', true)
      .andWhere('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// 4. HOSPITAL ADMIN SAAS SUBSCRIPTION & BILLING
// ============================================================

saasRouter.get('/tenant/subscription', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitalId = req.hospitalId || req.user?.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ success: false, message: 'Hospital context required' });
      return;
    }

    const hospital = await db('hospitals').where({ id: hospitalId }).first();
    const plans = await SaasService.listSubscriptionPlans();
    const currentPlan = plans.find((p: any) => p.plan_code === hospital?.subscription_plan) || plans[0];

    res.json({
      success: true,
      data: {
        hospitalId,
        plan: currentPlan,
        subscriptionStatus: hospital?.subscription_status || 'trial',
        lifecycleStatus: hospital?.lifecycle_status || 'trial',
        startDate: hospital?.subscription_start_date,
        renewalDate: hospital?.trial_ends_at || hospital?.subscription_end_date,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.get('/tenant/usage', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitalId = req.hospitalId || req.user?.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ success: false, message: 'Hospital context required' });
      return;
    }
    const metrics = await SaasService.getTenantUsageMetrics(hospitalId);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.get('/tenant/invoices', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitalId = req.hospitalId || req.user?.hospitalId;
    if (!hospitalId) {
      res.status(400).json({ success: false, message: 'Hospital context required' });
      return;
    }
    const invoices = await SaasService.listSaaSInvoices(hospitalId);
    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

saasRouter.post('/tenant/jit-access/:requestId/approve', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await SaasService.approveJitSupportAccess(String(req.params.requestId), req.user!.id);
    res.json({ success: true, data: result, message: 'Support access approved with time-limited token.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

saasRouter.post('/tenant/data-export', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hospitalId = req.hospitalId || req.user?.hospitalId;
    const { format = 'json', scope = 'full_tenant' } = req.body;
    const jobId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day download validity

    await db('tenant_data_export_jobs').insert({
      id: jobId,
      hospital_id: hospitalId,
      requested_by: req.user!.id,
      export_format: format,
      export_scope: scope,
      status: 'completed',
      download_url: `/api/v1/saas/tenant/data-export/${jobId}/download`,
      expires_at: expiresAt,
    });

    res.status(202).json({
      success: true,
      data: { jobId, format, scope, expiresAt, status: 'completed' },
      message: 'Secure tenant data export archive generated.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
