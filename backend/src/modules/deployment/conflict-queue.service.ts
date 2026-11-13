import crypto from 'crypto';
import { db } from '../../database';
import { logger } from '../../utils/logger';

// ============================================================================
// ASRTAVA P0-05: CLINICAL CONFLICT RECONCILIATION ENGINE
// Strictly prohibits naive Last-Write-Wins (LWW) overwrites for clinical records.
// Halts automated merges upon conflicting concurrent mutations and queues for
// supervisory clinical review with mandatory justification.
// ============================================================================

export type ClinicalConflictStatus =
  | 'REQUIRES_CLINICAL_REVIEW'
  | 'RESOLVED_ACCEPT_LOCAL'
  | 'RESOLVED_ACCEPT_CLOUD'
  | 'RESOLVED_MANUAL_MERGE'
  | 'DISCARDED';

export type ResolutionType = 'ACCEPT_LOCAL' | 'ACCEPT_CLOUD' | 'MANUAL_MERGE';

export interface ClinicalConflictEntry {
  id: string;
  hospitalId: string;
  syncEntryId?: string;
  entityType: string;
  entityId: string;
  localVersion: number;
  cloudVersion: number;
  localPayload: Record<string, any>;
  cloudPayload: Record<string, any>;
  conflictReason: string;
  status: ClinicalConflictStatus;
  resolutionType?: ResolutionType;
  resolutionNotes?: string;
  resolvedPayload?: Record<string, any>;
  resolvedByUserId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class ClinicalConflictQueueService {
  // In-memory cache for air-gapped resilience and test isolation
  private static conflictStore: Map<string, ClinicalConflictEntry> = new Map();

  public static clearState(): void {
    this.conflictStore.clear();
  }

  /**
   * Enqueues a clinical mutation collision into the conflict queue.
   * Persists via durable PostgreSQL transaction with graceful in-memory fallback.
   */
  public static async enqueueConflict(params: {
    hospitalId: string;
    syncEntryId?: string;
    entityType: string;
    entityId: string;
    localVersion: number;
    cloudVersion: number;
    localPayload: Record<string, any>;
    cloudPayload: Record<string, any>;
    conflictReason: string;
  }): Promise<ClinicalConflictEntry> {
    const id = `conf-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const entry: ClinicalConflictEntry = {
      id,
      hospitalId: params.hospitalId,
      syncEntryId: params.syncEntryId,
      entityType: params.entityType,
      entityId: params.entityId,
      localVersion: params.localVersion,
      cloudVersion: params.cloudVersion,
      localPayload: params.localPayload,
      cloudPayload: params.cloudPayload,
      conflictReason: params.conflictReason,
      status: 'REQUIRES_CLINICAL_REVIEW',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Maintain in-memory resilience store
    this.conflictStore.set(id, entry);

    // 2. Persist to PostgreSQL durable storage
    try {
      await db.transaction(async (trx) => {
        await trx('clinical_conflict_queue').insert({
          id: entry.id,
          hospital_id: entry.hospitalId,
          sync_entry_id: entry.syncEntryId || null,
          entity_type: entry.entityType,
          entity_id: entry.entityId,
          local_version: entry.localVersion,
          cloud_version: entry.cloudVersion,
          local_payload: JSON.stringify(entry.localPayload),
          cloud_payload: JSON.stringify(entry.cloudPayload),
          conflict_reason: entry.conflictReason,
          status: entry.status,
          created_at: entry.createdAt,
          updated_at: entry.updatedAt,
        });
      });
      logger.info('[ConflictQueue] Clinical conflict persisted to PostgreSQL', { conflictId: id, entityType: entry.entityType });
    } catch (err: any) {
      logger.warn('[ConflictQueue] PostgreSQL unavailable, falling back to resilient in-memory store', {
        conflictId: id,
        error: err.message,
      });
    }

    return entry;
  }

  /**
   * Lists clinical conflicts requiring review, with optional status/hospital filtering.
   */
  public static async listConflicts(params: {
    hospitalId?: string;
    status?: ClinicalConflictStatus;
  }): Promise<ClinicalConflictEntry[]> {
    // Attempt DB fetch first
    try {
      let query = db('clinical_conflict_queue').select('*');
      if (params.hospitalId) {
        query = query.where({ hospital_id: params.hospitalId });
      }
      if (params.status) {
        query = query.where({ status: params.status });
      }
      const rows = await query.orderBy('created_at', 'desc');
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          hospitalId: r.hospital_id,
          syncEntryId: r.sync_entry_id,
          entityType: r.entity_type,
          entityId: r.entity_id,
          localVersion: Number(r.local_version),
          cloudVersion: Number(r.cloud_version),
          localPayload: typeof r.local_payload === 'string' ? JSON.parse(r.local_payload) : r.local_payload,
          cloudPayload: typeof r.cloud_payload === 'string' ? JSON.parse(r.cloud_payload) : r.cloud_payload,
          conflictReason: r.conflict_reason,
          status: r.status as ClinicalConflictStatus,
          resolutionType: r.resolution_type,
          resolutionNotes: r.resolution_notes,
          resolvedPayload: r.resolved_payload ? (typeof r.resolved_payload === 'string' ? JSON.parse(r.resolved_payload) : r.resolved_payload) : undefined,
          resolvedByUserId: r.resolved_by_user_id,
          resolvedAt: r.resolved_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch {
      // DB offline, fall back to in-memory store
    }

    let results = Array.from(this.conflictStore.values());
    if (params.hospitalId) {
      results = results.filter((c) => c.hospitalId === params.hospitalId);
    }
    if (params.status) {
      results = results.filter((c) => c.status === params.status);
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves a single conflict record by ID.
   */
  public static async getConflictById(id: string, hospitalId?: string): Promise<ClinicalConflictEntry | undefined> {
    try {
      let query = db('clinical_conflict_queue').where({ id });
      if (hospitalId) {
        query = query.andWhere({ hospital_id: hospitalId });
      }
      const r = await query.first();
      if (r) {
        return {
          id: r.id,
          hospitalId: r.hospital_id,
          syncEntryId: r.sync_entry_id,
          entityType: r.entity_type,
          entityId: r.entity_id,
          localVersion: Number(r.local_version),
          cloudVersion: Number(r.cloud_version),
          localPayload: typeof r.local_payload === 'string' ? JSON.parse(r.local_payload) : r.local_payload,
          cloudPayload: typeof r.cloud_payload === 'string' ? JSON.parse(r.cloud_payload) : r.cloud_payload,
          conflictReason: r.conflict_reason,
          status: r.status as ClinicalConflictStatus,
          resolutionType: r.resolution_type,
          resolutionNotes: r.resolution_notes,
          resolvedPayload: r.resolved_payload ? (typeof r.resolved_payload === 'string' ? JSON.parse(r.resolved_payload) : r.resolved_payload) : undefined,
          resolvedByUserId: r.resolved_by_user_id,
          resolvedAt: r.resolved_at,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      }
    } catch {
      // In-memory fallback
    }

    const cached = this.conflictStore.get(id);
    if (cached && (!hospitalId || cached.hospitalId === hospitalId)) {
      return cached;
    }
    return undefined;
  }

  /**
   * Supervisor resolution of a pending clinical conflict.
   * Requires:
   * 1. Resolution Type: ACCEPT_LOCAL, ACCEPT_CLOUD, or MANUAL_MERGE
   * 2. Clinical justification note of at least 15 characters
   * 3. Merged payload if resolutionType is MANUAL_MERGE
   */
  public static async resolveConflict(params: {
    conflictId: string;
    hospitalId: string;
    supervisorUserId: string;
    resolutionType: ResolutionType;
    supervisorJustification: string;
    mergedPayload?: Record<string, any>;
  }): Promise<{ success: boolean; entry: ClinicalConflictEntry; finalPayload: Record<string, any> }> {
    // 1. Mandatory Clinical Governance Validations
    if (!params.supervisorJustification || params.supervisorJustification.trim().length < 15) {
      throw new Error(
        'CLINICAL_SAFETY_VIOLATION: A comprehensive supervisor clinical justification (minimum 15 characters) is mandatory to resolve clinical record collisions.'
      );
    }

    const existing = await this.getConflictById(params.conflictId, params.hospitalId);
    if (!existing) {
      throw new Error(`Conflict record '${params.conflictId}' not found for tenant.`);
    }

    if (existing.status !== 'REQUIRES_CLINICAL_REVIEW') {
      throw new Error(`Conflict '${params.conflictId}' is already resolved with status '${existing.status}'.`);
    }

    let finalPayload: Record<string, any>;
    let targetStatus: ClinicalConflictStatus;

    if (params.resolutionType === 'ACCEPT_LOCAL') {
      targetStatus = 'RESOLVED_ACCEPT_LOCAL';
      finalPayload = { ...existing.localPayload, _resolution: 'ACCEPT_LOCAL' };
    } else if (params.resolutionType === 'ACCEPT_CLOUD') {
      targetStatus = 'RESOLVED_ACCEPT_CLOUD';
      finalPayload = { ...existing.cloudPayload, _resolution: 'ACCEPT_CLOUD' };
    } else if (params.resolutionType === 'MANUAL_MERGE') {
      if (!params.mergedPayload || Object.keys(params.mergedPayload).length === 0) {
        throw new Error('MERGED_PAYLOAD_REQUIRED: Manual merge resolution requires a non-empty merged payload object.');
      }
      targetStatus = 'RESOLVED_MANUAL_MERGE';
      finalPayload = { ...params.mergedPayload, _resolution: 'MANUAL_MERGE' };
    } else {
      throw new Error(`Invalid resolution type '${params.resolutionType}'.`);
    }

    const now = new Date().toISOString();
    existing.status = targetStatus;
    existing.resolutionType = params.resolutionType;
    existing.resolutionNotes = params.supervisorJustification.trim();
    existing.resolvedPayload = finalPayload;
    existing.resolvedByUserId = params.supervisorUserId;
    existing.resolvedAt = now;
    existing.updatedAt = now;

    // 2. Update In-memory cache
    this.conflictStore.set(existing.id, existing);

    // 3. Persist to PostgreSQL durable storage in transaction
    try {
      await db.transaction(async (trx) => {
        await trx('clinical_conflict_queue')
          .where({ id: existing.id, hospital_id: params.hospitalId })
          .update({
            status: targetStatus,
            resolution_type: params.resolutionType,
            resolution_notes: existing.resolutionNotes,
            resolved_payload: JSON.stringify(finalPayload),
            resolved_by_user_id: params.supervisorUserId,
            resolved_at: now,
            updated_at: now,
          });
      });
      logger.info('[ConflictQueue] Clinical conflict successfully resolved in PostgreSQL', {
        conflictId: existing.id,
        status: targetStatus,
      });
    } catch (err: any) {
      logger.warn('[ConflictQueue] PostgreSQL unavailable, resolution saved in in-memory store', {
        conflictId: existing.id,
        error: err.message,
      });
    }

    return {
      success: true,
      entry: existing,
      finalPayload,
    };
  }
}
