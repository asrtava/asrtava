# ASRTAVA Pharmacy System Test Plan & Quality Assurance Matrix

**Milestone:** Advanced Pharmacy Management, E-Prescriptions, Drug Inventory, Procurement, Batch Tracking & Medication Safety  
**Execution Environment:** Node.js 24 LTS, TypeScript, Node.js Native Test Runner  
**Test Suite Path:** `backend/tests/advanced_pharmacy_management.test.ts`

---

## 1. Test Strategy & Scope

The testing strategy validates the entire pharmaceutical lifecycle across 16 core operational scenarios:

```
[1. Drug Master & Tall Man] ---> [2. Medication Safety Engine] ---> [3. eRx Signing & Override]
                                                                                |
                                                                                v
[6. Inpatient eMAR & Cosign] <--- [5. FEFO Batch Dispensing] <--- [4. Pharmacist Verification]
            |                                   |
            v                                   v
[7. Cold-Chain & Excursion]        [8. Lot Recall & Traceability]
            |                                   |
            v                                   v
[9. Narcotic Vault Dual-Custody]  [10. PR -> PO Procurement Pipeline]
```

---

## 2. Comprehensive Test Matrix

| # | Test Scenario | Acceptance Criteria | Target Verification |
| :---: | :--- | :--- | :--- |
| **01** | Drug Master Catalog Registration & LASA Tall Man Lettering | Auto-applies ISMP Tall Man lettering (e.g. `predniSONE`) and flags `isLasa: true`. | Master formulary catalog entry created with HSN 3004. |
| **02** | Severe Drug Allergy Detection | Cross-checks patient documented allergies; triggers `CRITICAL_BLOCK` on cross-reacting items (Penicillin -> Amoxicillin). | Prescription creation blocked unless overridden. |
| **03** | Drug-Drug Interaction (DDI) Detection | Identifies interacting pairs (Warfarin + Aspirin); issues `MAJOR_WARNING` with bleeding risk guidance. | Clinician alerted with clinical mechanism. |
| **04** | Duplicate Active Ingredient / Duplicate Therapy Detection | Detects identical molecules (Paracetamol + Crocin); flags `DUPLICATE_THERAPY` to prevent overdose. | Toxicity warning generated. |
| **05** | Prescription Signing with Documented Clinical Override | Blocks unsigned critical alerts; allows signing when clinician provides valid documented justification category and rationale. | Prescription signed (`ACTIVE_SIGNED`), v1 created, enqueued to pharmacy. |
| **06** | Prescription Immutability & Versioned Amendments | Amending an active prescription creates a new version snapshot (`versionNumber: 2`); historical data preserved. | Original prescription remains immutable. |
| **07** | Pharmacist Verification Queue Workflow | Prescriptions queued for clinical review; pharmacist reviews safety notes and approves with `VERIFIED_APPROVED`. | Approval recorded with pharmacist user ID. |
| **08** | Batch Stock Receipt & Inventory Ledger | Stores batches with expiry, purchase cost, selling price, and MRP ($MRP \ge \text{Selling Price}$); logs movement ledger. | Available quantity credited. |
| **09** | Strict First-Expiry-First-Out (FEFO) Dispensing | Given Batch 1 (expires in 30 days) and Batch 2 (expires in 180 days), dispensing draws from Batch 1 first. | Inventory decremented atomically. |
| **10** | Expired Stock Hard-Block & Automated Quarantine | Batches past their expiry date are strictly blocked from dispensing; status transitions to `QUARANTINED_EXPIRED`. | Throws `OUT_OF_STOCK_ERROR` on expired stock. |
| **11** | Pharmacy Billing & Double-Entry General Ledger Integration | Computes Indian GST (HSN 3004 at 5%); posts balancing double-entry journal vouchers to general ledger. | Total Debits == Total Credits; Dr. 1001, Cr. 4005, Cr. 2002. |
| **12** | Inpatient eMAR Administration & Dual-Nurse Cosign | High-Alert and Narcotic administration requires mandatory dual-nurse cosign; absence of cosigner throws error. | eMAR dose recorded with vitals (Pulse, BP). |
| **13** | Cold-Chain Storage Temperature Excursion Alert & Quarantine | Temperature readings outside 2.0°C – 8.0°C trigger excursion alarms; batches in that unit are quarantined. | Status set to `QUARANTINED_TEMP_EXCURSION`. |
| **14** | Manufacturer Lot Recall Cascade & Patient Traceability | Freezes all remaining stock of recalled batch; generates list of past dispensed patients for clinical recall. | Active stock quarantined; patient trace count $> 0$. |
| **15** | Schedule X & Narcotic Double-Custody Vault Register | Custody transactions require primary custodian != witness; discrepancy between physical and book balance flags alarm. | Perpetual register maintained; discrepancy logged. |
| **16** | Pharmacy Procurement Requisition (PR) to Purchase Order (PO) Pipeline | Staff raises PR; manager reviews and approves, converting PR to formal Purchase Order (`PO-YYYY-XXXXX`). | Status transitions to `APPROVED_CONVERTED_PO`. |

