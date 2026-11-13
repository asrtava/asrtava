# ASRTAVA Disaster Recovery Evidence & Restoration Drill Report

**Document Reference:** `docs/project/ASRTAVA_DISASTER_RECOVERY_EVIDENCE_REPORT.md`  
**Phase:** Phase 2.1 — Critical Operational Safety Verification  
**Audit Target:** `scripts/backup_database.sh`, `scripts/restore_database.sh`, Database WAL & Document Storage  
**Status:** **READY WITH CONDITIONS — LIVE STAGING DRILL PENDING**

---

## 1. Executive Summary: Evidence Audit on Disaster Recovery Claims

The Phase 2 assessment reported target Recovery Point Objectives ($RPO < 15\text{ minutes}$) and Recovery Time Objectives ($RTO < 30\text{ minutes}$). An independent audit was conducted to verify whether empirical evidence exists in the repository to substantiate these targets.

### 1.1 Empirical Evidence Audit Findings
1. **Automation Scripts Exist and Pass Syntax Verification:**
   - `scripts/backup_database.sh` is implemented, using `pg_dump -F c -b -v` to generate custom-format, compressed, timestamped database dumps with 30-day retention pruning.
   - `scripts/restore_database.sh` is implemented, executing `pg_restore --clean --if-exists -v` with mandatory uppercase safety confirmation (`RESTORE`).
2. **Missing Empirical Evidence:**
   - There is **no recorded physical restoration drill log** in the repository documenting an actual restore event with a measured dataset size (e.g. 100 GB), measured clock time, and post-restoration verification metrics.
   - The stated RPO and RTO figures are **architectural target SLAs**, not empirically proven performance benchmarks.
3. **Classification Adjustment:**
   - Disaster Recovery is formally reclassified from "VERIFIED READY" to **READY WITH CONDITIONS**.
   - **Condition for Pilot Activation:** Execution of a formal, non-destructive restoration drill in an isolated staging environment using the protocol defined below.

---

## 2. Safety Analysis of Destructive Restoration Commands

Inspection of `scripts/restore_database.sh` (lines 35-41) reveals potentially destructive database operations:
```sql
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE datname = 'asrtava_prod' AND pid <> pg_backend_pid();
```
Followed by:
```bash
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists -v "${BACKUP_FILE}"
```

### Safety Risks Identified:
- `pg_terminate_backend` forcefully severs all active client connections (including ongoing clinical consultations and eMAR charting).
- `--clean --if-exists` drops existing database tables, triggers, and views before recreating them from the dump.
- **Strict Execution Rule:** This script must **never be executed casually against a production database**. It is strictly reserved for:
  1. Complete bare-metal disaster recovery after a confirmed total server loss.
  2. Isolated staging and sandbox recovery verification drills.
  3. Pre-authorized major migration rollbacks approved by the Hospital Incident Commander.

---

## 3. Safe Isolated Restoration Drill Protocol (Pre-Pilot Requirement)

To establish empirical evidence of recovery without risking active hospital or development databases, the following non-destructive drill must be performed on an isolated container:

```bash
# ------------------------------------------------------------------------------
# STEP 1: Launch an Isolated Restoration Drill PostgreSQL Container
# ------------------------------------------------------------------------------
docker run --name asrtava-dr-drill-db \
  -e POSTGRES_DB=asrtava_drill_test \
  -e POSTGRES_USER=asrtava_drill_admin \
  -e POSTGRES_PASSWORD=DrillSecurePass2026! \
  -p 5499:5432 \
  -d postgres:16-alpine

# ------------------------------------------------------------------------------
# STEP 2: Generate a Timestamped Baseline Backup from Staging
# ------------------------------------------------------------------------------
DB_PORT=5432 DB_NAME=asrtava_staging ./scripts/backup_database.sh

# ------------------------------------------------------------------------------
# STEP 3: Execute Restore into the Isolated Drill Container
# ------------------------------------------------------------------------------
LATEST_BACKUP=$(ls -t /var/backups/asrtava/asrtava_backup_*.dump | head -1)

# Measure Restoration Clock Time (RTO)
START_TIME=$(date +%s)

DB_HOST=127.0.0.1 DB_PORT=5499 DB_NAME=asrtava_drill_test DB_USER=asrtava_drill_admin \
  ./scripts/restore_database.sh "${LATEST_BACKUP}"

END_TIME=$(date +%s)
ELAPSED_RTO=$((END_TIME - START_TIME))
echo "Measured RTO: ${ELAPSED_RTO} seconds."

# ------------------------------------------------------------------------------
# STEP 4: Automated Data Integrity & Schema Verification
# ------------------------------------------------------------------------------
docker exec -i asrtava-dr-drill-db psql -U asrtava_drill_admin -d asrtava_drill_test -c "
  -- 1. Check Migration Count (Must equal 38)
  SELECT count(*) AS migration_count FROM schema_migrations;

  -- 2. Check Patient Table Integrity
  SELECT count(*) AS total_patients FROM patients;

  -- 3. Check General Ledger Balance (Discrepancy must be exactly 0.00)
  SELECT SUM(debit_amount) - SUM(credit_amount) AS gl_discrepancy FROM gl_journal_entries;
"

# ------------------------------------------------------------------------------
# STEP 5: Teardown Isolated Container
# ------------------------------------------------------------------------------
docker stop asrtava-dr-drill-db && docker rm asrtava-dr-drill-db
```

---

## 4. Database-to-Document Consistency Audit

In addition to relational tables, a hospital system stores unstructured clinical documents:
- **Clinical Attachments:** Lab PDF reports, scanned consent forms, referral letters.
- **PACS DICOM Imaging:** CT, MRI, and X-Ray binary studies.
- **Consistency Verification Protocol:**
  - Relational tables store storage URIs (e.g. `pacs_studies.storage_uri` and `clinical_documents.file_path`).
  - During backup restoration, the script must verify that all URIs referenced in the database have corresponding physical objects in the restored document vault. Any orphan database pointer or missing DICOM blob must be flagged in the post-restore audit report.

---

## 5. Summary of Required Pre-Pilot DR Actions

1. Execute the isolated restoration drill and record the empirical RTO and RPO in this document.
2. Verify off-site cloud replication of backup archives (AES-256 encrypted).
3. Secure emergency encryption key recovery passwords in a dual-custody physical safe.

