import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { ClinicalConflictQueueService } from './conflict-queue.service';
import { HybridSyncService } from './hybrid-sync.service';
import { logger } from '../../utils/logger';

export const deploymentRouter = Router();

deploymentRouter.use(authMiddleware);
deploymentRouter.use(tenantMiddleware);

// ----------------------------------------------------------------------------
// 1. List Clinical Conflicts (P0-05)
// ----------------------------------------------------------------------------
deploymentRouter.get(
  '/conflicts',
  requirePermission('read', 'clinical'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const hospitalId = (req.hospitalId || req.user?.hospitalId) || undefined;
      const status = req.query.status as any;

      const conflicts = await ClinicalConflictQueueService.listConflicts({
        hospitalId,
        status: status || 'REQUIRES_CLINICAL_REVIEW',
      });

      res.json({
        success: true,
        data: conflicts,
        count: conflicts.length,
      });
    } catch (err: any) {
      logger.error('Failed to list clinical conflicts', { error: err.message });
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ----------------------------------------------------------------------------
// 2. Get Single Clinical Conflict Details
// ----------------------------------------------------------------------------
deploymentRouter.get(
  '/conflicts/:id',
  requirePermission('read', 'clinical'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const hospitalId = (req.hospitalId || req.user?.hospitalId) || undefined;
      const conflictId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const conflict = await ClinicalConflictQueueService.getConflictById(conflictId, hospitalId);

      if (!conflict) {
        res.status(404).json({ success: false, message: 'Conflict record not found.' });
        return;
      }

      res.json({
        success: true,
        data: conflict,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ----------------------------------------------------------------------------
// 3. Supervisor Conflict Resolution (P0-05)
// ----------------------------------------------------------------------------
deploymentRouter.post(
  '/conflicts/:id/resolve',
  requirePermission('update', 'clinical'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const hospitalId = req.hospitalId || req.user?.hospitalId;
      const supervisorUserId = req.user?.id || (req.user as any)?.userId;
      const conflictId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { resolutionType, supervisorJustification, mergedPayload } = req.body;

      if (!hospitalId || !supervisorUserId) {
        res.status(401).json({ success: false, message: 'User and tenant context required.' });
        return;
      }

      if (!resolutionType || !['ACCEPT_LOCAL', 'ACCEPT_CLOUD', 'MANUAL_MERGE'].includes(resolutionType)) {
        res.status(400).json({
          success: false,
          message: "resolutionType must be 'ACCEPT_LOCAL', 'ACCEPT_CLOUD', or 'MANUAL_MERGE'.",
        });
        return;
      }

      if (!supervisorJustification || supervisorJustification.trim().length < 15) {
        res.status(400).json({
          success: false,
          message: 'supervisorJustification is mandatory and must contain at least 15 characters.',
        });
        return;
      }

      const result = await ClinicalConflictQueueService.resolveConflict({
        conflictId,
        hospitalId,
        supervisorUserId,
        resolutionType,
        supervisorJustification,
        mergedPayload,
      });

      // Apply resolved state to hybrid sync cloud store
      HybridSyncService.applyResolvedConflict({
        hospitalId,
        entityType: result.entry.entityType as any,
        entityId: result.entry.entityId,
        resolvedPayload: result.finalPayload,
      });

      res.json({
        success: true,
        message: `Clinical conflict successfully resolved with strategy '${resolutionType}'.`,
        data: result.entry,
        finalPayload: result.finalPayload,
      });
    } catch (err: any) {
      logger.error('Failed to resolve clinical conflict', { error: err.message });
      res.status(err.message.includes('CLINICAL_SAFETY_VIOLATION') ? 400 : 500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ----------------------------------------------------------------------------
// 4. Hybrid Sync Outbox Status & Manual Flush
// ----------------------------------------------------------------------------
deploymentRouter.get(
  '/sync-status',
  requirePermission('read', 'settings'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const hospitalId = (req.hospitalId || req.user?.hospitalId) || undefined;
      const outbox = HybridSyncService.getOutboxQueue(hospitalId);
      const isOnline = HybridSyncService.getNetworkStatus();

      res.json({
        success: true,
        isNetworkOnline: isOnline,
        totalOutboxEntries: outbox.length,
        pendingCount: outbox.filter((e) => e.status === 'pending').length,
        syncedCount: outbox.filter((e) => e.status === 'synced').length,
        failedCount: outbox.filter((e) => e.status === 'failed').length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

deploymentRouter.post(
  '/sync-flush',
  requirePermission('update', 'settings'),
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const flushResult = await HybridSyncService.flushPendingSync();
      res.json({
        success: true,
        data: flushResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);
