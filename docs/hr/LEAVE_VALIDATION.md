# ASRTAVA — Leave Management & Quota Balance Validation

## 1. Overview
ASRTAVA implements a transactional, ledger-based leave management engine where balances are calculated dynamically from approved leave transactions rather than mutable counters.

## 2. Invariants & Balance Verification
1. **Dynamic Balance Checking**: Before a leave request can be submitted, the system checks the employee's closing balance for the relevant leave type and year:
   $$\text{Available Balance} = \text{Opening Balance} + \text{Accrued} - \text{Used}$$
2. **Strict Quota Enforcement**: If the requested days exceed the closing balance, the application is strictly rejected with an insufficient balance error.
3. **Atomic Balance Deduction**: When a Department Incharge approves a leave application, the system increments `used` and reduces `closing_balance` atomically within a single transaction.

