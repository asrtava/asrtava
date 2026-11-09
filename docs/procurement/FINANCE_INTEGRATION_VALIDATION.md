# ASRTAVA — Finance & General Ledger 3-Way Matching Validation

## 1. Overview
The Procurement-to-Finance boundary guarantees rigorous accounts payable verification. Supplier invoices cannot be scheduled for disbursement until validated against both the original authorized Purchase Order and dock-certified Goods Receipt Note (3-Way Matching).

---

## 2. Three-Way Matching Rules
$$\Delta = |\text{Invoice Amount} - \text{PO Amount}| \le \text{Configured Tolerance (₹0.05)}$$
$$\text{Invoiced Quantity} \le \text{Inspected & Accepted GRN Quantity}$$

```
    [Purchase Order] ────────┐
                             ▼
    [Goods Receipt Note] ───► [Three-Way Matching Engine]
                             ▲
    [Supplier Invoice] ──────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Discrepancy Detected]             [3-Way Match Verified]
            │                                 │
    (Hold for review)                         ▼
                                   [Automated Journal Entry]
                                   Dr: Inventory Asset Account
                                   Dr: Input GST Account
                                   Cr: Accounts Payable Vendor
```

---

## 3. General Ledger Posting Invariant
Upon successful 3-way matching, ASRTAVA posts a balanced Journal Voucher into the General Ledger:
- **Debit**: Current Assets — Inventory (Account `#1300`): Invoiced base item cost.
- **Debit**: Current Assets — Input GST Recoverable (Account `#1420`): CGST/SGST/IGST tax amount.
- **Credit**: Current Liabilities — Accounts Payable (Account `#2100`): Full payable amount due to vendor.
- **Invariant**: $\sum \text{Debits} == \sum \text{Credits}$. Unbalanced transactions are rejected by database triggers.
- **Duplicate Prevention**: Ingesting identical `vendor_id` + `vendor_invoice_number` triggers a `409 Conflict` to prevent double payment.

