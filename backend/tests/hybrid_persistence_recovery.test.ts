import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { DurableOfflineJournalService } from '../src/modules/deployment/durable-offline-journal.service';

// ============================================================================
// ASRTAVA GATE 3C: DURABLE OFFLINE JOURNAL & HYBRID RECOVERY TEST SUITE
// Verifies:
// 1. AES-256-GCM encrypted persistence at rest.
// 2. Cryptographic SHA-256 tamper-evident integrity checking.
// 3. Resilience to partial writes, power-loss simulations, and line corruption.
// 4. Idempotent replay preventing duplicate central database transactions.
// 5. Strict multi-tenant isolation of journaled operations.
// ============================================================================

describe('ASRTAVA Gate 3C: Durable Offline Journal & Hybrid Recovery Suite', () => {
  const hospitalAlpha = 'hosp-pilot-main-01';
  const hospitalBeta = 'hosp-pilot-beta-02';

  before(() => {
    DurableOfflineJournalService.resetForTesting();
  });

  it('1. Persists clinical transaction with authenticated AES-256-GCM encryption on disk', () => {
    const rawPayload = {
      patientId: 'pat-airgap-101',
      medicationName: 'Meropenem 1g IV',
      dose: '1000mg',
      administeringNurseId: 'nurse-icu-01',
      mewsScore: 4,
    };

    const entry = DurableOfflineJournalService.appendToJournal({
      hospitalId: hospitalAlpha,
      entityType: 'emar',
      entityId: 'emar-airgap-101',
      operation: 'INSERT',
      payload: rawPayload,
    });

    assert.ok(entry.journalId.startsWith('jrn-'));
    assert.strictEqual(entry.syncedToPostgres, false);
    assert.ok(entry.encryptedPayload.length > 32);
    assert.strictEqual(entry.iv.length, 24); // 12 bytes = 24 hex chars
    assert.strictEqual(entry.authTag.length, 32); // 16 bytes = 32 hex chars

    // Decrypt and verify matching plaintext
    const decrypted = DurableOfflineJournalService.decryptPayload(entry.encryptedPayload, entry.iv, entry.authTag);
    assert.strictEqual(decrypted.patientId, rawPayload.patientId);
    assert.strictEqual(decrypted.medicationName, rawPayload.medicationName);
  });

  it('2. Detects and safely isolates corrupted or tampered journal entries without process crash', () => {
    // Append a corrupted line directly to the journal file
    const journalDir = path.resolve(__dirname, '../../data/airgap_journal');
    const journalFile = path.join(journalDir, 'clinical_transactions.journal');

    const corruptedEntry = {
      journalId: 'jrn-tampered-999',
      hospitalId: hospitalAlpha,
      entityType: 'emar',
      entityId: 'emar-tampered',
      operation: 'INSERT',
      encryptedPayload: 'deadbeef1234',
      iv: '000000000000000000000000',
      authTag: '00000000000000000000000000000000',
      timestamp: new Date().toISOString(),
      checksum: 'fakechecksumsha256',
      syncedToPostgres: false,
    };

    fs.appendFileSync(journalFile, JSON.stringify(corruptedEntry) + '\n', 'utf-8');
    fs.appendFileSync(journalFile, 'PARTIAL_TRUNCATED_JSON_LINE_{{broken\n', 'utf-8');

    // Read unsynced entries; corrupted lines must be counted and isolated
    const result = DurableOfflineJournalService.readUnsyncedEntries(hospitalAlpha);
    assert.ok(result.corruptedLineCount >= 2, 'Must isolate both corrupted and partial lines');
    // None of the returned entries should be the tampered one
    assert.ok(!result.entries.some(e => e.journalId === 'jrn-tampered-999'));
  });

  it('3. Replays un-synchronized journal entries into central database with strict idempotency', async () => {
    const appliedKeys = new Set<string>();
    let callCount = 0;

    const mockApply = async (entry: any, payload: any) => {
      callCount++;
      const key = `${entry.hospitalId}:${entry.entityType}:${entry.entityId}`;
      if (appliedKeys.has(key)) {
        throw new Error(`DUPLICATE_APPLICATION_ERROR: Key ${key} was already applied!`);
      }
      appliedKeys.add(key);
      return true;
    };

    // First replay run
    const run1 = await DurableOfflineJournalService.replayToDatabase(mockApply);
    assert.ok(run1.replayedCount >= 1, 'Must replay at least 1 unsynced valid entry');
    assert.strictEqual(run1.failedCount, 0);

    // Second replay run (Idempotency test)
    const run2 = await DurableOfflineJournalService.replayToDatabase(mockApply);
    assert.strictEqual(run2.replayedCount, 0, 'Second run must replay 0 entries because all are already synced');
    assert.strictEqual(run2.failedCount, 0);
  });

  it('4. Enforces strict tenant isolation across offline journal entries (Alpha vs Beta)', () => {
    // Append entry for Hospital Beta
    DurableOfflineJournalService.appendToJournal({
      hospitalId: hospitalBeta,
      entityType: 'consultation',
      entityId: 'con-beta-999',
      operation: 'INSERT',
      payload: { doctorId: 'doc-beta-1', diagnosis: 'Beta tenant confidential' },
    });

    const alphaEntries = DurableOfflineJournalService.readUnsyncedEntries(hospitalAlpha).entries;
    const betaEntries = DurableOfflineJournalService.readUnsyncedEntries(hospitalBeta).entries;

    assert.ok(betaEntries.some(e => e.entityId === 'con-beta-999'));
    assert.ok(!alphaEntries.some(e => e.entityId === 'con-beta-999'), 'Hospital Alpha must never observe Beta journal entries');
  });
});

