import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { loadDeploymentConfig } from '../src/config/deployment.config';
import {
  LocalStorageAdapter,
  S3StorageAdapter,
  StorageAdapterFactory
} from '../src/modules/deployment/storage.adapter';
import {
  HybridSyncService
} from '../src/modules/deployment/hybrid-sync.service';
import {
  OfflineLicenseAdapter
} from '../src/modules/deployment/offline-license.adapter';
import {
  LicenseService
} from '../src/modules/licensing/license.service';

// ============================================================================
// ASRTAVA TEST SUITE: MULTI-DEPLOYMENT ARCHITECTURE & COMPATIBILITY
// Tests Cloud, On-Premises, and Hybrid Topologies, Pluggable Adapters,
// Air-Gapped Operation, Sync Resiliency, and Clinical Invariance
// ============================================================================

test('ASRTAVA Multi-Deployment Architecture & Compatibility Suite', async (t) => {
  HybridSyncService.clearState();
  LicenseService.clearState();

  const HOSP_ONPREM = 'hosp-onprem-rural-01';
  const HOSP_HYBRID = 'hosp-hybrid-city-02';
  const HOSP_CLOUD = 'hosp-cloud-metro-03';

  // --------------------------------------------------------------------------
  // TEST 1: Deployment Configuration Validation (Cloud, On-Prem, Hybrid)
  // --------------------------------------------------------------------------
  await t.test('1. Deployment Configuration: Validates Cloud, On-Premises, and Hybrid profiles', () => {
    // A. Cloud profile
    process.env.DEPLOYMENT_MODEL = 'cloud';
    delete process.env.STORAGE_DRIVER;
    const cloudCfg = loadDeploymentConfig();
    assert.strictEqual(cloudCfg.deploymentModel, 'cloud');
    assert.strictEqual(cloudCfg.storage.driver, 's3');
    assert.strictEqual(cloudCfg.database.enforceRowLevelSecurity, true);

    // B. On-Premises profile
    process.env.DEPLOYMENT_MODEL = 'on_premises';
    delete process.env.STORAGE_DRIVER;
    const onPremCfg = loadDeploymentConfig();
    assert.strictEqual(onPremCfg.deploymentModel, 'on_premises');
    assert.strictEqual(onPremCfg.storage.driver, 'local');
    assert.strictEqual(onPremCfg.notifications.driver, 'local_queue');
    assert.strictEqual(onPremCfg.licensing.mode, 'air_gapped');

    // C. Hybrid profile
    process.env.DEPLOYMENT_MODEL = 'hybrid';
    const hybridCfg = loadDeploymentConfig();
    assert.strictEqual(hybridCfg.deploymentModel, 'hybrid');
    assert.strictEqual(hybridCfg.hybrid.role, 'edge_node');
    assert.strictEqual(hybridCfg.licensing.mode, 'offline_cached');

    // D. Rejection of invalid deployment model
    process.env.DEPLOYMENT_MODEL = 'unsupported_cluster';
    assert.throws(() => loadDeploymentConfig(), /Invalid DEPLOYMENT_MODEL/);

    // Reset back to cloud for subsequent test harnesses
    process.env.DEPLOYMENT_MODEL = 'cloud';
  });

  // --------------------------------------------------------------------------
  // TEST 2: Pluggable Storage Abstraction (Local Disk vs Cloud S3)
  // --------------------------------------------------------------------------
  await t.test('2. Pluggable Storage Adapters: Local Disk vs Cloud S3 interoperability', async () => {
    const testPayload = JSON.stringify({ documentType: 'DischargeSummary', patientUHID: 'UHID-2026-9012' });

    // A. Local Storage Adapter (On-Premises)
    const localAdapter = new LocalStorageAdapter();
    assert.strictEqual(localAdapter.driverName(), 'local_disk_nas');

    const localResult = await localAdapter.saveFile('reports/discharge-9012.json', testPayload, 'application/json');
    assert.ok(localResult.uri.startsWith('local://') || localResult.uri.startsWith('memory://'));
    assert.ok(localResult.hash.length === 64, 'Must compute SHA-256 integrity hash');

    const retrievedLocal = await localAdapter.getFile('reports/discharge-9012.json');
    assert.strictEqual(retrievedLocal.data.toString('utf-8'), testPayload);

    const localUrl = await localAdapter.getAccessUrl('reports/discharge-9012.json');
    assert.ok(localUrl.includes('/api/v1/documents/local/'));

    // B. S3 Storage Adapter (Cloud)
    const s3Adapter = new S3StorageAdapter('asrtava-test-bucket', 'ap-south-1');
    assert.strictEqual(s3Adapter.driverName(), 'cloud_s3_object_storage');

    const s3Result = await s3Adapter.saveFile('lab/cardiac-9012.json', testPayload, 'application/json');
    assert.strictEqual(s3Result.uri, 's3://asrtava-test-bucket/lab/cardiac-9012.json');

    const s3Url = await s3Adapter.getAccessUrl('lab/cardiac-9012.json', 900);
    assert.ok(s3Url.includes('X-Amz-Expires=900'));

    // C. Factory Resolution
    const resolvedLocal = StorageAdapterFactory.getAdapter('local');
    assert.strictEqual(resolvedLocal.driverName(), 'local_disk_nas');
    const resolvedS3 = StorageAdapterFactory.getAdapter('s3');
    assert.strictEqual(resolvedS3.driverName(), 'cloud_s3_object_storage');
  });

  // --------------------------------------------------------------------------
  // TEST 3: On-Premises Air-Gapped Local Clinical Continuity
  // --------------------------------------------------------------------------
  await t.test('3. On-Premises Air-Gapped: Local clinical care functions without internet', async () => {
    // Issue perpetual license for on-prem hospital
    const onPremLic = await LicenseService.issueLicense({
      hospitalId: HOSP_ONPREM,
      edition: 'standard_hospital',
      deploymentModel: 'on_premises',
      authorizedLocations: 1,
      maxBeds: 100
    });
    await LicenseService.activateLicense({
      hospitalId: HOSP_ONPREM,
      activationKey: onPremLic.activation_key
    });

    // Clinical OPD consultation allowed locally
    const opdCheck = LicenseService.checkModuleEntitlement(HOSP_ONPREM, 'module:opd');
    assert.strictEqual(opdCheck.allowed, true);

    // Inpatient IPD bed management allowed locally
    const ipdCheck = LicenseService.checkModuleEntitlement(HOSP_ONPREM, 'module:ipd');
    assert.strictEqual(ipdCheck.allowed, true);

    // Pharmacy FEFO dispensing allowed locally
    const pharmCheck = LicenseService.checkModuleEntitlement(HOSP_ONPREM, 'module:pharmacy');
    assert.strictEqual(pharmCheck.allowed, true);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Air-Gapped Offline License Validation
  // --------------------------------------------------------------------------
  await t.test('4. Air-Gapped Offline License: Validates cryptographic claims token locally', () => {
    // Generate valid offline claims certificate token
    const token = LicenseService.generateClaimsToken({
      licenseId: 'lic-airgap-01',
      licenseNumber: 'ASR-LIC-2026-99999',
      hospitalId: HOSP_ONPREM,
      edition: 'enterprise_multispecialty',
      licenseType: 'perpetual',
      licensedModules: ['module:opd', 'module:ipd', 'module:emergency'],
      deploymentModel: 'on_premises',
      authorizedLocations: 1,
      authorizedInstallations: 1,
      maxBeds: 150,
      maxDoctors: 30,
      issuedAt: new Date().toISOString(),
      issuer: 'ASRTAVA Air-Gap Signer'
    });

    const result = OfflineLicenseAdapter.loadOfflineLicense(token);
    assert.strictEqual(result.valid, true);
    assert.ok(result.license);
    assert.strictEqual(result.license?.hospital_id, HOSP_ONPREM);
    assert.strictEqual(result.license?.license_number, 'ASR-LIC-2026-99999');
    assert.strictEqual(result.license?.status, 'active');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Offline Notification Fallback (Local Outbox Queue)
  // --------------------------------------------------------------------------
  await t.test('5. Offline Notification Queue: Enqueues locally without throwing network egress errors', () => {
    process.env.DEPLOYMENT_MODEL = 'on_premises';
    const cfg = loadDeploymentConfig();
    assert.strictEqual(cfg.notifications.allowDirectExternalEgress, false);
    assert.strictEqual(cfg.notifications.driver, 'local_queue');

    // Simulate queuing an in-hospital emergency broadcast
    const entry = HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_ONPREM,
      entityType: 'emergency_triage',
      entityId: 'trg-001',
      operation: 'INSERT',
      version: 1,
      payload: { code: 'CODE_BLUE_ICU', location: 'Bed-104', initiatedBy: 'Dr. Sharma' }
    });

    assert.ok(entry.id);
    assert.strictEqual(entry.status, 'pending');
    assert.strictEqual(entry.entityType, 'emergency_triage');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Hybrid Edge-to-Cloud Sync Engine Outbox Batching
  // --------------------------------------------------------------------------
  await t.test('6. Hybrid Edge-to-Cloud Sync: Batches local transactions with idempotency keys', async () => {
    HybridSyncService.setNetworkStatus(true);

    // Enqueue an outpatient consultation note
    const outboxItem = HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_HYBRID,
      entityType: 'consultation',
      entityId: 'enc-5001',
      operation: 'INSERT',
      version: 1,
      payload: {
        diagnosis: 'Acute Bronchitis (J20.9)',
        doctorName: 'Dr. Patel',
        rxList: ['Amoxicillin 500mg TDS']
      }
    });

    assert.strictEqual(outboxItem.status, 'pending');
    assert.ok(outboxItem.idempotencyKey.length === 64);

    // Flush sync
    const flushResult = await HybridSyncService.flushPendingSync();
    assert.ok(flushResult.synced >= 1, 'At least 1 item must be synced');
    assert.strictEqual(flushResult.failed, 0);

    const syncedEntry = HybridSyncService.getOutboxQueue(HOSP_HYBRID)[0];
    assert.strictEqual(syncedEntry.status, 'synced');
    assert.ok(syncedEntry.syncedAt);

    // Cloud record must exist
    const cloudRecord = HybridSyncService.getCloudRecord(HOSP_HYBRID, 'consultation', 'enc-5001');
    assert.ok(cloudRecord);
    assert.strictEqual(cloudRecord.diagnosis, 'Acute Bronchitis (J20.9)');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Hybrid Network Outage & Automatic Resumption
  // --------------------------------------------------------------------------
  await t.test('7. Hybrid Outage & Resumption: Enqueues during network failure and flushes upon reconnection', async () => {
    // 1. Drop internet connectivity
    HybridSyncService.setNetworkStatus(false);
    assert.strictEqual(HybridSyncService.getNetworkStatus(), false);

    // 2. Local mutations continue smoothly
    HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_HYBRID,
      entityType: 'bed_allocation',
      entityId: 'bed-401',
      operation: 'UPDATE',
      version: 2,
      payload: { bedNumber: 'ICU-04', patientUHID: 'UHID-8821', status: 'OCCUPIED' }
    });

    // 3. Attempt sync during outage: safely blocked without crashing
    const outageFlush = await HybridSyncService.flushPendingSync();
    assert.strictEqual(outageFlush.offlineBlocked, true);
    assert.strictEqual(outageFlush.synced, 0);

    // 4. Restore connectivity
    HybridSyncService.setNetworkStatus(true);
    assert.strictEqual(HybridSyncService.getNetworkStatus(), true);

    // 5. Automatic flush upon restoration
    const restoredFlush = await HybridSyncService.flushPendingSync();
    assert.strictEqual(restoredFlush.synced, 1);
    assert.strictEqual(restoredFlush.failed, 0);

    const cloudBed = HybridSyncService.getCloudRecord(HOSP_HYBRID, 'bed_allocation', 'bed-401');
    assert.strictEqual(cloudBed.status, 'OCCUPIED');
  });

  // --------------------------------------------------------------------------
  // TEST 8: Conflict Handling (Append-Only EMR & Deterministic LWW)
  // --------------------------------------------------------------------------
  await t.test('8. Conflict Handling: Clinical records append amendments; admin records apply LWW', async () => {
    // A. Clinical record: Consultation amended at local edge
    HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_HYBRID,
      entityType: 'consultation',
      entityId: 'enc-5001',
      operation: 'APPEND',
      version: 2,
      payload: {
        diagnosis: 'Acute Bronchitis with secondary wheeze',
        amendmentReason: 'Patient developed bronchospasm',
        amendedBy: 'Dr. Patel'
      }
    });

    await HybridSyncService.flushPendingSync();

    const cloudConsult = HybridSyncService.getCloudRecord(HOSP_HYBRID, 'consultation', 'enc-5001');
    assert.strictEqual(cloudConsult._version, 2);
    // Preserves amendment lineage! Clinical note is never overwritten or destroyed
    assert.strictEqual(cloudConsult._amendments.length, 2);
    assert.strictEqual(cloudConsult._amendments[0].diagnosis, 'Acute Bronchitis (J20.9)');
    assert.strictEqual(cloudConsult._amendments[1].diagnosis, 'Acute Bronchitis with secondary wheeze');

    // B. Administrative record: Bed allocation Last-Write-Wins (LWW)
    HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_HYBRID,
      entityType: 'bed_allocation',
      entityId: 'bed-401',
      operation: 'UPDATE',
      version: 3,
      payload: { bedNumber: 'ICU-04', status: 'CLEANING' }
    });
    await HybridSyncService.flushPendingSync();

    const cloudBed = HybridSyncService.getCloudRecord(HOSP_HYBRID, 'bed_allocation', 'bed-401');
    assert.strictEqual(cloudBed._version, 3);
    assert.strictEqual(cloudBed.status, 'CLEANING');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Hybrid PII Redaction Policy for Cloud Aggregation
  // --------------------------------------------------------------------------
  await t.test('9. DPDP PII Redaction: Enforces masking of patient identifiers before cloud sync', () => {
    const rawPatient = {
      name: 'Rohan Verma',
      phone: '+919876543210',
      email: 'rohan.verma@example.com',
      nationalId: '1234-5678-9012'
    };

    const outboxEntry = HybridSyncService.enqueueOutbox({
      hospitalId: HOSP_HYBRID,
      entityType: 'patient',
      entityId: 'pt-9901',
      operation: 'INSERT',
      version: 1,
      payload: rawPatient
    });

    // Verify PII is masked in outbox payload before cloud transit
    assert.strictEqual(outboxEntry.payload.phone, '+919******10');
    assert.strictEqual(outboxEntry.payload.email, 'r***@example.com');
    assert.strictEqual(outboxEntry.payload.nationalId, 'XXXX-XXXX-9012');
  });

  // --------------------------------------------------------------------------
  // TEST 10: Multi-Tenant Cloud Isolation vs Single-Tenant On-Premises Mode
  // --------------------------------------------------------------------------
  await t.test('10. Multi-Tenancy: Cloud mode enforces RLS; On-Premises mode operates standalone', () => {
    // Cloud profile requires Row-Level Security
    process.env.DEPLOYMENT_MODEL = 'cloud';
    const cloudCfg = loadDeploymentConfig();
    assert.strictEqual(cloudCfg.database.topology, 'shared_multitenant');
    assert.strictEqual(cloudCfg.database.enforceRowLevelSecurity, true);

    // On-Premises operates local dedicated instance
    process.env.DEPLOYMENT_MODEL = 'on_premises';
    const onPremCfg = loadDeploymentConfig();
    assert.strictEqual(onPremCfg.database.topology, 'local_instance');
    assert.strictEqual(onPremCfg.database.enforceRowLevelSecurity, false);
  });

  // --------------------------------------------------------------------------
  // TEST 11: Emergency Zero-Lockout Invariant Across All 3 Deployments
  // --------------------------------------------------------------------------
  await t.test('11. Emergency Zero-Lockout: Emergency triage permitted under Cloud, On-Prem, and Hybrid', () => {
    // Test under Cloud
    const cloudEmerg = LicenseService.checkModuleEntitlement(HOSP_CLOUD, 'module:emergency');
    assert.strictEqual(cloudEmerg.allowed, true);

    // Test under On-Premises
    const onPremEmerg = LicenseService.checkModuleEntitlement(HOSP_ONPREM, 'module:emergency');
    assert.strictEqual(onPremEmerg.allowed, true);

    // Test under Hybrid
    const hybridEmerg = LicenseService.checkModuleEntitlement(HOSP_HYBRID, 'module:emergency');
    assert.strictEqual(hybridEmerg.allowed, true);
  });

  // --------------------------------------------------------------------------
  // TEST 12: Idempotent Sync Ingestion (Duplicate Transmission Defense)
  // --------------------------------------------------------------------------
  await t.test('12. Idempotency Defense: Replaying identical sync payload is safely ignored', async () => {
    const queue = HybridSyncService.getOutboxQueue(HOSP_HYBRID);
    const firstSyncedItem = queue[0];
    assert.ok(firstSyncedItem);

    // Replay on cloud
    const replayResult = await HybridSyncService.ingestOnCloud(firstSyncedItem);
    assert.strictEqual(replayResult.success, true);
    assert.strictEqual(replayResult.isDuplicate, true, 'Replay must be flagged as duplicate without error');
  });
});
