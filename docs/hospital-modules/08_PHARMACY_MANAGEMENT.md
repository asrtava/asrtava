# Module 08: Pharmacy & Inventory Management Specification

## 1. Overview
The Pharmacy module manages the hospital drug formulary, batch-level inventory tracking with expiration dates, First Expire First Out (FEFO) dispensing, Point-of-Sale (POS) over-the-counter sales, and transactional stock ledgers.

---

## 2. Core Functional Capabilities

### 1. First Expire First Out (FEFO) Dispensing
When medications are dispensed from outpatient prescriptions or inpatient medication carts:
1. Batches are sorted ascending by expiration date:
   $$\text{Batch}_1 (\text{Earliest Expiry}) \to \text{Batch}_2 \to \dots \to \text{Batch}_n$$
2. Each batch row is locked pessimistically (`SELECT ... FOR UPDATE`) to prevent race conditions during concurrent dispensing.
3. Quantities are deducted transactionally. Negative stock is strictly disallowed.
4. Each deduction creates an immutable audit record in `pharmacy_stock_movements`.

### 2. Point-of-Sale (POS) Counter Retail Sales
Walk-in OTC transactions calculate subtotal, 12% GST, and accept immediate payment via Cash, Card, or UPI, generating a retail invoice without requiring a formal clinical encounter.

### 3. Expiration & Low-Stock Alerts
- **Near-Expiry Warning**: Flags batches with expiration dates $< 60\text{ days}$.
- **Reorder Threshold**: Alerts purchasing managers when total available stock across batches drops below the item's configured `reorder_level`.

---

## 3. API Endpoints
- `GET /api/v1/pharmacy/medicines`: Search medicines catalog with aggregated available stock.
- `POST /api/v1/pharmacy/medicines`: Add formulation to hospital formulary.
- `POST /api/v1/pharmacy/batches`: Ingest newly received manufacturer batch.
- `POST /api/v1/pharmacy/dispense`: Atomic FEFO dispensing with inventory decrements.

