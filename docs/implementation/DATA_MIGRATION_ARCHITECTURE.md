# ASRTAVA Existing Hospital Data Migration Architecture

## 1. Executive Overview

Migrating clinical and operational data from legacy hospital management systems (legacy MSSQL, Oracle, MySQL, Excel, or proprietary clinic software) into ASRTAVA is governed by an automated, risk-mitigated **4-Phase Migration Pipeline**:

```
+---------------------------------------------------------------------------------------------------+
|                                 DATA MIGRATION PIPELINE ARCHITECTURE                              |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ Legacy Source Records ]                                                                        |
|       (CSV / Excel / JSON / SQL Dump)                                                             |
|                    │                                                                              |
|                    ▼                                                                              |
|  [ Phase 1: Ingestion & Field Mapping ] ──► JSON Schema Translation & Normalization               |
|                    │                                                                              |
|                    ▼                                                                              |
|  [ Phase 2: Dry-Run Validation Engine ] ──► Mandatory Fields Check                                |
|                                         ──► Duplicate Detection (Name+Phone, Aadhaar, UHID)        |
|                                         ──► Data Sanitization & Formatting                        |
|                                         ──► Preview Population (No DB Mutations)                  |
|                    │                                                                              |
|                    ▼                                                                              |
|  [ Phase 3: Human Sign-Off Gate ]       ──► Hospital Technical & Clinical Authority Approval      |
|                    │                                                                              |
|                    ▼                                                                              |
|  [ Phase 4: Production Execution ]      ──► Transactional Bulk Insertion                          |
|                                         ──► Checksum Integrity Generation (SHA-256)               |
|                                         ──► Auto-Reconciliation Report Generation                 |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Ingestion Entity Categories & Precedence

Data migration is executed across 8 sequential entity categories to maintain referential integrity:

1. **Departments & Specialities**: Core departmental master (`id`, `name`, `code`, `hod`).
2. **Staff & Users**: Doctor, nursing, pharmacy, and administrative accounts with system roles.
3. **Wards & Beds**: Hospital floor plans, room categories, ward codes, and physical beds.
4. **Billing Tariffs & Packages**: Services, procedure codes, standard prices, CGHS rates, and TPA caps.
5. **Pharmacy Formulary & Inventory**: Drug brands, molecules, HSN codes, batch numbers, and expiry dates.
6. **Patients & Demographics**: UHID lineage, names, contact numbers, gender, DOB, address, and national IDs.
7. **Appointments & Historical Encounters**: Past visits and OPD appointments.
8. **Clinical Summaries & Historical EMR**: Past diagnoses, allergy lists, and discharge summaries.

---

## 3. Duplicate Detection Logic & Dedup Matrix

To prevent patient identity fragmentation, the migration engine applies multi-factor deduplication:
- **Composite Primary Key**: `fullName.toLowerCase().trim() + ":" + phone.replace(/\D/g, '')`.
- **National Identifier**: Aadhaar / National ID / ABHA Address exact match.
- **Legacy UHID**: Uniqueness check against existing records in `patients` table for the target hospital tenant.

When duplicates are identified:
1. They are flagged with row numbers in the `dry_run_preview` error stream.
2. The duplicate records count (`duplicate_records`) is incremented.
3. Duplicate records are excluded from the valid records pool (`valid_records`) to prevent duplicate account creation.
4. The migration job cannot be executed in production until the administrator explicitly acknowledges the duplicate exclusion or specifies an update merge rule.

---

## 4. Human Sign-Off Checkpoint & Reconciliation Reporting

Strict administrative governance enforces that no production database write occurs without explicit authorization:
- **State Transition Gate**: Status must transition from `preview_ready` to `approved_for_execution` by an authorized administrator (`approved_by`).
- **Cryptographic Traceability**: The reconciliation report generates a 256-bit SHA checksum certifying the exact payload loaded.
- **Reconciliation Invariants**:
  $$\text{Total Source Rows} = \text{Successfully Migrated} + \text{Duplicates Excluded} + \text{Validation Failures}$$
- **Zero Mock Policy**: The reconciliation report is stored directly in the `data_migration_jobs` table and verified by automated audit scripts.

