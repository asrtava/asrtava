# Patient Billing & Payment Gateway Integration

## 1. Overview (`BillingPaymentsScreen.tsx`)
Patients can inspect itemized hospital invoices and settle balances online:
- **Outstanding Balance Banner**: Real-time aggregate of all unpaid accounts across OPD, IPD, and pharmacy.
- **Invoice Ledger**:
  - Unique Invoice Number (e.g. `INV-2026-1043`).
  - Hospital Name, Invoice Date, Service Category.
  - Total Payable with GST itemization.
  - Payment Status (`Paid`, `Unpaid`, `Partially Paid`).
- **Payment Gateway Execution**:
  - Direct integration interface for UPI (Google Pay, PhonePe, Paytm) and Credit/Debit Cards via Razorpay.
  - Backend payment verification stamps payment transaction ID and issues digital receipts.
  - Downloadable official tax receipts with hospital GSTIN.

