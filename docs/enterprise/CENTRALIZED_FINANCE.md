# ASRTAVA Centralized Finance & Inter-Branch Accounting

## 1. Executive Summary

Enterprise healthcare organizations require group-wide financial consolidation (executive balance sheets, cash flow tracking, consolidated revenue) while maintaining independent legal accounting entities and statutory audit compliance for each hospital.

ASRTAVA's Centralized Finance Engine provides consolidated financial analytics without commingling legal accounting ledgers.

---

## 2. Multi-Facility Accounting Architecture

Every financial event (invoice, receipt, debit note, refund) is permanently bound to its legal entity:

```
[ Group Corporate Finance Holding ] (Consolidated Dashboard & Tax Reporting)
       │
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[ Hospital Delhi Legal Ledger ]   [ Hospital Bengaluru Legal Ledger ]   [ Clinic Hyderabad Ledger ]
  (GSTIN: 07AAACG9988P1Z5)          (GSTIN: 29AAACG9988P1Z1)              (GSTIN: 36AAACG9988P1Z8)
```

---

## 3. Inter-Branch Financial Transactions

When hospitals within a group share resources, equipment, ambulances, or corporate management services, the system logs verifiable inter-branch transactions:

```sql
CREATE TABLE inter_branch_financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    debited_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    credited_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'INR',
    category VARCHAR(50) NOT NULL CHECK (category IN ('shared_service', 'patient_transfer_charge', 'stock_reimbursement', 'management_fee')),
    reference_document_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'settled', 'disputed')),
    authorized_by UUID REFERENCES users(id),
    settled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Transaction Settlement Lifecycle
1. `pending_approval`: Automatically created when an inter-branch service occurs (e.g., patient transfer transport charge or bulk medicine transfer).
2. `approved`: Reviewed and accepted by the debited hospital's finance controller.
3. `settled`: Closed during monthly inter-company ledger reconciliation with explicit audit timestamps.
4. `disputed`: Held for executive review if tariff rates or quantity discrepancies arise.

---

## 4. Group Consolidated Reporting

The consolidated revenue dashboard aggregates:
- **Gross Hospital Revenue**: Sum of all OPD, IPD, and pharmacy receipts across group hospitals.
- **Outstanding Receivables**: Real-time tracking of unpaid insurance/TPA claims and patient balances.
- **Inter-Company Elimination**: Automatically eliminates internal inter-branch charges during corporate consolidation to present clean, uninflated group P&L statements.

