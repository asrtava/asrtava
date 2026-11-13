import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { deploymentConfig } from '../../config/deployment.config';
import { ClinicalConflictQueueService } from './conflict-queue.service';

// ============================================================================
// ASRTAVA HYBRID DEPLOYMENT DATA SYNCHRONIZATION ENGINE
// Implements Edge-to-Cloud Sync, Outbox Pattern, Offline Resilience,
// P0-05 Manual Clinical Conflict Reconciliation Queue (Replaces naive LWW for clinical data),
// and DPDP PII Masking
// ============================================================================

export type SyncEntityType =
  | 'patient'
  | 'consultation'
  | 'bed_allocation'
  | 'prescription_dispense'
  | 'billing_invoice'
  | 'emergency_triage'
  | 'emar'
  | 'surgical_record'
  | 'vital_signs'
  | 'audit_log';

export interface SyncOutboxEntry {
  id: string;
  hospitalId: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'APPEND';
  version: number;
  payload: Record<string, any>;
  idempotencyKey: string;
  status: 'pending' | 'in_transit' | 'synced' | 'failed' | 'conflict_resolved';
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  syncedAt?: string;
}

export class HybridSyncService {
  private static outboxQueue: SyncOutboxEntry[] = [];
  private static cloudReplicatedStore = new Map<string, Record<string, any>>();
  private static processedIdempotencyKeys = new Set<string>();
  private static isNetworkOnline = true; // Simulates edge-to-cloud link status

  public static clearState(): void {
    this.outboxQueue = [];
    this.cloudReplicatedStore.clear();
    this.processedIdempotencyKeys.clear();
    this.isNetworkOnline = true;
    ClinicalConflictQueueService.clearState();
  }

  public static setNetworkStatus(online: boolean): void {
    this.isNetworkOnline = online;
    logger.info(`[HybridSyncService] Network connectivity transitioned to: ${online ? 'ONLINE' : 'OFFLINE'}`);
  }

  public static getNetworkStatus(): boolean {
    return this.isNetworkOnline;
  }

  // --------------------------------------------------------------------------
  // 1. OUTBOX QUEUING (LOCAL EDGE HOSPITAL)
  // --------------------------------------------------------------------------

