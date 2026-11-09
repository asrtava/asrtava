# ASRTAVA Pharmacy Module Implementation Plan

**Milestone:** Advanced Pharmacy Management, E-Prescriptions, Drug Inventory, Procurement, Batch Tracking & Medication Safety  
**Execution Sequence:** 12-Phase Structured Implementation & Validation  
**Release Target:** v1.8.0

---

## 1. Controlled Execution Roadmap

| Phase | Milestone Scope | Core Implementation Artifacts | Verification Gate |
| :---: | :--- | :--- | :---: |
| **Phase 1** | System Audit & Architecture | `docs/pharmacy/PHARMACY_SYSTEM_AUDIT.md`<br>`docs/pharmacy/PHARMACY_ARCHITECTURE.md`<br>`docs/pharmacy/PHARMACY_MODULE_IMPLEMENTATION_PLAN.md`<br>`docs/pharmacy/PHARMACY_MODULE_DEPENDENCY_MAP.md` | Audit baseline verified |
| **Phase 2** | Database Schema & Migrations | `database/migrations/024_advanced_pharmacy_and_medication_safety.sql` | 14 tables created with RLS and constraints |
| **Phase 3** | Drug Master & Formulary | `backend/src/modules/pharmacy/drug-master.service.ts`<br>`backend/src/modules/pharmacy/drug-master.routes.ts` | Drug catalog & formulary restriction tests pass |
| **Phase 4** | E-Prescriptions & Safety Engine | `backend/src/modules/pharmacy/medication-safety.service.ts`<br>`backend/src/modules/pharmacy/prescription.service.ts` | Allergy, DDI, LASA, signing & override tests pass |
| **Phase 5** | Pharmacist Verification & Dispensing | `backend/src/modules/pharmacy/pharmacy-dispensing.service.ts`<br>Verification queue, substitution, FEFO allocation | Pessimistic locking & FEFO tests pass |
| **Phase 6** | Batch, Expiry, Recall & Cold-Chain | `backend/src/modules/pharmacy/pharmacy-batch.service.ts`<br>Quarantine, Manufacturer recall, Cold-chain logs | Expiry block & recall quarantine tests pass |
| **Phase 7** | Inpatient eMAR & Ward Stock | `backend/src/modules/pharmacy/inpatient-mar.service.ts`<br>eMAR administration, dual-signoff, omissions | eMAR 5-rights & dual cosign tests pass |
| **Phase 8** | Procurement & 3-Way Matching | `backend/src/modules/pharmacy/pharmacy-procurement.service.ts`<br>PR -> PO -> GRN -> Supplier Invoice -> AP Bill | 3-way match & PO approval limits pass |
| **Phase 9** | Controlled Substance Vault | `backend/src/modules/pharmacy/controlled-drugs.service.ts`<br>Schedule X register, wastage witness, count audit | Perpetual narcotic balance tests pass |
| **Phase 10** | RCM Billing & Inter-Branch Stock | `backend/src/modules/pharmacy/pharmacy-billing.service.ts`<br>HSN 3004 GST, GL Journal Vouchers, Inter-branch | Balanced GL entries & tax reports pass |
| **Phase 11** | Frontend Web & Mobile Workspace | `apps/web-portal/src/portals/pharmacy/AdvancedPharmacyHub.tsx`<br>Verification Queue, Dispense, Stock, Recall, eMAR | Production build passes with 0 errors |
| **Phase 12** | Comprehensive Verification & Docs | `backend/tests/advanced_pharmacy_management.test.ts`<br>All 8 documentation deliverables | 14+ automated tests pass, 100% regression pass |

---

## 2. Technical Quality & Safety Rules

1. **Zero Mock Claims**: All medication safety rules, drug interactions, batch movements, eMAR entries, and procurement approvals must be backed by database entities, real services, API routes, automated tests, and compiled UI.
2. **Clinical Safety Priority**: Pharmacist verification and medication safety alerts must operate synchronously before dispensing. Emergency orders follow a high-priority track with retrospective verification logging.
3. **Data Integrity & Traceability**:
   $$\text{Patient} \rightarrow \text{Encounter} \rightarrow \text{Prescription} \rightarrow \text{Pharmacist Verification} \rightarrow \text{Batch Allocation} \rightarrow \text{Dispensing} \rightarrow \text{Invoice} \rightarrow \text{Journal Voucher}$$
   No link in this chain may be deleted or modified without an authorized audit trail.

