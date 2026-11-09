# ASRTAVA — Advanced Procurement, Inventory & Asset Management Test Plan

## 1. Test Strategy & Scope
This test plan validates the end-to-end operational, logistical, biomedical, and financial integrity of ASRTAVA's complete Procurement, Inventory, and Asset Management subsystem.

The test matrix covers:
1. **Vendor Lifecycle Management**: Registration, tax ID validations (GSTIN/PAN), MSME compliance, bank account profiles, qualification status, and performance ratings.
2. **Multi-Location Hierarchy**: Central warehouse, pharmacy stores, surgical satellite stores, laboratory sub-stores, and emergency wards.
3. **Item Catalog & UOM Conversions**: Master items, categories, batch/serial tracking flags, unit of measure conversions (e.g. Box of 100 to single units), reorder points, and lead time tracking.
4. **Procure-to-Pay (P2P) Lifecycle**:
   - Departmental purchase requisitions and approval hierarchies.
   - Competitive vendor quotation intake and multi-vendor comparison matrices.
   - Purchase order generation with multi-tier GST (CGST/SGST/IGST) calculations.
   - Dock goods receipt (GRN) and automated quarantine hold.
   - Quality inspection gate (sterility, cold chain, packaging) with strict segregation of rejected units.
5. **Stock Movement & Traceability**:
   - FEFO (First-Expiry-First-Out) warehouse transfers to departmental satellite sub-stores.
   - Over-allocation prevention and stock exhaustion blocks.
   - Clinical and departmental consumption logging.
   - Physical inventory cycle counts with automated variance reconciliation.
6. **Finance & General Ledger Integration**:
   - Three-way matching ($PO == GRN == Invoice$) within configurable tolerance.
   - Duplicate invoice rejection.
   - Automatic generation and posting of balanced double-entry Journal Vouchers ($Dr: Inventory + Dr: Input GST == Cr: Vendor Accounts Payable$).
7. **Biomedical Asset & Facility Maintenance**:
   - Fixed and biomedical asset onboarding with unique barcode/asset tags, manufacturer details, and purchase costs.
   - Breakdown ticket creation and automatic asset status lock (`UNDER_REPAIR`).
   - Planned Preventive Maintenance (PPM) scheduling and tracking.
   - Work order resolution with downtime calculation, replacement parts costing, and mandatory return-to-service safety certification.

---

## 2. Test Execution Matrix
| Suite # | Scenario ID | Description | Verification Gate |
|---|---|---|---|
| 01 | `PROC-VEN-01` | Certified Vendor Registration | Validates vendor code, GSTIN, PAN, and rating |
| 02 | `PROC-VEN-02` | Duplicate Vendor Code Prevention | 409 Conflict rejection on duplicate vendor codes |
| 03 | `PROC-LOC-01` | Multi-tier Warehouse Configuration | Central warehouse vs. departmental satellite stores |
| 04 | `PROC-CAT-01` | Item Catalog & Dual UOM Conversion | Automatic conversion factor applied (Box $\to$ Units) |
| 05 | `PROC-REQ-01` | Purchase Requisition & Approval | Multi-item requisition creation and authorization |
| 06 | `PROC-QUO-01` | Quotation Ingestion & Comparison | Multi-vendor side-by-side pricing evaluation |
| 07 | `PROC-ORD-01` | Winning Quote Selection & PO Issuance | PO creation with multi-tier GST breakdown |
| 08 | `PROC-GRN-01` | Dock Goods Receipt (GRN) | Inbound dock intake with initial quarantine hold |
| 09 | `PROC-QUA-01` | QA Inspection & Stock Admission | Accepted units admitted to inventory |
| 10 | `PROC-QUA-02` | Quarantine Segregation of Rejections | Rejections strictly excluded from available balances |
| 11 | `PROC-TRF-01` | FEFO Stock Transfer to Sub-Store | Earliest expiring batches issued first |
| 12 | `PROC-TRF-02` | Over-Allocation Defense | Block transfers exceeding available warehouse stock |
| 13 | `PROC-CON-01` | Clinical Departmental Consumption | Stock deducted from sub-store without double deduction |
| 14 | `PROC-CYC-01` | Physical Cycle Count Reconciliation | Auditable stock adjustment entry created |
| 15 | `PROC-FIN-01` | 3-Way Matching & Balanced GL Posting | $PO == GRN == Invoice$ validated; balanced JV posted |
| 16 | `PROC-AST-01` | Biomedical Asset Breakdown & Certification | Breakdown status lock $\to$ Repair $\to$ Certified operational |

---

## 3. Automation Framework & Environment
- **Runtime**: Node.js v24 + TypeScript (`ts-node`)
- **Test Framework**: Native Node.js `node:test` + `node:assert`
- **Isolation**: Tenant and organization isolation enforced across all database queries.

