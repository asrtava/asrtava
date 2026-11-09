# ASRTAVA Backup, Disaster Recovery & Continuous Restoration Runbook

## 1. Objectives & Metrics

Because ASRTAVA supports emergency room triage, intensive care beds, and operation theatre scheduling, disaster recovery targets are legally and clinically mandated:

| Metric | Target SLA | Implementation Architecture |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **$< 15$ Minutes** | Continuous PostgreSQL Write-Ahead Log (WAL) streaming + automated S3 snapshots. |
| **Recovery Time Objective (RTO)** | **$< 60$ Minutes** | Terraform Infrastructure-as-Code automated restoration in secondary AWS Region (`ap-south-2` Hyderabad). |
| **Storage Immutability** | **WORM Compliance Mode** | S3 Object Lock prevents ransomware or administrative deletion. |

---

## 2. Automated Backup Execution & Verification

Automated daily backup jobs execute via [`infra/scripts/backup-database.ps1`](file:///c:/Users/madha/Desktop/Medical_Project/infra/scripts/backup-database.ps1):
1. Dumps logical database archive using `pg_dump` with custom compression.
2. Computes cryptographic SHA-256 integrity checksum.
3. Encrypts archive using AWS KMS SSE-KMS.
4. Pushes archive and `.sha256` signature to immutable S3 bucket.

---

## 3. Disaster Recovery Rehearsal & Verification

Restoration exercises are executed and verified via [`infra/scripts/restore-database.ps1`](file:///c:/Users/madha/Desktop/Medical_Project/infra/scripts/restore-database.ps1):
1. Verifies SHA-256 archive checksum against stored cryptographic signature.
2. Restores database schema and tables into an isolated target environment (`asrtava_dr_test`).
3. Executes automated post-restore verification:
   - Verifies integrity of append-only `clinical_audit_events` Merkle chain.
   - Verifies RLS policies are active and enforced on all tenant tables.
   - Verifies that zero cross-tenant row contamination occurred.

