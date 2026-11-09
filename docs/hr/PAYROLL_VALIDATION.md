# ASRTAVA — Payroll & General Ledger Financial Integration Validation

## 1. Overview
ASRTAVA incorporates a configurable Indian payroll engine coupled with balanced double-entry accounting integration into the General Ledger (`enterprise_rcm_financial_accounting`).

## 2. Salary Components & Proration
- **Earnings**: Basic Salary (40–50%), House Rent Allowance HRA (20%), Conveyance, Medical, Special Allowance, Night Duty Allowance.
- **Proration Formula**:
  $$\text{Payable Ratio} = \frac{\min(\text{Working Days}, \text{Present Days} + \text{Paid Leave Days})}{\text{Working Days}}$$
- **Statutory Deductions (India)**:
  - **Provident Fund (PF)**: 12% of earned basic salary.
  - **Employee State Insurance (ESI)**: 0.75% of gross earnings (if gross $\le ₹21,000$).
  - **Professional Tax (PT)**: ₹200 standard monthly deduction (subject to state slabs).
  - **TDS / Income Tax**: Section 192 tax deductions projected monthly.

## 3. Double-Entry General Ledger Posting
Once the payroll batch is approved by the CFO / Finance Approver, the system generates a balanced Journal Voucher (JV):
- **Debits**:
  - `SALARY_AND_WAGES_EXPENSE` = Total Gross Earned
- **Credits**:
  - `PROVIDENT_FUND_PAYABLE` = Total PF Deductions
  - `ESI_PAYABLE` = Total ESI Deductions
  - `PROFESSIONAL_TAX_PAYABLE` = Total PT Deductions
  - `TDS_PAYABLE` = Total TDS Deductions
  - `NET_SALARIES_PAYABLE` = Total Net Payable to Staff

### Mathematical Proof of Balance:
$$\sum \text{Debits} = \text{Total Gross} = \text{PF} + \text{ESI} + \text{PT} + \text{TDS} + \text{Net} = \sum \text{Credits}$$

The system strictly validates $\sum \text{Debits} == \sum \text{Credits}$. Any discrepancy halts posting. Furthermore, duplicate posting attempts on an already posted batch throw `409 Conflict`.

