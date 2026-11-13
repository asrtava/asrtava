# ASRTAVA Database Migration Inventory & Technical Schema Audit

**Document Reference:** `docs/project/ASRTAVA_MIGRATION_INVENTORY_AUDIT.md`  
**Audit Date:** 2026-11-13  
**Audit Objective:** Independently reconcile the 38 physical migration files against the numerical sequence (`001` to `037`), verify cryptographic checksums, catalog database objects, foreign keys, indexes, and PostgreSQL Row-Level Security (RLS) policies.

---

## 1. Executive Summary: Migration Discrepancy Resolution & Execution Order

The previous audit reported 38 migration files spanning numerical prefixes `001` through `037`.  
Physical inspection of the filesystem (`database/migrations/`) confirms:
- **Total Physical Migration Files:** Exactly **38 SQL files**.
- **Numerical Prefix Range:** `001_` through `037_`.
- **Root Cause of Count Discrepancy:** Numeric prefix **`036_` is duplicated across two distinct files**:
  1. `036_enterprise_cross_module_integration_views.sql` (2,166 bytes, SHA-256: `80982C900BB6B709...`) — Defines consolidated longitudinal patient, telemetry, and reconciliation database views.
  2. `036_tenant_row_level_security.sql` (7,978 bytes, SHA-256: `46247C9492E97ED4...`) — Defines comprehensive PostgreSQL Row-Level Security policies and tenant isolation triggers.

### 1.1 Verified Migration Runner Execution Order
Inspection of `scripts/run_migrations.sh` (`ls *.sql | sort`) and `scripts/run_migrations.ps1` (`Sort-Object Name`) confirms:
- Standard ASCII/alphanumeric sorting executes:
  1. `036_enterprise_cross_module_integration_views.sql` ('e' comes before 't').
  2. `036_tenant_row_level_security.sql`.
- **Execution Order Safety:** Because views are created prior to the application of RLS policies, the sequence executes without dependency errors.
- **Manifest Recommendation:** While current alphanumeric execution succeeds, relying solely on directory sorting is a potential operational risk if file naming or system locale collation varies. **Recommendation:** Introduce an explicit, ordered JSON migration manifest (`database/migrations/manifest.json`) in the next release cycle to guarantee deterministic execution across all environments.

---

## 2. Complete Physical Migration Inventory (38 Files)

