# ASRTAVA Accounts Payable (AP) & 3-Way Matching

## 1. Accounts Payable Architecture

ASRTAVA Accounts Payable manages trade liabilities for pharmaceutical distributors, medical equipment vendors, surgical consumable suppliers, and facility service contractors.

```
[Purchase Order (PO)]  +  [Goods Receipt Note (GRN)]  +  [Vendor Invoice (Bill)]
          \                         |                         /
           \                        |                        /
            v                       v                       v
               +-----------------------------------------+
               |        AUTOMATED 3-WAY MATCHING         |
               |  Quantity Check  |  Unit Price Check    |
               +-----------------------------------------+
                                    |
                    +---------------+---------------+
                    |                               |
              [Matched: 100%]               [Discrepancy > 1%]
                    |                               |
                    v                               v
             [Post to AP]                    [Variance Hold]
```

---

## 2. 3-Way Matching Verification Rules

1. **Purchase Order (PO)**: Authorizes purchase quantity and agreed unit rate.
2. **Goods Receipt Note (GRN)**: Confirms physically verified, undamaged inventory received by hospital storekeeper.
3. **Vendor Bill**: Commercial invoice submitted by supplier.

### 2.1 Matching Criteria
- **Quantity Variance**: Billed quantity cannot exceed received quantity on GRN.
- **Price Variance**: Unit rate cannot exceed approved rate on PO by more than 0.5% without managerial signoff.
- **Matching Result**:
  - `MATCHED_3WAY`: Cleared for payment on due date.
  - `VARIANCE_HOLD`: Blocked from payment schedule until purchasing manager reconciles with vendor.

### 2.2 AP General Ledger Posting
```
Vendor Bill: ₹85,000.00
Dr. 5001 Medical Consumables & Surgical Expense:      ₹ 85,000.00
    Cr. 2001 Accounts Payable - Trade Vendors:        ₹ 85,000.00
[Balanced: Total Debit ₹85,000.00 == Total Credit ₹85,000.00]
```

