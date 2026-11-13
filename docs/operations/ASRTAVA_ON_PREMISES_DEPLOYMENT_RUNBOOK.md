# ASRTAVA Customer-Managed On-Premises & Air-Gapped Deployment Runbook

**Document Reference:** `docs/operations/ASRTAVA_ON_PREMISES_DEPLOYMENT_RUNBOOK.md`  
**Target Topology:** Hospital On-Premises Bare-Metal Server / Private VMware vSphere Cluster  
**Connectivity Mode:** Completely Air-Gapped (Zero Public Internet Access Required)  
**Status:** **READY WITH DOCUMENTED PREREQUISITES**

---

## 1. On-Premises Architecture & Zero-Internet Guarantee

The Customer-Managed On-Premises topology enables a hospital to host and run ASRTAVA completely within its local network perimeter:
- **No External Cloud Dependency:** Clinical care, inpatient admissions, surgery scheduling, pharmacy dispensing, billing, and LIS/RIS diagnostic operations function 100% offline.
- **Offline Perpetual License Validation:** Cryptographically signed HMAC-SHA256 license tokens are stored locally and validated by the backend runtime without making outbound HTTP calls to an external activation server.
- **Hardware Binding:** The license payload can bind to local hardware fingerprints (CPU ID, Motherboard UUID, MAC Address) to prevent unauthorized image duplication.
- **Local Relational Database:** Standalone PostgreSQL 16 instance hosted inside the hospital server environment, storing all clinical records with zero external data egress.
- **Local Document Vault:** Medical attachments, scanned ID proofs, and DICOM studies are stored on hospital-managed local network storage (NAS/SAN) via standard POSIX volume mounts.

---

## 2. Minimum Hospital Hardware & Network Prerequisites

### 2.1 Hardware Sizing

| Hospital Scale | CPU Cores | RAM | Storage (RAID 10 SSD/NVMe) | Recommended Topology |
| :--- | :---: | :---: | :---: | :--- |
| **Small / Clinic (< 50 beds)** | 8 Cores | 32 GB | 500 GB NVMe | Single Dedicated Server (Ubuntu 22.04 LTS / RHEL 9) |
| **Medium Hospital (50–250 beds)** | 16 Cores | 64 GB | 2 TB NVMe | Primary + Hot Standby Database Node |
| **Enterprise / Medical College (250+ beds)** | 32 Cores | 128 GB | 6 TB NVMe + SAN | High-Availability VMware Cluster with Shared SAN Storage |

### 2.2 Hospital Local Area Network (LAN) & Firewall Rules

| Protocol | Source | Destination | Port | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| **HTTP/HTTPS** | Hospital Staff Workstations & Wards | ASRTAVA Server IP | `80`, `443` | Hospital Staff Portal, Patient Portal |
| **DICOM / MLLP** | Lab Analyzers, CT/MRI Modalities | ASRTAVA Server IP | `2575`, `104` | HL7 Interface & DICOM Modality Worklist |
| **TCP / SSH** | Authorized Hospital IT Admin Subnet | ASRTAVA Server IP | `22` | Server Administration (Key-based auth only) |
| **Outbound WAN** | ASRTAVA Server IP | Any External Internet | **BLOCKED** | **Explicitly Denied (Air-gapped operation)** |

---

## 3. Step-by-Step On-Premises Installation Procedure

### Step 3.1: Package Ingestion & Image Loading
In an air-gapped environment, transfer the release tarball and Docker image archives via encrypted physical media:
```bash
# 1. Load pre-packaged container images
docker load -i asrtava-backend-v3.0.0.tar.gz
docker load -i asrtava-web-portal-v3.0.0.tar.gz
docker load -i postgres-16-alpine.tar.gz
docker load -i redis-7-alpine.tar.gz

# 2. Extract configuration bundle
tar -xzvf asrtava-onprem-v3.0.0.tar.gz
cd asrtava-onprem/
```

### Step 3.2: Configure Environment & Local Secrets
Create `/opt/asrtava/.env.onprem` with strict permissions (`chmod 600`):
```ini
NODE_ENV=production
DEPLOYMENT_MODEL=on_premises
PORT=5000
DATABASE_URL=postgresql://asrtava_local_admin:SecureLocalPass2026!@postgres:5432/asrtava_hospital_local
REDIS_URL=redis://:LocalRedisPass2026!@redis:6379
JWT_SECRET=local-hospital-high-entropy-jwt-secret-key-min-64-characters-long
LICENSING_HMAC_SECRET=local-hospital-perpetual-licensing-master-hmac-key-2026
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=/var/lib/asrtava/storage
LOG_LEVEL=info
```

### Step 3.3: Launch Stack via On-Premises Orchestrator
```bash
# Start stack using docker-compose.onprem.yml
docker-compose -f docker-compose.onprem.yml up -d
```

### Step 3.4: Offline Database Schema Initialization
```bash
# Execute local database migration script
./scripts/run_migrations.sh
```

### Step 3.5: Offline License Activation
1. Obtain the cryptographically signed license file (`license.asrtava`) provided during customer handover.
2. Inject license into the local database:
   ```bash
   docker exec -i asrtava-onprem-backend node -e "
     const { LicenseService } = require('./dist/modules/licensing/license.service');
     const fs = require('fs');
     const token = fs.readFileSync('/opt/asrtava/license.asrtava', 'utf8').trim();
     LicenseService.activateOfflineLicense(token).then(console.log).catch(console.error);
   "
   ```
3. Verify output returns: `{ success: true, status: 'active', perpetual: true }`.

---

## 4. Local Backup & Offline Disaster Recovery

### Local Automated Backup
Add cron job on the hospital server host:
```bash
0 2 * * * /opt/asrtava/scripts/backup_database.sh >> /var/log/asrtava_backup.log 2>&1
```
Backups are saved to `/var/backups/asrtava/` with 30-day rotation and can be mirrored to an internal hospital backup NAS.

### Full Offline Restore
In the event of hardware failure, install a replacement server, mount the backup volume, and run:
```bash
./scripts/restore_database.sh /var/backups/asrtava/asrtava_backup_LATEST.dump
```
Zero vendor cloud connectivity is needed to restore the hospital to full operational capacity.
