# ASRTAVA Refunds, Credit Notes & Cancellation Governance

## 1. Supervisor-Authorized Refund Workflow

Patient refunds are high-risk financial events that require strict segregation of duties and cryptographic supervisor signoff.

### 1.1 Refund Authorization Safeguards
- A billing clerk cannot unilaterally disburse cash or execute an electronic refund.
- Every refund request requires a 4-digit supervisor authorization PIN (`1234` or configured managerial PIN) and valid reason category:
  1. `overpayment`: Patient deposit exceeded final discharge bill.
  2. `cancelled_service`: Investigation or consultation cancelled prior to procedure.
  3. `billing_error`: Incorrect tariff or redundant item entered.
  4. `patient_discharge_adjustment`: Clinical discount authorized by medical superintendent.

### 1.2 Statutory Credit Note Issuance
Every authorized refund automatically issues a sequential, GST-compliant Credit Note (`CN-YYYY-XXXXXX`).

### 1.3 Reversing Journal Voucher
```
Refund Amount: ₹2,500.00
Dr. 5004 Discounts & Refunds:                       ₹ 2,500.00
    Cr. 1001 Cash in Hand / 1002 Operating Bank:    ₹ 2,500.00
[Balanced: Total Debit ₹2,500.00 == Total Credit ₹2,500.00]
```

---

## 2. Service Cancellation Rules
- Services that have not been performed (e.g. unperformed ultrasound, uncollected blood sample) can be cancelled by the order clerk with supervisor approval.
- Services already marked `IN_PROGRESS` or `COMPLETED` by clinical departments cannot be cancelled; they must undergo clinical return or credit note processing.

