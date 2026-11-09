import path from 'path';

// ============================================================================
// ASRTAVA MULTI-DEPLOYMENT ARCHITECTURAL CONFIGURATION
// Supports Cloud, On-Premises, and Hybrid Topologies with Perpetual Licensing
// ============================================================================

export type DeploymentModel = 'cloud' | 'on_premises' | 'hybrid';
export type StorageDriver = 'local' | 's3' | 'minio';
export type NotificationDriver = 'gateway' | 'local_queue';
export type DatabaseTopology = 'shared_multitenant' | 'dedicated_instance' | 'local_instance';
export type HybridSyncRole = 'cloud_hub' | 'edge_node' | 'none';

export interface DeploymentConfig {
  deploymentModel: DeploymentModel;
  storage: {
    driver: StorageDriver;
    localBasePath: string;
    s3Bucket?: string;
    s3Region?: string;
    s3Endpoint?: string;
  };
  notifications: {
    driver: NotificationDriver;
    allowDirectExternalEgress: boolean;
  };
  database: {
    topology: DatabaseTopology;
    enforceRowLevelSecurity: boolean;
  };
  hybrid: {
    role: HybridSyncRole;
    cloudSyncUrl?: string;
    syncIntervalSeconds: number;
    maxOfflineQueueSize: number;
    maskPiiBeforeCloudSync: boolean;
  };
  licensing: {
    mode: 'online' | 'offline_cached' | 'air_gapped';
    offlineGraceDays: number;
  };
}

export function loadDeploymentConfig(): DeploymentConfig {
  const model = (process.env.DEPLOYMENT_MODEL || 'cloud').toLowerCase() as DeploymentModel;
  
  if (!['cloud', 'on_premises', 'hybrid'].includes(model)) {
    throw new Error(`Invalid DEPLOYMENT_MODEL '${model}'. Must be 'cloud', 'on_premises', or 'hybrid'.`);
  }

  // Storage Driver Defaults: 'local' for on_premises; 's3' for cloud
  const storageDriver = (
    process.env.STORAGE_DRIVER || (model === 'on_premises' ? 'local' : 's3')
  ).toLowerCase() as StorageDriver;

  const localBasePath = process.env.LOCAL_STORAGE_PATH || path.resolve(process.cwd(), 'data', 'storage');

  // Notification Driver Defaults: 'local_queue' for on_premises without telecom
  const notificationDriver = (
    process.env.NOTIFICATION_DRIVER || (model === 'on_premises' ? 'local_queue' : 'gateway')
  ).toLowerCase() as NotificationDriver;

  // Database Topology Defaults
  const dbTopology = (
    process.env.DATABASE_TOPOLOGY || (model === 'on_premises' ? 'local_instance' : 'shared_multitenant')
  ).toLowerCase() as DatabaseTopology;

  // Hybrid Role
  const hybridRole = (
    model === 'hybrid'
      ? (process.env.HYBRID_SYNC_ROLE || 'edge_node').toLowerCase()
      : 'none'
  ) as HybridSyncRole;

  // Licensing Mode
  let licensingMode: 'online' | 'offline_cached' | 'air_gapped' = 'online';
  if (model === 'on_premises') licensingMode = 'air_gapped';
  if (model === 'hybrid') licensingMode = 'offline_cached';

  const cfg: DeploymentConfig = {
    deploymentModel: model,
    storage: {
      driver: storageDriver,
      localBasePath,
      s3Bucket: process.env.S3_BUCKET || 'asrtava-medical-documents',
      s3Region: process.env.AWS_REGION || 'ap-south-1',
      s3Endpoint: process.env.S3_ENDPOINT
    },
    notifications: {
      driver: notificationDriver,
      allowDirectExternalEgress: model !== 'on_premises'
    },
    database: {
      topology: dbTopology,
      enforceRowLevelSecurity: dbTopology === 'shared_multitenant'
    },
    hybrid: {
      role: hybridRole,
      cloudSyncUrl: process.env.HYBRID_CLOUD_SYNC_URL,
      syncIntervalSeconds: parseInt(process.env.HYBRID_SYNC_INTERVAL || '60', 10),
      maxOfflineQueueSize: parseInt(process.env.HYBRID_MAX_QUEUE || '50000', 10),
      maskPiiBeforeCloudSync: process.env.MASK_PII_CLOUD_SYNC !== 'false'
    },
    licensing: {
      mode: licensingMode,
      offlineGraceDays: parseInt(process.env.OFFLINE_LICENSE_GRACE_DAYS || '90', 10)
    }
  };

  return cfg;
}

export const deploymentConfig = loadDeploymentConfig();

