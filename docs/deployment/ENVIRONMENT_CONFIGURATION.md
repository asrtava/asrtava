# ASRTAVA Multi-Environment Separation & Configuration Policy

## 1. Environment Segmentation

ASRTAVA strictly enforces three completely decoupled deployment environments:

```
+-----------------------------------------------------------------------------------+
| 1. DEVELOPMENT ENVIRONMENT                                                        |
|  - Host: Local Developer Workstations & Docker Compose                            |
|  - Data: 100% Synthetic Patient Fixtures & Automated Test Seed Data               |
|  - Credentials: Self-signed keys, mock payment sandbox credentials                |
|  - Safety Guarantee: Zero network access to staging or production databases      |
+-----------------------------------------------------------------------------------+
                                        | (Git PR Merge to 'main')
+-----------------------------------------------------------------------------------+
| 2. STAGING ENVIRONMENT (staging.asrtava.com)                                      |
|  - Host: Dedicated AWS ECS Fargate Staging Cluster (ap-south-1)                    |
|  - Database: Isolated RDS PostgreSQL Staging Instance                             |
|  - Data: High-volume synthetic load profiles (Zero real patient PII)              |
|  - Purpose: Full end-to-end integration rehearsal, migration testing, UAT         |
+-----------------------------------------------------------------------------------+
                                        | (Controlled Tag Release 'v*.*.*' + Signoff)
+-----------------------------------------------------------------------------------+
| 3. PRODUCTION ENVIRONMENT (app.asrtava.com)                                       |
|  - Host: Multi-AZ AWS ECS Fargate Production Cluster                              |
|  - Database: Multi-AZ Aurora PostgreSQL Serverless v2 + Read Replica              |
|  - Security: Restricted IAM, KMS encryption, automated WORM Object Lock           |
|  - Access: Zero developer standing credentials; automated CI/CD deployments only |
+-----------------------------------------------------------------------------------+
```

---

## 2. Environment Matrix Comparison

| Property | Development | Staging | Production |
| :--- | :--- | :--- | :--- |
| **Domain** | `localhost:5173`, `localhost:5000` | `staging.asrtava.com` | `app.asrtava.com`, `api.asrtava.com` |
| **Database Instance** | Local Docker PostgreSQL 16 | AWS RDS `db.t4g.medium` | AWS Aurora Serverless v2 Multi-AZ |
| **Database Encryption**| None / Developer default | AES-256-GCM (AWS KMS) | AES-256-GCM (Dedicated KMS CMK) |
| **Backup Retention** | Ephemeral | 7 Days Automated Snapshot | **30 Days Continuous PITR + WORM** |
| **Log Level** | `debug` | `info` | `info` (PII Masked) |
| **CORS Whitelist** | `http://localhost:*` | `https://staging.asrtava.com` | `https://app.asrtava.com` |
| **Deployment Gate** | Automatic | Automatic upon merge to `main`| **Manual Approval + Smoke Verification**|

---

## 3. Strict Safety Invariants

1. **Zero Production Cross-Contamination**: Development and staging configurations are hosted under separate AWS accounts / VPCs with separate IAM credentials. No VPC peering exists between staging and production.
2. **Never Commit Secrets**: All production secrets are injected via AWS Secrets Manager at task startup. Repositories store `.env.example` templates only.

