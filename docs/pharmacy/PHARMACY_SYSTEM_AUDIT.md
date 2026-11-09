# ASRTAVA Pharmacy System Audit & Codebase Inspection Report

**Milestone:** Advanced Pharmacy Management, E-Prescriptions, Drug Inventory, Procurement, Batch Tracking & Medication Safety  
**Audit Date:** 2026-11-09  
**Auditor:** ASRTAVA System Architecture Group  
**Status:** COMPLETE & VERIFIED

---

## 1. Executive Summary

A comprehensive architectural and codebase audit was conducted across the ASRTAVA repository to evaluate existing pharmacy, prescription, inventory, clinical, and financial billing components.

The objective was to identify:
1. Production-ready schemas and services that must be preserved and reused.
2. Incomplete or baseline schemas requiring enterprise-grade extension.
3. Missing capabilities required for hospital pharmacy operations (e.g. cold-chain monitoring, drug-drug interaction safety rules, Look-Alike Sound-Alike checks, pharmacist verification queues, eMAR nursing dual-signoff, manufacturer lot recalls, and narcotic double-custody vaults).
4. Integration points with Revenue Cycle Management (RCM), General Ledger accounting, and Multi-Hospital Branch operations.

---

## 2. Existing Artifacts & Reusability Assessment

### 2.1 Database Migrations Audit

| Migration File | Existing Tables | Reusability Assessment & Action |
| :--- | :--- | :--- |
| `006_appointments_consult.sql` | `prescriptions`, `prescription_items` | **Baseline Reusable**: Contains patient, doctor, and line items. Lacks digital signing, clinical safety alerts, versioned amendments, and pharmacist verification status. Must be augmented with prescription lifecycle governance. |
| `007_inpatient_beds.sql` | `medication_administration_records` | **Baseline Reusable**: Contains scheduled vs administered times and nurse references. Needs eMAR support, missed/delayed reasons, dual-nurse cosign for high-risk meds, and vital signs links. |
| `008_pharmacy_inventory.sql` | `medicines`, `medicine_categories`, `suppliers`, `pharmacy_batches`, `pharmacy_stock_movements`, `pharmacy_dispensings`, `pharmacy_dispense_items`, `purchase_orders`, `purchase_order_items`, `goods_receipt_notes` | **Core Foundation**: Established primary tables with Row-Level Security (RLS) and pessimistic locking. Must be extended with active ingredients, therapeutic categories, LASA flags, cold-chain temperature monitoring, recall management, and formulary restrictions. |
| `021_enterprise_hospital_group_and_branch_management.sql` | `inter_branch_stock_transfers` | **Directly Reusable**: Provides branch-to-branch transit, approval, and receiving reconciliation. |
| `023_enterprise_rcm_and_financial_accounting.sql` | `chart_of_accounts`, `journal_entries`, `patient_billing_ledgers` | **Directly Reusable**: Connects retail and IPD pharmacy sales to double-entry general ledger (Dr. 1001/1002, Cr. 4005 Pharmacy Revenue) and Indian GST compliance (HSN 3004 5%, HSN 300490 12%). |

### 2.2 Backend Codebase Audit (`backend/src/modules/`)

| File / Route | Existing Implementation | Gap Analysis & Enhancement Scope |
| :--- | :--- | :--- |
| `modules/pharmacy/pharmacy.routes.ts` | 4 endpoints: `/medicines` (search), `POST /medicines`, `POST /batches`, `POST /dispense` (with row-level lock) | High-quality row locking is present. However, it lacks eRx verification queues, clinical safety checks, drug-drug interaction evaluation, lot recall quarantine, temperature excursion logging, and controlled drug workflows. |
| `modules/billing/rcm-accounting.service.ts` | Complete double-entry accounting engine with HSN 3004 tax support | Ready for end-to-end dispensing journal voucher integration. |
| `modules/group/group.service.ts` | Inter-branch stock transfers and branch isolation | Ready for multi-location central pharmacy supply routing. |

### 2.3 Frontend Web Portal Audit (`apps/web-portal/`)

| Component | Existing Capabilities | Required Enhancements |
| :--- | :--- | :--- |
| `portals/pharmacy/PharmacyDashboard.tsx` | Dispensing queue card, inventory table, manual dispensing modal | Needs full enterprise tabs: Pharmacist Verification Queue, eRx Clinical Safety Review, Batch & Expiry FEFO Inspector, Inpatient eMAR, Cold-Chain Logs, Manufacturer Recalls, Narcotic Vault, and Procurement 3-Way Match. |

---

## 3. Detailed Gap Analysis & Technical Deficiencies

1. **Absence of Pharmacist Verification Gate**:
   Prescriptions transition directly to dispensing without a recorded clinical pharmacist review for dosage appropriateness, contraindications, and patient allergies.
2. **Missing Medication Safety Checks**:
   No automated detection of Drug-Drug Interactions (DDI), duplicate therapy, Look-Alike Sound-Alike (LASA) risks, or known patient allergies during doctor prescription creation or pharmacist verification.
3. **No Batch Recall or Cold-Chain Excursion Governance**:
   If a pharmaceutical manufacturer issues an urgent lot recall, the system currently lacks a mechanism to quarantine remaining batches and identify patients who received affected lots.
4. **Unregulated Controlled Substances**:
   High-risk narcotics and Schedule X medications lack dual-custody perpetual registers, wastage witnesses, and tamper-evident reconciliation.
5. **Lack of Prescription Immutability & Versioning**:
   Signed prescriptions cannot be modified, but legitimate clinical amendments (e.g. renal dose adjustment) require versioned audit trails (`prescription_versions`).

---

## 4. Architectural Decisions & Non-Negotiable Standards

- **Zero Silent Modifiability**: A pharmacist or nurse can never silently alter a doctor's signed prescription. Any substitution must be an explicit, authorized, policy-driven record linked to the original item.
- **Strict FEFO Allocation**: The dispensing engine must automatically allocate batches with the nearest expiry date. Expired, recalled, or quarantined batches must be hard-blocked from dispensing.
- **Decoupled Clinical Emergency Dispensing**: Emergency medication access must never be blocked by network outages, billing delays, or licensing verification issues.
- **Perpetual Licensing Model**: Core pharmacy operations, dispensing, and inventory controls operate perpetually under the hospital's one-time license with zero mandatory recurring fees.

