# ASRTAVA — Multi-Deployment Installation Guide

## 1. Prerequisites Across Environments

### Minimum Hardware Sizing
| Deployment Model | Target Scale | CPU Cores | RAM | Storage |
|:---|:---|:---:|:---:|:---:|
| **On-Premises Small Clinic** | Up to 25 beds / 50 OPD/day | 4 vCPU | 8 GB | 100 GB NVMe / SSD |
| **On-Premises General Hospital** | 100-250 beds / 500 OPD/day | 8 vCPU | 16 GB | 500 GB NVMe / SSD |
| **Hybrid Edge Node** | Local emergency & ward node | 4 vCPU | 8 GB | 200 GB SSD |
| **Cloud Production VPC** | Multi-hospital enterprise | Auto-scaling (2-20 pods) | 16-64 GB (RDS) | Amazon S3 / EBS |

### Operating System & Dependencies
- Linux (Ubuntu 22.04 LTS / 24.04 LTS, RHEL 9, Debian 12) or Windows Server 2022
- Docker Engine 24.0+ & Docker Compose v2.20+
- OpenSSL 3.0+

---

## 2. On-Premises Installation (Air-Gapped LAN)

### Step 1: Transfer Installation Bundle to Hospital Server
Transfer the release archive to the hospital host via encrypted USB or local administrative jump host:
```bash
tar -xzvf asrtava-hms-v1.2.0-onprem.tar.gz
cd asrtava-hms
```

### Step 2: Configure Environment Variables
Copy and populate the on-premises environment template:
```bash
cp .env.onprem.example .env
```
Ensure the following variables are configured:
```ini
DEPLOYMENT_MODEL=on_premises
STORAGE_DRIVER=local
NOTIFICATION_DRIVER=local_queue
LOCAL_STORAGE_PATH=/var/asrtava/storage
DB_NAME=asrtava_hospital_local
DB_USER=asrtava_local_admin
DB_PASSWORD=<GENERATE_SECURE_PASSWORD>
JWT_SECRET=<GENERATE_64_CHAR_HEX_SECRET>
```

### Step 3: Place Cryptographic License Claims Certificate
Place the `.asrtalic` license certificate provided by Super Admin into the root directory:
```bash
cp hospital-license.asrtalic ./license.asrtalic
chmod 600 ./license.asrtalic
```

### Step 4: Boot Services with Docker Compose
```bash
docker compose -f docker-compose.onprem.yml up -d
```

### Step 5: Verify Health and Readiness
```bash
curl -f http://localhost:5000/health
curl -f http://localhost:5000/ready
```
Access the Hospital Staff Web Portal at `http://<SERVER_LAN_IP>/`.

---

## 3. Hybrid Edge Node Installation

### Step 1: Deploy Edge Containers
```bash
docker compose -f docker-compose.hybrid.yml up -d
```

### Step 2: Test Cloud Synchronization Link
```bash
docker compose -f docker-compose.hybrid.yml exec edge-backend node -e "
  const { HybridSyncService } = require('./dist/modules/deployment/hybrid-sync.service');
  HybridSyncService.flushPendingSync().then(console.log);
"
```

---

## 4. Cloud Deployment (AWS / Azure / GCP)

For cloud VPC deployments, refer to the Terraform infrastructure modules:
```bash
cd terraform/environments/prod
terraform init
terraform plan
terraform apply
```
Images are published to Amazon ECR and orchestrated via ECS Fargate.

