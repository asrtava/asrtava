# ASRTAVA Controlled Report Builder

## 1. Zero-SQL-Injection Architecture
Unlike fragile systems that execute raw user-supplied SQL text, ASRTAVA implements a controlled Abstract Syntax Tree (AST) query builder in `ReportBuilderService`. Every query must conform to:
1. **Whitelisted Datasets**: `appointments`, `invoices`, `beds`, `patients`, `lab_orders`, `pharmacy_sales`.
2. **Whitelisted Fields**: Only fields explicitly enumerated in dataset configurations can be selected, filtered, or grouped.
3. **Safe Parameterized Filters**: Uses Knex parameterized bindings for operators (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `contains`, `between`, `in`).
4. **Mandatory Tenant Context**: Automatically scopes queries with `WHERE hospital_id = req.hospitalId`.
5. **Pagination Clamping**: Maximum limit capped at 1,000 records per query to protect database resources.

## 2. API Contract
`POST /api/v1/reports/query`
```json
{
  "dataset": "invoices",
  "fields": ["invoice_number", "billing_category", "gross_amount", "net_payable", "payment_status"],
  "filters": [
    { "field": "payment_status", "operator": "eq", "value": "unpaid" },
    { "field": "gross_amount", "operator": "gt", "value": 5000 }
  ],
  "dateRange": {
    "field": "created_at",
    "startDate": "2026-10-01",
    "endDate": "2026-10-31"
  },
  "page": 1,
  "limit": 50
}
```

