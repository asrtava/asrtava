# ASRTAVA Bank & Cash Treasury Management

## 1. Cash Counter Float Governance

Every physical counter (Reception, OPD Billing, Emergency, Pharmacy, IPD Cashier) operates with a sanctioned opening float:
- Standard morning float: ₹5,000.00
- Emergency 24/7 counter float: ₹10,000.00
- Safe handover protocol: Float is physically counted and digitally acknowledged by the incoming cashier at shift handoff.

---

## 2. Bank Account Management (`bank_accounts`)

Hospitals configure multiple operational bank accounts:
1. **Operating Collection Account**: Receives patient UPI, card POS settlements, and direct IMPS/NEFT remittances.
2. **Vendor Disbursement Account**: Used exclusively for vendor NEFT/RTGS payouts.
3. **Escrow / TPA Account**: Handles insurance claim remittances and corporate panel transfers.

### 2.1 Daily Bank Reconciliation
- Electronic bank statements (MT940 / CSV) are matched against system receipts using transaction reference IDs.
- Unmatched transactions are flagged for manual bank clearance review.