| Prefix | Filename | Size (Bytes) | SHA-256 Checksum (First 16 Hex) | Core Tables / Views Created | RLS Enforced |
| :---: | :--- | :---: | :---: | :--- | :---: |
| `001_` | `001_extensions.sql` | 633 | `BB56118C5517BBEC` | `uuid-ossp`, `pgcrypto` extensions | System |
| `002_` | `002_hospitals_tenants.sql` | 3,377 | `776F7B5841EF6897` | `tenants`, `hospitals`, `branches` | Yes |
| `003_` | `003_identity_permissions.sql` | 5,178 | `84A381F35687F1EC` | `users`, `roles`, `permissions`, `role_permissions` | Yes |
| `004_` | `004_departments_staff.sql` | 3,678 | `6FE86413257BB779` | `departments`, `staff_profiles`, `doctor_profiles` | Yes |
| `005_` | `005_patients_emr.sql` | 4,850 | `C95EDAE407B460C6` | `patients`, `emr_encounters`, `prescriptions`, `diagnoses` | Yes |
| `006_` | `006_appointments_consult.sql` | 5,288 | `8F60B4C822B9653C` | `appointments`, `opd_queues`, `consultation_notes` | Yes |
| `007_` | `007_inpatient_beds.sql` | 5,670 | `5C7811EEE63F031D` | `wards`, `rooms`, `beds`, `ipd_admissions` | Yes |
| `008_` | `008_pharmacy_inventory.sql` | 7,766 | `7BEFD769A0FE0BE4` | `pharmacy_items`, `inventory_batches`, `dispenses` | Yes |
| `009_` | `009_laboratory_radiology.sql` | 6,499 | `58D165818D844320` | `lab_orders`, `lab_results`, `radiology_orders`, `rad_reports` | Yes |
| `010_` | `010_billing_finance.sql` | 5,183 | `24CA08AB9FD2D9C3` | `invoices`, `invoice_items`, `payments`, `tariffs` | Yes |
| `011_` | `011_saas_platform.sql` | 4,057 | `FB035380449E8104` | `subscriptions`, `plan_tiers`, `tenant_invoices` | Yes |
| `012_` | `012_audit_and_documents.sql` | 3,630 | `B1D9D0E320ADEAD1` | `audit_logs`, `clinical_documents`, `consent_records` | Yes |
| `013_` | `013_auth_and_security.sql` | 4,766 | `D617AC02F04B2966` | `user_mfa`, `login_attempts`, `refresh_tokens` | Yes |
| `014_` | `014_hospital_modules.sql` | 12,223 | `10A8A7D26BFAF8E1` | Operational module settings, emergency queues | Yes |
| `015_` | `015_saas_management.sql` | 16,135 | `1155819294AD1410` | Platform metrics, JIT support sessions, quotas | Yes |
| `016_` | `016_integrations_ecosystem.sql` | 19,243 | `23B935F9F181BEDE` | Webhooks, outbox jobs, Dead-Letter Queue (DLQ) | Yes |
| `017_` | `017_reporting_analytics.sql` | 11,277 | `FC3B63047C89814B` | Scheduled reports, export jobs, cached metrics | Yes |
| `018_` | `018_security_governance.sql` | 11,025 | `4FCE36235C19430D` | DPDP data subject requests (DSR), hash-chained audit | Yes |
| `019_` | `019_software_licensing.sql` | 7,010 | `C63186832270D4D3` | `software_licenses`, `license_amc_agreements` | Yes |
| `020_` | `020_customer_onboarding_and_implementation.sql` | 11,069 | `C3D1ABCBFA4BD1BD` | `onboarding_projects`, `milestones`, `data_migrations` | Yes |
| `021_` | `021_enterprise_hospital_group_and_branch_management.sql` | 13,115 | `3E38CB3D7005A33B` | `hospital_groups`, `enterprise_hierarchy`, `branch_transfers` | Yes |
| `022_` | `022_healthcare_interoperability_and_medical_devices.sql` | 13,686 | `648EFFABEDF0B12E` | `hl7_messages`, `fhir_resources`, `device_registrations` | Yes |
| `023_` | `023_enterprise_rcm_and_financial_accounting.sql` | 16,182 | `F624A2594B75129E` | `gl_accounts`, `journal_vouchers`, `general_ledger` | Yes |
| `024_` | `024_advanced_pharmacy_and_medication_safety.sql` | 16,435 | `E80A5106B12D29F9` | `pharmacy_verification_queue`, `drug_recalls`, `vault` | Yes |
| `025_` | `025_advanced_nursing_management.sql` | 18,926 | `B8515C5D675B9B83` | `nursing_vitals_charts`, `emar_records`, `sbar_handovers` | Yes |
| `026_` | `026_complete_laboratory_information_system.sql` | 11,821 | `4B02E20CD960125C` | `lis_specimens`, `lis_worklists`, `lis_iqc_runs` | Yes |
| `027_` | `027_advanced_ris_pacs_and_dicom_imaging.sql` | 10,271 | `7BA4A684C93C1EFE` | `pacs_modalities`, `pacs_studies`, `pacs_series`, `instances` | Yes |
| `028_` | `028_operation_theatre_and_perioperative_care.sql` | 11,245 | `2ED3FA03A42C6800` | `ot_surgeries`, `who_checklists`, `pacu_recoveries` | Yes |
| `029_` | `029_emergency_department_triage_and_ambulance.sql` | 10,447 | `E4439C6130E67898` | `ed_episodes`, `ed_triage_assessments`, `ambulances` | Yes |
| `030_` | `030_complete_ward_and_bed_lifecycle_management.sql` | 12,779 | `1266926C9E0B2562` | `bed_lifecycle_transitions`, `cleaning_tasks`, `discharge_plans` | Yes |
| `031_` | `031_complete_hrms_workforce_management.sql` | 24,551 | `9EF0AF4070FF98F5` | `hrms_employees`, `duty_rosters`, `attendance_punches`, `payroll` | Yes |
| `032_` | `032_complete_procurement_inventory_and_asset_management.sql` | 20,942 | `AE266F6E53590E75` | `proc_vendors`, `purchase_orders`, `grn_receipts`, `assets` | Yes |
| `033_` | `033_complete_telemedicine_and_remote_healthcare.sql` | 17,835 | `D0F294CB342F3E86` | `tele_services`, `tele_consultations`, `rpm_care_plans` | Yes |
| `034_` | `034_complete_quality_management_and_accreditation.sql` | 18,713 | `49C2550C5CDBE957` | `qm_incidents`, `qm_capa_actions`, `qm_surveillance`, `nabh` | Yes |
| `035_` | `035_complete_enterprise_data_warehouse_and_bi.sql` | 10,761 | `98EBDB7ABE800F60` | `edw_dim_*`, `edw_fact_*` Star Schema Data Marts | Yes |
| `036_` | `036_enterprise_cross_module_integration_views.sql` | 2,166 | `80982C900BB6B709` | `view_patient_longitudinal_summary`, `view_telemetry` | View |
| `036_` | `036_tenant_row_level_security.sql` | 7,978 | `46247C9492E97ED4` | Row-Level Security policies across all tenant tables | System |
| `037_` | `037_federated_inter_hospital_coordination_network.sql` | 15,969 | `F13D4B59B3259AD6` | `fed_network_nodes`, `fed_coordination_requests`, `fed_audit` | Yes |

---

## 3. Audit Log Immutability & Integrity Architecture

### 3.1 In-Database Tamper-Resistance Controls
Inspection of `database/migrations/018_security_governance.sql` reveals:
1. **Trigger-Enforced Immutability:**
   ```sql
   CREATE OR REPLACE FUNCTION prevent_clinical_audit_tampering()
   RETURNS TRIGGER AS $$
   BEGIN
       RAISE EXCEPTION 'TAMPER_ALERT: clinical_audit_events is an immutable append-only ledger. Updates and deletions are strictly prohibited by HIPAA/DPDP compliance policy.';
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_prevent_audit_update
       BEFORE UPDATE OR DELETE ON clinical_audit_events
       FOR EACH ROW
       EXECUTE FUNCTION prevent_clinical_audit_tampering();
   ```
2. **Cryptographic Hash Chaining:**
   - Every event recorded in `clinical_audit_events` generates a SHA-256 hash (`checksum_sha256`) incorporating the record's payload and the `previous_checksum` of the preceding record, creating a verifiable linear Merkle chain.

### 3.2 Security Qualification of "Immutability"
While database triggers actively block application-level `UPDATE` and `DELETE` queries, true cryptographic immutability requires defense against administrative database tampering:
- In production, application connection roles must have restricted privileges:
  ```sql
  REVOKE UPDATE, DELETE ON clinical_audit_events FROM asrtava_app_user;
  ```
- **WORM Storage Export:** Daily audit Merkle root digests must be exported to Write-Once-Read-Many (WORM) storage (e.g. AWS S3 Object Lock in Compliance Mode) to guarantee legal evidentiary status in court.
- **Integrity Verification Scans:** Independent automated verification scripts must periodically walk the hash chain to certify that no intermediate blocks have been removed or altered.
