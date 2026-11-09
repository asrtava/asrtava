# ASRTAVA Analytics Database Architecture

## 1. Schema Extensions
Migration `017_reporting_analytics.sql` introduces 16 dedicated relational tables to support analytics:
- `metric_definitions`: Master catalogue of KPIs, formulas, and units.
- `report_categories` & `report_definitions`: Standard and custom report metadata.
- `report_field_definitions`: Whitelisted queryable fields, types, and allowed aggregations.
- `saved_reports`: User-saved custom report templates and chart preferences.
- `report_schedules`: Automated delivery cron schedules.
- `report_delivery_logs`: Audit trail for dispatched scheduled reports.
- `report_export_jobs`: Asynchronous export progress and expiring download tokens.
- `analytics_aggregates`: Pre-computed hourly/daily rollup snapshot cache.
- `analytics_refresh_jobs`: Batch aggregation processing logs.
- `analytics_data_quality_logs`: Automated integrity discrepancy alerts.
- `dashboard_configurations`: User-customized role dashboard widget layouts.

## 2. Row-Level Security (RLS)
All tenant analytics tables enforce PostgreSQL Row-Level Security:
```sql
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregates ENABLE ROW LEVEL SECURITY;
```
Indexes on `(hospital_id, metric_code, period_type, period_start)` guarantee sub-millisecond retrieval of pre-aggregated KPIs.

