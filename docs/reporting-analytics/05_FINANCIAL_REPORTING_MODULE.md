# ASRTAVA Financial Reporting Module

## 1. Accounting Methodology & Definitions
ASRTAVA strictly distinguishes between different accounting categories:
- **Gross Revenue Recognized**: Total value of clinical services rendered and billed during the period, regardless of whether cash has been received.
- **Taxes (GST 18%)**: Statutory tax liabilities collected on behalf of tax authorities.
- **Net Collections**: Actual currency received through Cash, UPI/QR, Debit/Credit Cards, or Insurance TPA settlement.
- **Accounts Receivable (Outstanding)**: Unpaid balance remaining on generated invoices.
- **Refunds**: Authorized patient reimbursements issued with manager dual-sign approval.

## 2. Settlement Equation
For any given closed billing batch:
$$\text{Gross Revenue} + \text{Tax Liabilities} - \text{Discounts} = \text{Collections} + \text{Outstanding Receivables}$$

## 3. Financial Endpoints
- `GET /api/v1/reports/analytics/finance`: Complete financial ledger and reconciliation status.
- `GET /api/v1/reports/dashboards/finance`: Department revenue, payment method breakdowns, and daily collection totals.

