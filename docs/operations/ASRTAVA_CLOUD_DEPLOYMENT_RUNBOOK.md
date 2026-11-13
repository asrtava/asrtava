# ASRTAVA Managed Cloud Deployment Runbook

**Document Reference:** `docs/operations/ASRTAVA_CLOUD_DEPLOYMENT_RUNBOOK.md`  
**Target Architecture:** Multi-Tenant Multi-AZ AWS Cloud Deployment (Region: `ap-south-1` Mumbai, DR: `ap-south-2` Hyderabad)  
**Security Standard:** DPDP Act 2023, HIPAA-aligned, AES-256 Server-Side Encryption, TLS 1.3  
**Status:** **READY WITH DOCUMENTED PREREQUISITES**

---

## 1. Cloud Architecture Overview

In the Managed Cloud topology, ASRTAVA operates as a containerized multi-tenant healthcare SaaS cluster hosted on AWS:
- **Compute:** AWS ECS (Elastic Container Service) on AWS Fargate or Managed EKS Kubernetes.
- **Database:** AWS RDS PostgreSQL 16 Multi-AZ with automatic failover, Read Replicas for analytics/EDW queries, and Row-Level Security (`FORCE RLS`).
- **Cache & Message Queue:** AWS ElastiCache Redis 7 Multi-AZ with in-transit encryption and token authentication.
- **Object Storage:** AWS S3 buckets for PACS DICOM studies, clinical documents, and hospital exports, enforcing SSE-KMS and bucket-level public access blocks.
- **Ingress & Security:** AWS Application Load Balancer (ALB) with AWS WAF (Web Application Firewall), ACM TLS 1.3 certificates, and rate limiting.

---

## 2. Infrastructure Prerequisites

Before running the cloud deployment, provision the following cloud resources:
1. **Virtual Private Cloud (VPC):**
   - 2 Public Subnets (across 2 Availability Zones for ALB).
   - 2 Private Application Subnets (across 2 AZs for ECS/EKS containers).
   - 2 Private Isolated Database Subnets (across 2 AZs for RDS & ElastiCache).
   - 2 NAT Gateways for secure outbound container connectivity without public IP exposure.
2. **Secrets Management:**
   - Store all credentials in AWS Secrets Manager:
     - `DATABASE_URL` (Postgres connection string)
     - `JWT_SECRET` (High-entropy 64-char key)
     - `LICENSING_HMAC_SECRET`
     - `REDIS_URL`
3. **Container Registry:**
   - Amazon ECR repositories: `asrtava/backend` and `asrtava/web-portal`.

---

## 3. Step-by-Step Cloud Deployment Procedure

### Step 3.1: Build and Push Container Images
```bash
# 1. Authenticate Docker to Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build Multi-Stage Production Backend
docker build -t <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/asrtava/backend:v3.0.0 -f backend/Dockerfile backend/

# 3. Build Production Nginx Web Portal
docker build -t <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/asrtava/web-portal:v3.0.0 -f Dockerfile.web-portal .

# 4. Push Images
docker push <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/asrtava/backend:v3.0.0
docker push <aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/asrtava/web-portal:v3.0.0
```

### Step 3.2: Execute Database Migrations
Always run migrations via an ephemeral ECS task or CI/CD runner inside the private VPC:
```bash
# Execute the sequential migration script
./scripts/run_migrations.sh
```
*Verification:* Query `schema_migrations` to confirm all 38 migration files executed without error.

### Step 3.3: Deploy ECS Service Stack via Docker Compose
Using `docker-compose.prod.yml`:
```bash
# Launch production cluster with resource quotas and JSON logging
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Step 3.4: Health & Verification Probe
```bash
# Run production health check script
./scripts/health_check.sh
```
*Expected Output:*
- Backend API (`http://<alb-dns>:5000/health`): `HEALTHY (HTTP 200)`
- Web Portal (`http://<alb-dns>/health`): `HEALTHY (HTTP 200)`

---

## 4. Upgrade & Rollback Procedures

### Zero-Downtime Rolling Upgrade
1. Deploy new container image with tag `:v3.X.X`.
2. ECS updates task definition and starts new container tasks.
3. ALB shifts traffic only after `/ready` probe returns `HTTP 200`.
4. Previous tasks drain and terminate.

### Emergency Rollback
1. If error rate exceeds 0.5% or critical alerts fire within 15 minutes of deployment:
   ```bash
   aws ecs update-service --cluster asrtava-cluster --service asrtava-backend-service --task-definition asrtava-backend:PREVIOUS_REVISION
   ```
2. Database schema migrations do not execute destructive drops, ensuring backward schema compatibility for prior application versions.
