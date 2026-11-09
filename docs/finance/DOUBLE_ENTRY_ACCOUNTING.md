# ASRTAVA Double-Entry General Ledger Engine

## 1. Mathematical Foundations & Invariants

ASRTAVA implements a standard double-entry bookkeeping engine. Every financial entry consists of at least two split lines, and must satisfy the fundamental accounting equation:

$$\text{Assets} = \text{Liabilities} + \text{Equity} + (\text{Revenues} - \text{Expenses})$$

### 1.1 Invariant Check Constraint
The database layer enforces mathematical equilibrium across all posted transactions:
```sql
CONSTRAINT chk_journal_balance CHECK (total_debit = total_credit)
```
Any transaction where $|\sum \text{Debits} - \sum \text{Credits}| > 0.001$ throws an immediate `JOURNAL_UNBALANCED_ERROR` and aborts.

---

## 2. Standard Hospital Chart of Accounts (COA)

| Code | Account Title | Classification | Normal Balance |
| :--- | :--- | :--- | :--- |
| **1001** | Cash in Hand (Counter Float) | ASSET | DEBIT |
| **1002** | Hospital Operating Bank Account | ASSET | DEBIT |
| **1201** | Accounts Receivable - Outpatient (OPD) | ASSET | DEBIT |
| **1202** | Accounts Receivable - Inpatient (IPD) | ASSET | DEBIT |
| **1203** | Accounts Receivable - TPA Insurance | ASSET | DEBIT |
| **1204** | Accounts Receivable - Corporate Panels | ASSET | DEBIT |
| **1301** | Pharmaceutical Inventory | ASSET | DEBIT |
| **2001** | Accounts Payable - Trade Vendors | LIABILITY | CREDIT |
| **2002** | CGST Output Tax Payable (9%) | LIABILITY | CREDIT |
| **2003** | SGST Output Tax Payable (9%) | LIABILITY | CREDIT |
| **2004** | IGST Output Tax Payable (18%) | LIABILITY | CREDIT |
| **2101** | Patient Deposits & Advances | LIABILITY | CREDIT |
| **3001** | Hospital Capital & Retained Earnings | EQUITY | CREDIT |
| **4001** | OPD Consultation Revenue | REVENUE | CREDIT |
| **4002** | IPD Room & Nursing Care Revenue | REVENUE | CREDIT |
| **4003** | Laboratory Diagnostic Revenue | REVENUE | CREDIT |
| **4004** | Radiology Imaging Revenue | REVENUE | CREDIT |
| **4005** | Pharmacy Sales Revenue | REVENUE | CREDIT |
| **4006** | Operation Theatre & Surgery Revenue | REVENUE | CREDIT |
| **4007** | Emergency Care Revenue | REVENUE | CREDIT |
| **5001** | Medical Consumables & Surgical Expense | EXPENSE | DEBIT |
| **5002** | Hospital Doctor & Staff Salaries | EXPENSE | DEBIT |
| **5003** | Hospital Maintenance & Utilities | EXPENSE | DEBIT |
| **5004** | Discounts & Contractual Deductions | EXPENSE | DEBIT |

