# ASRTAVA — Advanced Procurement, Inventory & Asset Management API Specification

All routes are mounted at `/api/v1/procurement/advanced` and protected by authentication and tenant context middleware.

---

## 1. Vendor & Warehouse Endpoints
- `POST /api/v1/procurement/advanced/vendors`: Register a certified vendor with GSTIN, PAN, bank details, and compliance rating.
- `GET /api/v1/procurement/advanced/vendors`: List vendors with performance tier filtering.
- `POST /api/v1/procurement/advanced/warehouses`: Configure central or departmental sub-stores (OT, Pharmacy, Lab, ICU, Emergency).
- `GET /api/v1/procurement/advanced/warehouses`: Retrieve all active storage locations.

---

## 2. Catalog & Requisitions
- `POST /api/v1/procurement/advanced/items`: Create catalog items with dual UOM conversion factor (e.g. Box to Units).
- `GET /api/v1/procurement/advanced/items`: Search item catalog with reorder point status.
- `POST /api/v1/procurement/advanced/requisitions`: Submit purchase requisition from clinical departments.
- `POST /api/v1/procurement/advanced/requisitions/:id/approve`: Department head / finance authorization.

---

## 3. Quotation Comparison & Purchase Orders
- `POST /api/v1/procurement/advanced/quotations`: Ingest supplier quotation responses.
- `GET /api/v1/procurement/advanced/quotations/compare/:requisitionId`: Side-by-side comparative ranking.
- `POST /api/v1/procurement/advanced/purchase-orders`: Generate PO with multi-tier GST breakdown (CGST/SGST/IGST).
- `GET /api/v1/procurement/advanced/purchase-orders`: List purchase orders by status.

---

## 4. Goods Receipt & Quality Control
- `POST /api/v1/procurement/advanced/grn`: Create inbound Goods Receipt Note at dock with initial quarantine status.
- `POST /api/v1/procurement/advanced/inspections`: Submit QA inspection results (Accepted vs. Rejected quantities).

---

## 5. Stock Movement & Inventory Reconciliation
- `POST /api/v1/procurement/advanced/transfers`: Issue stock to departmental sub-stores using FEFO.
- `POST /api/v1/procurement/advanced/consumption`: Record clinical and departmental consumption.
- `POST /api/v1/procurement/advanced/cycle-counts`: Record physical cycle count with automatic variance adjustment.
- `GET /api/v1/procurement/advanced/stock`: Real-time stock balance query by item and warehouse.

---

## 6. Three-Way Matching & General Ledger
- `POST /api/v1/procurement/advanced/invoices/match-and-post`: Execute 3-way matching ($PO == GRN == Invoice$) and post balanced Journal Voucher.

---

## 7. Biomedical Assets & Maintenance
- `POST /api/v1/procurement/advanced/assets`: Register fixed or biomedical asset with barcode tag and serial number.
- `GET /api/v1/procurement/advanced/assets`: List equipment with operational status (`OPERATIONAL`, `UNDER_REPAIR`, `MAINTENANCE`).
- `POST /api/v1/procurement/advanced/work-orders`: Log breakdown or service request (automatically flips asset to `UNDER_REPAIR`).
- `POST /api/v1/procurement/advanced/work-orders/:id/resolve`: Resolve work order, log downtime, and certify safety check for return-to-service.

