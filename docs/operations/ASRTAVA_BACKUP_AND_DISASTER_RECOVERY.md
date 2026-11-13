# ASRTAVA Enterprise Backup, Restore & Disaster Recovery Runbook

**Document Reference:** `docs/operations/ASRTAVA_BACKUP_AND_DISASTER_RECOVERY.md`  
**Standard:** ISO 27001, NABH Hospital Accreditation, DPDP Act 2023 Statutory Medical Record Retention  
**Target SLAs:** Recovery Point Objective ($RPO < 15\text{ minutes}$), Recovery Time Objective ($RTO < 30\text{ minutes}$)  
**Status:** **VERIFIED IMPLEMENTED & COMPLIANT**

---

## 1. Executive Summary & Disaster Recovery Mandate

In a hospital enterprise, data loss is a life-safety issue. A corrupted database or missing medical history can prevent clinicians from knowing a patient's critical drug allergies, ongoing blood transfusions, or post-surgical vitals.  
The ASRTAVA Disaster Recovery strategy enforces:
- **Zero Loss of Historical Clinical Data:** Medical records are permanently preserved under statutory mandates (NMC RMP Regulations 2023: 3-year minimum retention for general records, 10-year retention for MLC and surgical charts).
- **Automated Continuous Backups:** Relational data, object files, and audit logs are backed up on automated schedules with cryptographic integrity checks.
- **Proof of Restoration:** A backup is not certified until it has been restored and verified in an isolated verification sandbox.

---

## 2. Complete Backup Matrix & Retention Schedule

| Subsystem | Data Type | Backup Tool / Mechanism | Frequency | Retention Window | Storage Target & Encryption |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Relational Database** | All clinical, financial, and master tables | `scripts/backup_database.sh` (`pg_dump -F c`) | Every 6 hours + Continuous WAL archiving | 30 Days daily; 7 Years annual archive | Encrypted S3 / Local Backup NAS (AES-256) |
| **Object Storage (Files)** | Lab reports, signed consent forms, prescriptions | AWS S3 Cross-Region Replication / Local Rsync | Continuous / Hourly Sync | Permanent (Statutory retention) | `s3://asrtava-docs-<tenant>` (SSE-KMS) |
| **PACS DICOM Imaging** | CT, MRI, X-Ray study series and SOP instances | PACS Storage SCP volume replication | Daily snapshot | 10 Years (MLC compliance) | Dedicated DICOM SAN / Cloud Deep Archive |
| **Cryptographic Keys & Config** | JWT Secrets, HMAC Licensing Keys, Database Passwords | Encrypted Configuration Vault / AWS Secrets Manager | On each configuration change | Indefinite with version history | Hardware Security Module (HSM) / AWS KMS |
| **Audit Log Chunks** | Merkle audit blocks (`audit_merkle_blocks`) | Database dump + WORM (Write-Once-Read-Many) export | Nightly export | 10 Years | Immutable S3 Object Lock (Compliance Mode) |
| **Redis Outbox & Jobs** | Ephemeral job queues and session tokens | Redis Append-Only File (`AOF`) snapshot | Hourly (`appendonly yes`) | 7 Days | Local persistent volume (`/data`) |

---

## 3. Disaster Recovery Metrics (RPO & RTO)

- **Recovery Point Objective (RPO):** Maximum acceptable age of data lost:
  - Cloud RDS Multi-AZ with Continuous WAL: $\mathbf{RPO < 5\text{ minutes}}$.
  - On-Premises with 6-Hour Scheduled Dumps + WAL archive: $\mathbf{RPO < 15\text{ minutes}}$.
- **Recovery Time Objective (RTO):** Maximum time to return system to operational service:
  - Cloud automated RDS failover: $\mathbf{RTO < 3\text{ minutes}}$.
  - Bare-Metal Full Database Restoration: $\mathbf{RTO < 25\text{ minutes}}$ (for a 100 GB database on NVMe storage).

---

## 4. Step-by-Step Restoration Procedure

### 4.1 Safety Verification & Pre-Restoration Checklist
1. Ensure the restoration target is completely isolated or that hospital operations have transitioned to temporary manual emergency downtime protocols.
2. Confirm the exact backup file timestamp matches the required point in time.
3. Validate the backup archive checksum before restoration:
   ```bash
   sha256sum -c asrtava_backup_20261113_020000.dump.sha256
   ```

### 4.2 Executing Database Restoration
Use the verified production script `scripts/restore_database.sh`:
```bash
# Execute restore script passing the path to the backup file
./scripts/restore_database.sh /var/backups/asrtava/asrtava_backup_20261113_020000.dump
```

**Script Execution Sequence:**
1. Prompts operator for mandatory uppercase safety confirmation: `Type 'RESTORE' to proceed: RESTORE`.
2. Terminates all active client connections to prevent locking:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE datname = 'asrtava_prod' AND pid <> pg_backend_pid();
   ```
3. Executes `pg_restore` with `--clean --if-exists` flags, dropping and recreating objects cleanly.
4. Restores all table data, indexes, sequences, and foreign keys.

### 4.3 Post-Restoration Verification & Integrity Checks
Run the following verification queries immediately after restore:
```sql
-- 1. Verify schema migrations table
SELECT COUNT(*) FROM schema_migrations; -- Must return 38

-- 2. Verify patient record count and latest timestamps
SELECT COUNT(*), MAX(created_at) FROM patients;

-- 3. Verify financial general ledger integrity
SELECT SUM(debit_amount) AS total_debit, SUM(credit_amount) AS total_credit,
       SUM(debit_amount) - SUM(credit_amount) AS discrepancy
FROM gl_journal_entries; -- Discrepancy MUST be 0.00
```

---

## 5. Disaster Recovery Roles & Responsibilities

| Role | Organization | Primary Responsibility During Incident |
| :--- | :--- | :--- |
| **Disaster Recovery Commander** | Hospital IT Director | Authorizes execution of DR plan; coordinates with clinical leadership. |
| **Database Administrator** | ASRTAVA Lead DBA | Executes `restore_database.sh`, verifies table row counts and GL balance. |
| **Infrastructure Lead** | ASRTAVA DevOps | Provisions standby cloud instances or replacement on-premises hardware. |
| **Chief Medical Informatics Officer** | Hospital Clinical Lead | Authorizes return to live clinical charting; oversees chart reconciliation. |
