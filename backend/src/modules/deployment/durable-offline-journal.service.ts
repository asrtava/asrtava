import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../utils/logger';

// ============================================================================
// ASRTAVA DURABLE OFFLINE AIR-GAP JOURNAL SERVICE
// Provides durable, append-only, disk-backed storage when PostgreSQL RDBMS
// is temporarily unreachable or when operating in an isolated edge air-gap.
// An in-memory cache is NEVER reported as a durable clinical write.
// ============================================================================

export interface JournalEntry {
  journalId: string;
  hospitalId: string;
  entityType: string;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'CONFLICT_ENQUEUE' | 'CONFLICT_RESOLVE';
  payload: Record<string, any>;
  timestamp: string;
  checksum: string;
  syncedToPostgres: boolean;
}

export type PersistenceState =
  | 'DATABASE_COMMITTED'
  | 'LOCAL_JOURNAL_COMMITTED'
  | 'UNPERSISTED_ERROR';

export interface PersistenceResult<T = any> {
  data: T;
  persistenceState: PersistenceState;
  storageTarget: 'POSTGRESQL' | 'AIRGAP_DISK_JOURNAL' | 'NONE';
  warning?: string;
  journalId?: string;
}

export class DurableOfflineJournalService {
  private static journalDir: string = path.resolve(__dirname, '../../../../data/airgap_journal');
  private static journalFile: string = path.join(DurableOfflineJournalService.journalDir, 'clinical_transactions.journal');

  private static ensureJournalDirectory(): void {
    if (!fs.existsSync(this.journalDir)) {
      fs.mkdirSync(this.journalDir, { recursive: true });
    }
  }

  /**
   * Persists a clinical transaction into the local append-only durable journal on disk.
   */
  public static appendToJournal(entry: Omit<JournalEntry, 'journalId' | 'checksum' | 'timestamp' | 'syncedToPostgres'>): JournalEntry {
    this.ensureJournalDirectory();

    const timestamp = new Date().toISOString();
    const journalId = `jrn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const payloadStr = JSON.stringify(entry.payload);
    const checksum = crypto
      .createHash('sha256')
      .update(`${journalId}:${entry.hospitalId}:${entry.entityType}:${entry.entityId}:${payloadStr}:${timestamp}`)
      .digest('hex');

    const fullEntry: JournalEntry = {
      journalId,
      hospitalId: entry.hospitalId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      operation: entry.operation,
      payload: entry.payload,
      timestamp,
      checksum,
      syncedToPostgres: false,
    };

    const line = JSON.stringify(fullEntry) + '\n';
    fs.appendFileSync(this.journalFile, line, { encoding: 'utf-8', mode: 0o600 });

    logger.warn('[DurableJournal] Clinical write persisted to local air-gap disk journal', {
      journalId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      hospitalId: entry.hospitalId,
    });

    return fullEntry;
  }

  /**
   * Reads all un-synchronized entries from the durable disk journal.
   */
  public static readUnsyncedEntries(hospitalId?: string): JournalEntry[] {
    this.ensureJournalDirectory();
    if (!fs.existsSync(this.journalFile)) {
      return [];
    }

    const lines = fs.readFileSync(this.journalFile, 'utf-8').split('\n').filter(Boolean);
    const entries: JournalEntry[] = [];

    for (const line of lines) {
      try {
        const item: JournalEntry = JSON.parse(line);
        if (!item.syncedToPostgres) {
          if (!hospitalId || item.hospitalId === hospitalId) {
            entries.push(item);
          }
        }
      } catch (e) {
        logger.error('[DurableJournal] Failed to parse journal line', { error: (e as any).message });
      }
    }

    return entries;
  }

  /**
   * Marks journal records as synchronized once PostgreSQL is reconnected.
   */
  public static markSynchronized(journalIds: Set<string>): void {
    this.ensureJournalDirectory();
    if (!fs.existsSync(this.journalFile)) return;

    const lines = fs.readFileSync(this.journalFile, 'utf-8').split('\n').filter(Boolean);
    const updatedLines: string[] = [];

    for (const line of lines) {
      try {
        const item: JournalEntry = JSON.parse(line);
        if (journalIds.has(item.journalId)) {
          item.syncedToPostgres = true;
        }
        updatedLines.push(JSON.stringify(item));
      } catch {
        updatedLines.push(line);
      }
    }

    fs.writeFileSync(this.journalFile, updatedLines.join('\n') + '\n', 'utf-8');
  }

  /**
   * Helper that executes a PostgreSQL transaction, and on network failure falls back
   * to appending to the durable disk journal. Explicitly reports the persistence state.
   */
  public static async executeDurableClinicalWrite<T>(
    operationName: string,
    hospitalId: string,
    entityType: string,
    entityId: string,
    payload: Record<string, any>,
    pgTransactionFn: () => Promise<T>
  ): Promise<PersistenceResult<T>> {
    try {
      const result = await pgTransactionFn();
      return {
        data: result,
        persistenceState: 'DATABASE_COMMITTED',
        storageTarget: 'POSTGRESQL',
      };
    } catch (pgError: any) {
      logger.warn(`[DurableStorage] Database write failed for ${operationName}, falling back to durable air-gap disk journal`, {
        error: pgError.message,
        entityType,
        entityId,
      });

      try {
        const journalEntry = this.appendToJournal({
          hospitalId,
          entityType,
          entityId,
          operation: 'INSERT',
          payload,
        });

        return {
          data: payload as unknown as T,
          persistenceState: 'LOCAL_JOURNAL_COMMITTED',
          storageTarget: 'AIRGAP_DISK_JOURNAL',
          journalId: journalEntry.journalId,
          warning: `DURABLE_AIRGAP_JOURNAL_QUEUED: Central database is currently unreachable (${pgError.message}). Write committed to local durable disk journal (${journalEntry.journalId}) and queued for synchronization.`,
        };
      } catch (diskError: any) {
        logger.error(`[DurableStorage] CRITICAL: Both database and local disk journal failed for ${operationName}`, {
          diskError: diskError.message,
        });

        throw new Error(
          `CLINICAL_PERSISTENCE_FAILURE: Write rejected. Central database is unreachable (${pgError.message}) and local durable disk storage failed (${diskError.message}). Volatile in-memory writes are strictly prohibited for clinical safety.`
        );
      }
    }
  }
}

