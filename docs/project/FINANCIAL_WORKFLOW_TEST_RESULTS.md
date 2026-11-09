# ASRTAVA — Financial Lifecycle & Billing Reconciliation Test Results

**Test Suite:** `backend/tests/real_world_hospital_simulation.test.ts`  
**Execution Timestamp:** 2026-11-09T12:21:54Z  
**Duration:** 8.773ms  
**Result:** **100% PASSED (0 Failures)**

---

## 1. Test Execution Breakdown

| Step | Operation Tested | Expected Behavior | Actual Observed Outcome | Verdict |
|------|------------------|-------------------|-------------------------|---------|
| 5.1 | Invoice Generation | Invoice `INV-FIN-001` created for ₹10,000.00; status `unpaid`. | Invoice initialized with ₹10,000.00 net payable. | **PASS** |
| 5.2 | Partial Advance Payment | Advance payment of ₹4,000.00 processed; status updates to `partially_paid`. | Status = `partially_paid`, balance = ₹6,000.00. | **PASS** |
| 5.3 | Final Settlement | Remaining ₹6,000.00 collected; total paid reaches ₹10,000.00; status `paid`. | Total paid = ₹10,000.00, status = `paid`. | **PASS** |
| 5.4 | Unauthorized Refund Attempt | Refund request without supervisor PIN is rejected. | Threw `INVALID_SUPERVISOR_PIN_AUTHORIZATION`. Blocked. | **PASS** |
| 5.5 | Supervisor-PIN Authorized Refund | Refund of ₹1,500.00 with supervisor PIN `9944` and audit reason succeeds. | Refund `REF-1` created; paidAmount reduced to ₹8,500.00; status `refunded_partially`. | **PASS** |

---

## 2. Technical Evidence & Logs

```
▶ Scenario 5: Multi-Mode Billing, Decimal Arithmetic & Supervisor-PIN Authorized Refund (8.7732ms)
  ✔ Invoice INV-FIN-001 created for ₹10,000.00
  ✔ Partial advance payment ₹4,000.00 -> Status: partially_paid
  ✔ Final payment ₹6,000.00 -> Status: paid (Total: ₹10,000.00)
  ✔ Unauthorized refund attempt with invalid PIN '0000' rejected
  ✔ Authorized refund ₹1,500.00 with supervisor PIN '9944' processed
  ✔ Ledger reconciled: Balance ₹8,500.00, Status: refunded_partially
```

