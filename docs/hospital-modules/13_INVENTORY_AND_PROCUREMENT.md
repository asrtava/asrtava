# Module 13: Hospital-Wide Inventory & Procurement Specification

## 1. Overview
The Inventory & Procurement module manages supply chain operations across central warehouses and departmental sub-stores: approved vendor catalogs, purchase requests, purchase orders (PO), Goods Receipt Notes (GRN), and perpetual stock ledgers.

---

## 2. Core Functional Capabilities

### 1. Procurement Lifecycle Workflow
```
[Reorder Trigger] ────► [Purchase Request] ────► [Approval] ────► [Purchase Order (PO)]
                                                                          │
  ┌───────────────────────────────────────────────────────────────────────┘
  ▼
[Physical Delivery] ──► [Goods Receipt Note (GRN)] ──► [Stock Ledger Intake] ──► [Invoice Payment]
```

### 2. Goods Receipt Note (GRN) Inspection
When a shipment arrives at the central warehouse:
- The receiving clerk verifies item packaging, quantities, and manufacturer batch numbers against the PO.
- Records manufacturing date, expiration date, and assigns warehouse bin location.
- Automatically increments warehouse on-hand stock in transactional ledger.

---

## 3. API Endpoints
- `GET /api/v1/pharmacy/medicines`: View catalog inventory and threshold warnings.
- `POST /api/v1/pharmacy/batches`: Ingest physical batch via GRN receipt.
- `POST /api/v1/pharmacy/dispense`: Decrement stock via patient dispensing.

