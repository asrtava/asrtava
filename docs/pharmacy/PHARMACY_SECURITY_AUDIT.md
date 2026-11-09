# ASRTAVA Advanced Pharmacy Security & Compliance Audit

## 1. Security Architecture Overview

The Pharmacy and Medication Management domain deals with highly regulated controlled substances, clinical patient safety data, and commercial inventory transactions. ASRTAVA enforces strict defense-in-depth principles across authentication, authorization, multi-tenancy, and audit logging.

```
+---------------------------------------------------------------------------------------------------+
|                                     SECURITY & COMPLIANCE STACK                                   |
+---------------------------------------------------------------------------------------------------+
|  1. PERMISSION MODEL     : Granular RBAC with DENY-by-default and explicit capability binding    |
|  2. MULTI-TENANCY        : Strict RLS (Row-Level Security) per hospital & branch location         |
|  3. CONTROLLED DRUGS     : Dual-custody mandate (Custodian + Independent Witness)                 |
|  4. CLINICAL SAFETY      : Tamper-evident clinical override logs and digital signatures           |
|  5. AUDIT INTEGRITY      : Immutable append-only audit trail with IP and user telemetry           |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Granular Role-Based Access Control (RBAC)

All endpoints mounted under `/api/v1/pharmacy/advanced/*` enforce verified user identity and explicit permission strings:

| Permission String | Description | Authorized Roles |
| :--- | :--- | :--- |
| `pharmacy.read` | View drug master, stock levels, and non-narcotic inventories. | Doctor, Nurse, Pharmacist, Storekeeper, Billing Clerk |
| `pharmacy.prescribe` | Create, amend, and sign electronic prescriptions (eRx). | Doctor / Attending Physician only |
| `pharmacy.verify` | Clinical review and verification of eRx orders in the queue. | Registered Pharmacist only |
| `pharmacy.dispense` | Perform FEFO lot allocation, POS checkout, and print labels. | Pharmacist, Pharmacy Technician |
| `pharmacy.administer` | Document medication passes in inpatient eMAR. | Registered Nurse, Ward Sister, Doctor |
| `pharmacy.narcotics` | Access and disburse from the Narcotic Vault ledger. | Chief Pharmacist, ICU Charge Nurse (Dual custody) |
| `pharmacy.procure` | Create and approve Purchase Requisitions & Purchase Orders. | Procurement Officer, Medical Director, CFO |
| `pharmacy.recall` | Initiate hospital-wide product recalls and access patient logs. | Chief Medical Officer, Head of Pharmacy |
| `pharmacy.adjust` | Authorize physical inventory count adjustments & write-offs. | Pharmacy Director, Internal Auditor |

---

## 3. Dual-Custody Narcotic & Controlled Substance Vault

In compliance with the **Narcotic Drugs and Psychotropic Substances (NDPS) Act** and international controlled substance regulations:

1. **Perpetual Ledger Maintenance:**
   - Every transaction in `narcotic_vault_ledger` is immutable and sequentially numbered.
   - Running balances are computed deterministically ($Balance_{n} = Balance_{n-1} + Qty_{in} - Qty_{out}$).
2. **Mandatory Two-Person Rule:**
   - Any access (issuance, return, disposal, or physical audit) requires two distinct credentialed staff:
     - `custodianNurseId` (The custodian taking custody of the substance).
     - `witnessPharmacistId` (An authorized independent witness supervising the physical count and packaging).
   - If `custodianNurseId === witnessPharmacistId`, the transaction is rejected immediately.
3. **Wastage & Breakage Documentation:**
   - Residual narcotic wastage (e.g. 50mcg fentanyl administered from a 100mcg ampoule) must be documented with the exact residual volume discarded and cosigned by the witness.

---

## 4. Multi-Tenant & Branch-Level Isolation

1. **PostgreSQL Row-Level Security (RLS):**
   - Every pharmacy table (`drug_master_catalog`, `pharmacy_verification_queue`, `inpatient_emar_records`, `narcotic_vault_ledger`, etc.) contains a non-nullable `tenant_id` and `hospital_id`.
   - Queries are automatically scoped to the active tenant session context (`SET LOCAL app.current_tenant_id = ?`).
2. **Branch & Satellite Store Scoping:**
   - Wards, emergency crash carts, and satellite clinics are isolated by `location_id`.
   - Inventory movements between locations require formal transfer requisition and receipt handshake.

---

## 5. Tamper-Evident Audit Logging

All safety-critical actions generate structured event logs in the central immutable audit ledger:
- **Overrides:** Doctor, patient ID, drug ID, interaction rule ID, severity, clinical justification, timestamp, and client IP.
- **Substitutions:** Original prescribed drug, substituted generic/brand, bioequivalence ratio, cost variance, and pharmacist license number.
- **Prescription Amendments:** Every amendment seals the previous version in `prescription_versions` and marks the change history.
- **Physical Count Variances:** Discrepancies between counted and recorded stock trigger uneditable incident audit trails.

