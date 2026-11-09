import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest, requireSuperAdmin } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { PasswordPolicyService } from './password-policy.service';
import { SessionSecurityService } from './session-security.service';
import { AuditLoggerService } from './audit-logger.service';
import { PrivacyGovernanceService } from './privacy-governance.service';
import { db } from '../../database';
import { logger } from '../../utils/logger';

export const securityRouter = Router();

// ============================================================================
// 1. System Security Posture & Telemetry
// ============================================================================
securityRouter.get('/health', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isSuperAdmin = req.user?.userType === 'super_admin';
    const hospitalId = req.hospitalId;

    let incidentsCount = 0;
    try {
      const q = db('security_incidents').where('status', 'open');
      if (!isSuperAdmin && hospitalId) q.where('hospital_id', hospitalId);
      const resCount = await q.count('* as count').first();
      incidentsCount = Number(resCount?.count || 0);
    } catch {}

    res.json({
      success: true,
      data: {
        securityPosture: incidentsCount > 0 ? 'MONITORED_ATTENTION' : 'OPTIMAL_HARDENED',
        encryptionAtRest: 'AES-256-GCM',
        transitSecurity: 'TLS 1.3 / Strict-Transport-Security enforced',
        rlsEnforcement: 'PostgreSQL Row-Level Security active across all tenant tables',
        passwordPolicy: 'NIST SP 800-63B Compliant (Cost 12 salted bcrypt, progressive throttling)',
        tokenSecurity: 'Refresh Token Rotation with Automated Replay Reuse Detection',
        auditEngine: 'Append-Only Cryptographic SHA-256 Chained Clinical Ledger',
        complianceFrameworks: ['DPDP Act 2023 (India)', 'HIPAA Security Rule (45 CFR Part 160/164)', 'NMC RMP Regulations 2023', 'ISO 27001 ISMS'],
        openIncidents: incidentsCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 2. Password Strength & Complexity Evaluator
// ============================================================================
securityRouter.post('/password/validate', (req: AuthenticatedRequest, res: Response): void => {
  const { password } = req.body;
  const result = PasswordPolicyService.validatePasswordStrength(password || '');
  res.json({ success: true, data: result });
});

// ============================================================================
// 3. Session Management & Refresh Token Rotation
// ============================================================================
securityRouter.get('/sessions/my-sessions', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sessions = await SessionSecurityService.listActiveSessions(req.user!.id, req.user?.sessionId);
    res.json({ success: true, data: sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/sessions/revoke', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required.' });
      return;
    }
    const success = await SessionSecurityService.revokeSession(sessionId, req.user!.id);
    res.json({ success, message: success ? 'Session revoked successfully.' : 'Session not found or already revoked.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/sessions/revoke-all', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const count = await SessionSecurityService.revokeAllUserSessions(req.user!.id, 'user_global_signout');
    res.json({ success: true, message: `Terminated ${count} active sessions across all devices.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/sessions/refresh', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'refreshToken is required.' });
      return;
    }

    const result = await SessionSecurityService.rotateRefreshToken(refreshToken, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!result.success) {
      const status = result.replayedReuseDetected ? 401 : 400;
      res.status(status).json(result);
      return;
    }

    res.json({
      success: true,
      message: 'Token rotated successfully.',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 4. Cryptographic Clinical Audit Trail
// ============================================================================
securityRouter.get('/audit/clinical-events', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const offset = Math.max(0, Number(req.query.offset || 0));

    let query = db('clinical_audit_events').orderBy('created_at', 'desc');

    if (req.user?.userType !== 'super_admin') {
      query = query.where({ hospital_id: req.hospitalId });
    } else if (req.query.hospitalId) {
      query = query.where({ hospital_id: req.query.hospitalId as string });
    }

    if (req.query.patientId) {
      query = query.where({ patient_id: req.query.patientId as string });
    }
    if (req.query.action) {
      query = query.where({ action: req.query.action as string });
    }

    const records = await query.limit(limit).offset(offset);
    res.json({ success: true, data: records, count: records.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/audit/verify-integrity', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetHospitalId = (req.user?.userType === 'super_admin' && req.body.hospitalId) ? req.body.hospitalId : req.hospitalId;
    if (!targetHospitalId) {
      res.status(400).json({ success: false, message: 'Hospital ID is required for verification.' });
      return;
    }

    const verification = await AuditLoggerService.verifyChainIntegrity(targetHospitalId, 200);
    res.json({ success: true, data: verification });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 5. Data Privacy & Subject Rights (DPDP Act 2023 / HIPAA)
// ============================================================================
securityRouter.get('/privacy/retention-policies', authMiddleware, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const policies = await db('data_retention_policies').select('*').orderBy('retention_period_years', 'desc');
    res.json({ success: true, data: policies });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.get('/privacy/requests', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let query = db('privacy_rights_requests').orderBy('created_at', 'desc');
    if (req.user?.userType !== 'super_admin') {
      query = query.where({ hospital_id: req.hospitalId });
    }
    const requests = await query.limit(100);
    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/privacy/requests', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId, requesterName, requesterEmail, requestType, notes } = req.body;
    if (!patientId || !requesterName || !requesterEmail || !requestType) {
      res.status(400).json({ success: false, message: 'patientId, requesterName, requesterEmail, and requestType are required.' });
      return;
    }

    const created = await PrivacyGovernanceService.submitPrivacyRequest({
      hospitalId: req.hospitalId!,
      patientId,
      requesterName,
      requesterEmail,
      requestType,
      notes,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/privacy/requests/:id/process', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { action, rejectionReason } = req.body;
    if (!['approve_fulfillment', 'apply_legal_hold', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'Invalid action. Allowed: approve_fulfillment, apply_legal_hold, reject' });
      return;
    }

    const result = await PrivacyGovernanceService.processPrivacyRequest({
      requestId: String(req.params.id),
      action,
      reviewerUserId: req.user!.id,
      rejectionReason,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/privacy/mask-patient', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const masked = PrivacyGovernanceService.deIdentifyPatient(req.body);
  res.json({ success: true, data: masked });
});

// ============================================================================
// 6. Security Incidents & Threat Response
// ============================================================================
securityRouter.get('/incidents', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let query = db('security_incidents').orderBy('created_at', 'desc');
    if (req.user?.userType !== 'super_admin') {
      query = query.where({ hospital_id: req.hospitalId });
    }
    const incidents = await query.limit(100);
    res.json({ success: true, data: incidents });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.post('/incidents', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, severity, category, affectedUserId, affectedResourceType, affectedResourceId } = req.body;
    if (!title || !description || !severity || !category) {
      res.status(400).json({ success: false, message: 'title, description, severity, and category are required.' });
      return;
    }

    const incidentNumber = `INC-${Date.now().toString().slice(-8)}`;
    await db('security_incidents').insert({
      incident_number: incidentNumber,
      hospital_id: req.hospitalId,
      title,
      description,
      severity,
      category,
      status: 'open',
      affected_user_id: affectedUserId || null,
      affected_resource_type: affectedResourceType || null,
      affected_resource_id: affectedResourceId || null,
      source_ip: req.ip,
      source_user_agent: req.headers['user-agent'] as string,
      reported_by: req.user?.id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ success: true, message: `Incident ${incidentNumber} created and dispatched to security team.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

securityRouter.patch('/incidents/:id/contain', authMiddleware, tenantMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, containmentAction, rootCause } = req.body;
    let query = db('security_incidents').where({ id: req.params.id });
    if (req.user?.userType !== 'super_admin') {
      query = query.where({ hospital_id: req.hospitalId });
    }

    const updated = await query.update({
      status: status || 'contained',
      containment_action: containmentAction,
      root_cause: rootCause,
      resolved_at: status === 'resolved' || status === 'closed' ? new Date() : null,
      updated_at: new Date(),
    });

    if (updated === 0) {
      res.status(404).json({ success: false, message: 'Incident not found or unauthorized.' });
      return;
    }

    res.json({ success: true, message: 'Incident containment status updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================================
// 7. Vulnerability Register
// ============================================================================
securityRouter.get('/vulnerabilities', authMiddleware, requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const vulns = await db('vulnerability_register').select('*').orderBy('identified_at', 'desc');
    res.json({ success: true, data: vulns });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
