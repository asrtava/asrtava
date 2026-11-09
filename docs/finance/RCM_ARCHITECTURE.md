# ASRTAVA Revenue Cycle Management (RCM) & Financial Accounting Architecture

## 1. Architectural Overview

ASRTAVA Revenue Cycle Management (RCM) and Financial Accounting Engine is an enterprise-grade, mathematically balanced, double-entry financial subsystem embedded directly within the ASRTAVA Hospital Management System.

Designed to serve single hospitals, multi-specialty tertiary care centers, multi-branch healthcare networks, and nationwide hospital conglomerates, the system bridges clinical operations (consultations, admissions, laboratory orders, imaging scans, surgeries, drug dispensing) with double-entry accounting.

```
+---------------------------------------------------------------------------------------------------+
|                                  CLINICAL & PATIENT ENCOUNTER EVENTS                              |
|  OPD Registration  |  Doctor Encounters  |  IPD Bed Days  |  Diagnostics  |  Pharmacy  |  Surgeries|
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                              UNIFIED CHARGE CAPTURE & TARIFF ENGINE                               |
|  Effective-Dated Tariffs | Multi-Payer Pricing Tiers | Surgical Packages | Indian GST Exemption    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               PATIENT BILLING & LEDGER SUBSYSTEM                                  |
|  Running Folios | Interim Invoices | Multi-Mode Split Payments | Cashless Claims | Credit Notes   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                        DOUBLE-ENTRY GENERAL LEDGER ENGINE (∑ Debits == ∑ Credits)                 |
|  Immutable Journal Vouchers | 5-Category Chart of Accounts | Departmental Cost Center Accounting  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                         +------------------------+------------------------+
                         |                                                 |
                         v                                                 v
+-----------------------------------------------+ +-------------------------------------------------+
|             FINANCIAL STATEMENTS              | |             STATUTORY & TAX COMPLIANCE          |
|  Live Trial Balance | Profit & Loss | Balance | |  Indian GST (GSTR-1, GSTR-3B) | SAC 999312      |
|  Sheet | Accounts Receivable | Accounts Payable| |  Cashier Shift Reconciliations | Bank Settlement|
+-----------------------------------------------+ +-------------------------------------------------+
```

---

## 2. Core Architectural Principles

1. **Strict Double-Entry Bookkeeping**:
   Every monetary transaction generates an immutable journal voucher where $\sum \text{Debits} = \sum \text{Credits}$. The database enforces this with a hard SQL check constraint:
   ```sql
   CONSTRAINT chk_journal_balance CHECK (total_debit = total_credit)
   ```
   Any single-sided or unbalanced posting is rejected before ledger persistence.

2. **Decoupled Clinical vs Financial Clearance**:
   Under emergency and critical clinical workflows (Emergency Triage, ICU Admission, Code Blue Resuscitation), patient care is never blocked by financial status. Clinical services are rendered immediately, and running billing folios accumulate charges asynchronously.

3. **Multi-Payer Tariff Stratification**:
   A single service code (e.g. `CARD-ECHO-2D`) maintains distinct tariff pricing schedules based on payer class:
   - General Cash / Self-Pay
   - Cashless Private Health Insurance (TPA contracted rate)
   - Corporate Panel / PSU rate
   - Ayushman Bharat (AB-PMJAY) government subsidized tariff

4. **Multi-Hospital Entity & Branch Isolation**:
   In a multi-hospital group, each hospital branch maintains independent general ledgers, bank floats, and cashier reconciliations. Inter-branch cross-charges (e.g. referral lab testing performed at Delhi Main for a patient admitted at Noida Branch) generate self-balancing Inter-Branch Due-To / Due-From journal entries.

5. **Offline & Air-Gapped Financial Resilience**:
   In on-premises and hybrid hospital deployments with severed external connectivity, cashier counters, running charge capture, and double-entry validations continue uninterrupted using local cryptographic database storage.

