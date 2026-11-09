# ASRTAVA Corporate & Institutional Credit Billing

## 1. Corporate Panel Architecture

ASRTAVA supports enterprise corporate panels, public sector undertakings (PSUs), government credit programs (e.g. CGHS, ECHS, Railways), and university health plans via the `corporate_accounts` subsystem.

### 1.1 Account Configuration
- Corporate entity master profile: legal name, corporate GSTIN, contracted tariff schedule, credit limit, credit period (e.g. 30, 45, or 60 days).
- Employee / Dependent eligibility validation: corporate employee ID check, HR referral letter or smart card verification.

### 1.2 Credit Limit Governance
- When a corporate patient's running bill approaches the company's approved credit limit, the system alerts the corporate relations desk.
- Pre-authorized credit limit extensions can be approved by hospital management with supervisor authorization.

---

## 2. Periodic Consolidated Invoicing & Settlement

1. **Billing Cycle**:
   - Monthly or bi-weekly automated consolidation of all closed corporate encounters.
   - Generation of consolidated corporate invoice with itemized patient treatment summaries.

2. **Corporate AR Accounting**:
   ```
   Posting Date: End of Billing Cycle
   Dr. 1204 Accounts Receivable - Corporate Panels
       Cr. 4001 OPD Consultation Revenue
       Cr. 4002 IPD Room & Care Revenue
       Cr. 4003 Laboratory Diagnostic Revenue
       Cr. 4004 Radiology Imaging Revenue
   ```

3. **Settlement & TDS Deduction**:
   - When corporate remittance is received via NEFT/RTGS:
   ```
   Dr. 1002 Hospital Operating Bank Account (Net received)
   Dr. 1205 Tax Deducted at Source (TDS Receivable - Section 194J/194C)
   Dr. 5004 Disallowed Tariff Deductions
       Cr. 1204 Accounts Receivable - Corporate Panels
   ```

