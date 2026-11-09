# Module 11: Billing & Invoice Management Specification

## 1. Overview
The Billing & Finance module coordinates hospital revenue cycle management: decimal-safe financial calculations, consolidated multi-service patient invoices (OPD consultations, room rent, pharmacy, labs, surgery), Indian GST compliance, advance deposits, credit notes, and role-based refund approvals.

---

## 2. Core Functional Capabilities

### 1. Decimal-Safe Monetary Arithmetic
To prevent floating-point calculation drift in financial ledgers:
- Monetary amounts in the database are stored as `DECIMAL(12,2)`.
- Internal arithmetic calculates integer cents/paise and normalizes with explicit rounding:
  $$\text{Line Tax} = \text{round}\left(\text{Quantity} \times \text{Unit Rate} \times \frac{\text{Tax Rate}}{100}\right)$$
  $$\text{Net Payable} = \text{Gross Amount} + \text{Tax Amount} - \text{Discount}$$

### 2. Consolidated Patient Invoices
Combines line items across hospital departments into a single billing document:
- Unique sequential invoice number: `INV-XXXXX`.
- Captures service type (`consultation`, `room_rent`, `pharmacy`, `lab`, `surgery`), quantity, unit price, GST rate (5%, 12%, 18%), and line total.
- Double-entry accounting transaction automatically logged in `financial_transactions`.

### 3. Refunds & Credit Notes
- Unauthorized direct edits to finalized invoices are strictly prohibited.
- Corrections require a formal refund request with documented clinical/billing reason.
- Supervisors approve refunds via `POST /api/v1/billing/refunds/:id/approve`, issuing an offsetting credit note.

---

## 3. API Endpoints
- `POST /api/v1/billing/invoices`: Generate consolidated patient invoice with itemized breakdown.
- `POST /api/v1/billing/payments`: Collect payment with transaction idempotency key.
- `POST /api/v1/billing/refunds`: Submit refund request with approval workflow.
- `PATCH /api/v1/billing/refunds/:id/approve`: Authorize and disburse refund.

