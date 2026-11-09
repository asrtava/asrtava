# ASRTAVA — Procurement, Inventory & Asset Implementation Plan

## 1. Overview & Objectives
This document establishes the implementation roadmap for Prompt 25 of 30: Complete Procurement, Vendor Management, Purchase Orders, Inventory, Asset Management, Maintenance & Hospital Facility Management.

---

## 2. Phased Roadmap

### Phase 1: Existing System Audit & Architectural Design
- Conduct audit across existing inventory, pharmacy, OT, and accounting models.
- Create `docs/procurement/PROCUREMENT_SYSTEM_AUDIT.md`, `docs/procurement/PROCUREMENT_ARCHITECTURE.md`, `docs/procurement/INVENTORY_WORKFLOW_MAP.md`, `docs/procurement/ASSET_LIFECYCLE_MAP.md`, `docs/procurement/PROCUREMENT_IMPLEMENTATION_PLAN.md`.

### Phase 2: Database Migration (`032_complete_procurement_inventory_and_asset_management.sql`)
- Create 18 relational tables with Row-Level Security (RLS) and compound indexes:
  1. `proc_vendors`: Comprehensive vendor master, GSTIN, PAN, bank details, quality certification.
  2. `proc_warehouses`: Central warehouses and department sub-stores.
  3. `proc_items`: Master item catalog (medical consumables, reagents, drugs, surgical sets, assets).
  4. `proc_item_uom_conversions`: Purchase UOM to consumption UOM conversion factors.
  5. `proc_stock_batches`: Batch/lot/serial tracking, manufacturing/expiry dates, storage bins.
  6. `proc_stock_balances`: Real-time stock counts by item, batch, and warehouse.
  7. `proc_stock_movements`: Auditable transaction ledger for receipts, issues, transfers, adjustments.
  8. `proc_purchase_requisitions`: Departmental purchase requests with priority and approvals.
  9. `proc_quotations`: Vendor RFQ responses, pricing, lead time, and warranty terms.
  10. `proc_purchase_orders`: Versioned POs with line items, tax rates, delivery schedules.
  11. `proc_purchase_order_items`: Line items with ordered, received, and balance quantities.
  12. `proc_goods_receipt_notes`: GRN receiving documentation.
  13. `proc_quality_inspections`: Accepted vs rejected vs quarantined inspection ledger.
  14. `proc_supplier_invoices`: Invoices linked to PO and GRN for 3-way matching.
  15. `proc_assets`: Fixed assets and biomedical equipment master register.
  16. `proc_maintenance_schedules`: PPM calibration and scheduled service routines.
  17. `proc_work_orders`: Corrective breakdown repair tickets with downtime tracking.
  18. `proc_service_contracts`: Vendor AMC, CMC, and warranty contracts with renewal alerts.

### Phase 3: Backend Service & Routes Implementation
- Build `backend/src/modules/inventory/procurement-advanced.service.ts` implementing:
  - Vendor lifecycle & rating.
  - Requisition $\rightarrow$ Quotation Comparison $\rightarrow$ PO workflow.
  - GRN & Quality Inspection quarantine gating.
  - Multi-location stock movement & FEFO allocation.
  - Automated reorder point alerts.
  - 3-Way matching and General Ledger balancing.
  - Asset PPM and breakdown maintenance ticketing.
- Build `backend/src/modules/inventory/procurement-advanced.routes.ts` providing REST API endpoints.
- Mount routes at `/api/v1/procurement/advanced` in `backend/src/server.ts`.

### Phase 4: Frontend Workspace Development
- Build `apps/web-portal/src/portals/inventory/AdvancedProcurementHub.tsx` with dedicated tabs for:
  - Procurement Pipeline (Requisitions, Comparisons, Purchase Orders)
  - Goods Receipt (GRN) & Quality Inspection Gate
  - Central Inventory & Department Sub-Store Stock
  - Stock Movement Ledger & Physical Cycle Count
  - Biomedical Equipment & Asset Register
  - Maintenance Work Orders & Facility Operations
  - Vendor Directory & 3-Way Invoice Matching
- Integrate into `apps/web-portal/src/portals/inventory/InventoryDashboard.tsx`.

### Phase 5: Automated Testing & Verification
- Author `backend/tests/advanced_procurement_inventory_management.test.ts` (16 end-to-end scenarios).
- Verify 100% test pass rate.
- Execute cumulative project regression suite (422+ tests passed with 0 failures).

### Phase 6: Documentation & Governance Updates
- Complete documentation files in `docs/procurement/` and update project governance records.