  /**
   * Enqueues a local hospital mutation into the local sync outbox.
   * Runs inside local database transaction with zero internet dependence.
   */
  public static enqueueOutbox(params: {
    hospitalId: string;
    entityType: SyncEntityType;
    entityId: string;
    operation: 'INSERT' | 'UPDATE' | 'APPEND';
    version: number;
    payload: Record<string, any>;
  }): SyncOutboxEntry {
    const entryId = `sync-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`${params.hospitalId}:${params.entityType}:${params.entityId}:${params.version}:${params.operation}`)
      .digest('hex');

    // DPDP Act 2023 Compliance: Mask sensitive PII if syncing to cloud
    let payloadToQueue = { ...params.payload };
    if (deploymentConfig.hybrid.maskPiiBeforeCloudSync) {
      payloadToQueue = this.applyPiiMasking(params.entityType, payloadToQueue);
    }

    const entry: SyncOutboxEntry = {
      id: entryId,
      hospitalId: params.hospitalId,
      entityType: params.entityType,
      entityId: params.entityId,
      operation: params.operation,
      version: params.version,
      payload: payloadToQueue,
      idempotencyKey,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString()
    };

    this.outboxQueue.push(entry);
    return entry;
  }

  // --------------------------------------------------------------------------
  // 2. DISPATCH & SYNC EXECUTION
  // --------------------------------------------------------------------------

  /**
   * Flushes pending outbox entries to cloud.
   * If network is down, gracefully leaves items in queue without interrupting clinical care.
   */
  public static async flushPendingSync(): Promise<{
    processed: number;
    synced: number;
    failed: number;
    conflictsQueued: number;
    offlineBlocked: boolean;
  }> {
    if (!this.isNetworkOnline) {
      return {
        processed: 0,
        synced: 0,
        failed: 0,
        conflictsQueued: 0,
        offlineBlocked: true
      };
    }

    const pending = this.outboxQueue.filter((e) => e.status === 'pending' || e.status === 'failed');
    let synced = 0;
    let failed = 0;
    let conflictsQueued = 0;

    for (const item of pending) {
      try {
        const result = await this.ingestOnCloud(item);
        if (result.success) {
          if (result.conflictQueued) {
            item.status = 'conflict_resolved';
            conflictsQueued++;
          } else {
            item.status = 'synced';
            item.syncedAt = new Date().toISOString();
            synced++;
          }
        } else {
          item.status = 'failed';
          item.retryCount++;
          item.errorMessage = result.error;
          failed++;
        }
      } catch (err: any) {
        item.status = 'failed';
        item.retryCount++;
        item.errorMessage = err.message;
        failed++;
      }
    }

    return {
      processed: pending.length,
      synced,
      failed,
      conflictsQueued,
      offlineBlocked: false
    };
  }

  // --------------------------------------------------------------------------
  // 3. CLOUD INGESTION & CONFLICT RESOLUTION (P0-05)
  // --------------------------------------------------------------------------

  /**
   * Ingests a synced record on Cloud:
   * 1. Idempotency Guard (ignores duplicate transmissions)
   * 2. P0-05: Manual Clinical Conflict Reconciliation Queue for conflicting clinical mutations.
   *    Strictly replaces naive LWW for clinical data (consultations, patient records, eMAR, triage).
   * 3. Deterministic Last-Write-Wins (LWW) with version vectors ONLY for administrative/billing entities.
   */
  public static async ingestOnCloud(item: SyncOutboxEntry): Promise<{
    success: boolean;
    error?: string;
    isDuplicate?: boolean;
    conflictQueued?: boolean;
    conflictId?: string;
  }> {
    // 1. Idempotency Check
    if (this.processedIdempotencyKeys.has(item.idempotencyKey)) {
      return { success: true, isDuplicate: true };
    }

    const recordKey = `${item.hospitalId}:${item.entityType}:${item.entityId}`;
    const existing = this.cloudReplicatedStore.get(recordKey);

    const isClinicalEntity = [
      'consultation',
      'emergency_triage',
      'patient',
      'emar',
      'surgical_record',
      'vital_signs'
    ].includes(item.entityType);

    // 2. P0-05: CLINICAL CONFLICT RECONCILIATION GUARD
    if (isClinicalEntity && existing && item.operation !== 'APPEND') {
      // Check if there is a concurrent collision or version divergence
      const hasDivergence =
        existing._version !== item.version ||
        JSON.stringify(existing) !== JSON.stringify(item.payload);

      if (hasDivergence) {
        // Clinical collision detected! DO NOT auto-overwrite with LWW.
        logger.warn('[HybridSync] Concurrent clinical collision detected. Diverting to supervisor conflict queue.', {
          recordKey,
          incomingVersion: item.version,
          existingVersion: existing._version
        });

        const conflictEntry = await ClinicalConflictQueueService.enqueueConflict({
          hospitalId: item.hospitalId,
          syncEntryId: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          localVersion: item.version,
          cloudVersion: existing._version || 1,
          localPayload: item.payload,
          cloudPayload: existing,
          conflictReason: `CONCURRENT_CLINICAL_MODIFICATION: Incoming version ${item.version} conflicts with existing cloud version ${existing._version || 1}. Automated overwrite strictly prohibited.`
        });

        this.processedIdempotencyKeys.add(item.idempotencyKey);
        return { success: true, conflictQueued: true, conflictId: conflictEntry.id };
      }
    }

    // 3. Append-only history for non-colliding clinical encounters
    if (item.entityType === 'consultation' || item.entityType === 'emergency_triage') {
      if (existing) {
        const history = existing._amendments || [existing];
        history.push({
          ...item.payload,
          _version: item.version,
          _syncedAt: new Date().toISOString()
        });
        this.cloudReplicatedStore.set(recordKey, {
          ...item.payload,
          _version: item.version,
          _amendments: history
        });
      } else {
        this.cloudReplicatedStore.set(recordKey, {
          ...item.payload,
          _version: item.version,
          _amendments: [item.payload]
        });
      }
      this.processedIdempotencyKeys.add(item.idempotencyKey);
      return { success: true };
    }

    // 4. Administrative / Operational Records: LWW by Version
    if (existing && existing._version >= item.version) {
      // Incoming version is older or duplicate; ignore without error
      this.processedIdempotencyKeys.add(item.idempotencyKey);
      return { success: true, isDuplicate: true };
    }

    // New or newer version accepted
    this.cloudReplicatedStore.set(recordKey, {
      ...item.payload,
      _version: item.version,
      _syncedAt: new Date().toISOString()
    });

    this.processedIdempotencyKeys.add(item.idempotencyKey);
    return { success: true };
  }

  /**
   * Applies a supervisor-resolved conflict to the cloud store.
   */
  public static applyResolvedConflict(params: {
    hospitalId: string;
    entityType: SyncEntityType;
    entityId: string;
    resolvedPayload: Record<string, any>;
  }): void {
    const recordKey = `${params.hospitalId}:${params.entityType}:${params.entityId}`;
    this.cloudReplicatedStore.set(recordKey, {
      ...params.resolvedPayload,
      _resolvedAt: new Date().toISOString()
    });
    logger.info('[HybridSync] Supervisor-resolved clinical payload applied to cloud store', { recordKey });
  }

  // --------------------------------------------------------------------------
  // 4. DPDP ACT 2023 PII REDACTION POLICY
  // --------------------------------------------------------------------------

  private static applyPiiMasking(entityType: SyncEntityType, payload: Record<string, any>): Record<string, any> {
    const masked = { ...payload };

    if (masked.phone) {
      // Preserves country code and last 2 digits, masks middle
      masked.phone = String(masked.phone).replace(/(\+?\d{2,3})\d{5,7}(\d{2})/, '$1******$2');
    }
    if (masked.email) {
      // Preserves first char and domain
      masked.email = String(masked.email).replace(/(^.).*(@.*$)/, '$1***$2');
    }
    if (masked.nationalId || masked.aadhaarNumber) {
      const val = String(masked.nationalId || masked.aadhaarNumber);
      masked.nationalId = `XXXX-XXXX-${val.slice(-4)}`;
      if (masked.aadhaarNumber) masked.aadhaarNumber = `XXXX-XXXX-${val.slice(-4)}`;
    }

    return masked;
  }

  // --------------------------------------------------------------------------
  // 5. INSPECTION & AUDIT
  // --------------------------------------------------------------------------

  public static getOutboxQueue(hospitalId?: string): SyncOutboxEntry[] {
    if (hospitalId) {
      return this.outboxQueue.filter((e) => e.hospitalId === hospitalId);
    }
    return [...this.outboxQueue];
  }

  public static getCloudRecord(hospitalId: string, entityType: SyncEntityType, entityId: string): any {
    return this.cloudReplicatedStore.get(`${hospitalId}:${entityType}:${entityId}`);
  }
}
