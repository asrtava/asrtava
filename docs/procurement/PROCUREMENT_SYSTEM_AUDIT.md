# ASRTAVA — Procurement, Inventory, Asset & Facility Management System Audit

## 1. Executive Summary & Purpose
This audit analyzes existing purchasing, inventory, warehouse, equipment asset, and maintenance structures across the ASRTAVA healthcare platform prior to implementing Prompt 25.

Currently, ASRTAVA features basic pharmacy-oriented purchasing tables (`suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipt_notes`) created in Migration 008, and rudimentary catalog views in `InventoryDashboard.tsx`. However, real-world multi-specialty hospital operations require a unified enterprise procurement, inventory, fixed-asset, and facility management system covering:
- **Centralized Procurement**: Requisitions, RFQs, vendor quotation side-by-side comparisons, PO amendments, 3-way matching.
- **Unified Inventory**: Central warehouses, department sub-stores (Pharmacy, Laboratory, Radiology, OT, ICU, Wards), batch/lot/serial tracking, FEFO/FIFO dispatch, UOM conversion factors.
- **Biomedical & Fixed Asset Management**: Commissioning, asset tagging, PPM (Planned Preventive Maintenance) schedules, calibration logs, breakdown tickets, and downtime tracking.
- **Hospital Infrastructure & Facility Operations**: HVAC, electrical generators, medical gas pipeline systems (MGPS), plumbing, and fire safety systems.
- **Financial Integration**: Three-way matching (PO $\leftrightarrow$ GRN $\leftrightarrow$ Supplier Invoice) posting balanced accounts payable entries to General Ledger.

---

## 2. Existing Database Schema Audit

| Table | Migration | Fields | Limitations for Enterprise Procurement |
| :--- | :--- | :--- | :--- |
| `medicines` | Migration 008 | `id`, `hospital_id`, `item_code`, `name`, `brand_name`, `category`, `reorder_level` | Restricted to pharmaceuticals; non-medical consumables, surgical instruments, and capital equipment missing |
| `suppliers` | Migration 008 | `id`, `hospital_id`, `name`, `phone`, `gst_number`, `payment_terms` | Missing vendor verification, tax classification, bank account details, performance scores, document attachments |
| `purchase_orders` | Migration 008 | `id`, `hospital_id`, `supplier_id`, `po_number`, `total_amount`, `status` | Missing requisition linkage, quotation references, shipping addresses, tax breakdowns, amendment history |
| `goods_receipt_notes` | Migration 008 | `id`, `hospital_id`, `purchase_order_id`, `grn_number`, `total_received_value` | Flat record; missing itemized accepted/rejected/quarantined breakdown, quality inspection sign-off, supplier returns |
| `pharmacy_batches` | Migration 008 | `id`, `medicine_id`, `batch_number`, `expiry_date`, `current_stock` | Strictly pharmacy-isolated; cannot represent surgical meshes, radiology contrast lots, or biomedical equipment serials |

---

## 3. Integration & Reusability Strategy

1. **Unified Item Catalog**: Build `proc_items` supporting medical, surgical, diagnostic reagent, pharmaceutical, IT, and facility categories with consumption vs purchase units of measurement (UOM) and conversion factors.
2. **Multi-Store Hierarchy**:
   $$\text{Organization} \rightarrow \text{Hospital Group} \rightarrow \text{Hospital} \rightarrow \text{Branch} \rightarrow \text{Central Warehouse} \rightarrow \text{Department Sub-Stores}$$
3. **Clinical Consumption Decoupling**: Integrate directly with eMAR (Nursing), OT surgical instrument counts, and Laboratory analyzer consumables without duplicate inventory deductions.
4. **Three-Way Matching**: Connect PO, GRN, and Supplier Invoice to prevent double payments and ensure automatic balanced General Ledger posting ($\text{Debit Inventory/Asset} == \text{Credit Accounts Payable}$).

