# ASRTAVA Multi-Mode Payment & Cashier Shift Reconciliation

## 1. Multi-Mode Payment Collection Engine

ASRTAVA supports simultaneous split payments across all commercial payment channels:
- **Cash**: Logged to counter physical cash drawer float.
- **UPI QR**: Dynamic UPI QR codes tied to invoice ID and idempotency key.
- **Point of Sale (POS) Card**: Visa, Mastercard, RuPay with authorization code capture.
- **Net Banking / Direct Bank Transfer**: IMPS/NEFT/RTGS with bank reference number.
- **Cheque / Demand Draft**: Cheque number, issuing bank, branch IFSC, and clearing date.
- **Third Party Administrator (TPA) Insurance**: Direct cashless credit line.

### 1.1 Split Payment Example
An inpatient discharge bill of ₹80,000 paid as follows:
- ₹15,000 Cash
- ₹35,000 UPI
- ₹30,000 Health Insurance TPA Claim

**Balanced Journal Entry**:
```
Dr. 1001 Cash in Hand (Counter Float):              ₹ 15,000.00
Dr. 1002 Operating Bank Account (UPI Received):     ₹ 35,000.00
Dr. 1203 Accounts Receivable - TPA Claims:          ₹ 30,000.00
    Cr. 1202 Accounts Receivable - IPD Inpatient:   ₹ 80,000.00
[Balanced: Total Debit ₹80,000 == Total Credit ₹80,000]
```

---

## 2. Cashier Shift Reconciliation (`cashier_shift_reconciliations`)

Every hospital cashier operates under a controlled physical shift (e.g. Morning 08:00–16:00, Evening 16:00–00:00, Night 00:00–08:00).

### 2.1 Shift Closing Mathematical Formula
$$\text{Expected Closing Cash} = \text{Opening Cash Float} + \text{Total Cash Collected} - \text{Total Cash Refunds Disbursed}$$

### 2.2 Blind Count Reconciliations
1. At shift termination, the cashier performs a blind physical cash count (denominations of ₹500, ₹200, ₹100, ₹50, etc.).
2. The cashier submits the physical total without viewing system calculated totals.
3. System computes:
   $$\text{Variance} = \text{Physical Counted Cash} - \text{Expected Closing Cash}$$
4. If $\text{Variance} = 0$, shift is marked `CLOSED_BALANCED`.
5. If $\text{Variance} \neq 0$, shift is flagged `CLOSED_DISCREPANCY` with mandatory supervisor review.

