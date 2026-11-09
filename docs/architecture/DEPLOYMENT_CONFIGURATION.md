# ASRTAVA — Deployment Configuration Reference

## 1. Configuration Taxonomy

ASRTAVA strictly separates configuration categories to ensure clean operational governance:

1. **Application Configuration**: Port numbers, logging levels, timeouts, CORS origins.
2. **Infrastructure Configuration**: Database connection hosts, storage drivers, Redis caches.
3. **Deployment Topology**: `cloud`, `on_premises`, `hybrid`.
4. **Tenant Configuration**: Hospital legal names, GSTIN, local consultation fees, branding.
5. **License Entitlements**: Activated modules, authorized bed limits, doctor caps.

---

## 2. Environment Variables Master Reference

| Variable Name | Permitted Values | Default Value | Relevant Deployments | Description |
|:---|:---|:---:|:---:|:---|
| `DEPLOYMENT_MODEL` | `cloud`, `on_premises`, `hybrid` | `cloud` | **All** | Controls core topology profile and adapter selection. |
| `STORAGE_DRIVER` | `local`, `s3`, `minio` | `s3` (Cloud), `local` (On-Prem) | **All** | Selects storage adapter (`LocalStorageAdapter` vs `S3StorageAdapter`). |
| `LOCAL_STORAGE_PATH` | Valid filesystem path | `./data/storage` | On-Prem, Hybrid | Path for local encrypted document and imaging storage. |
| `NOTIFICATION_DRIVER` | `gateway`, `local_queue` | `gateway` (Cloud), `local_queue` (On-Prem) | **All** | Selects telecom gateway or local air-gapped queue. |
| `DATABASE_TOPOLOGY` | `shared_multitenant`, `dedicated_instance`, `local_instance` | `shared_multitenant` | **All** | Determines whether PostgreSQL RLS is enforced. |
| `HYBRID_SYNC_ROLE` | `cloud_hub`, `edge_node`, `none` | `none` | Hybrid | Role of this node in the hybrid synchronization topology. |
| `HYBRID_CLOUD_SYNC_URL`| Valid HTTPS URL | None | Hybrid | Gateway endpoint for edge sync workers. |
| `HYBRID_SYNC_INTERVAL` | Number (seconds) | `60` | Hybrid | Polling frequency for flushing pending outbox records. |
| `MASK_PII_CLOUD_SYNC` | `true`, `false` | `true` | Hybrid | Enforces DPDP Act 2023 PII masking before cloud replication. |
| `OFFLINE_LICENSE_FILE_PATH`| Valid filesystem path | `/etc/asrtava/license.asrtalic`| On-Prem, Hybrid | Path to cryptographic offline license certificate. |
| `OFFLINE_LICENSE_GRACE_DAYS`| Number (days) | `90` | On-Prem, Hybrid | Grace period for cached license verification. |
| `DB_HOST` | Hostname / IP | `localhost` | **All** | PostgreSQL host address. |
| `DB_PORT` | Port number | `5432` | **All** | PostgreSQL port number. |
| `DB_NAME` | Database name | `asrtava_prod` | **All** | PostgreSQL database name. |
| `DB_USER` | Username | `asrtava_admin` | **All** | PostgreSQL database user. |
| `DB_PASSWORD` | Secure string | Required | **All** | PostgreSQL database password. |
| `JWT_SECRET` | String (min 32 chars) | Required in prod | **All** | High-entropy secret for staff and patient authentication tokens. |

---

## 3. Configuration Validation at Boot

On application startup, `backend/src/config/deployment.config.ts` validates the entire configuration tree. If a required value is missing or an invalid driver combination is provided (e.g. `DEPLOYMENT_MODEL=on_premises` with `STORAGE_DRIVER=s3` on an air-gapped host), the server fails fast with a descriptive startup exception:

```
[FATAL] Invalid deployment configuration: On-premises air-gapped mode cannot resolve remote S3 bucket without internet gateway. Set STORAGE_DRIVER=local.
```

