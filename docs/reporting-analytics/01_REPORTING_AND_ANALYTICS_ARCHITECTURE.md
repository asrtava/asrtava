# ASRTAVA Reporting and Analytics Architecture

## 1. Architectural Philosophy
ASRTAVA provides a multi-tenant healthcare business intelligence platform embedded directly within the modular monolith. The architecture decouples analytical aggregations from high-frequency transactional clinical tables, using indexed reporting views, materialized aggregates, and asynchronous export workers.

```mermaid
flowchart TD
    subgraph PostgreSQL Transactional Core
        Patients[(patients)]
        Appts[(appointments)]
        Invoices[(invoices & payments)]
        Beds[(beds & admissions)]
        LIMS[(lab_orders & results)]
        Pharma[(medicines & dispenses)]
    end

    subgraph Analytical Query & Aggregation Layer
        MetricReg[Metric Definitions Registry]
        ReportBuilder[Controlled Query Builder Engine]
        Aggregates[(analytics_aggregates)]
        DataQuality[Data Quality Scanner]
    end

    subgraph Presentation & Delivery
        RoleDashboards[10 Role Dashboards]
        Scheduler[Scheduled Delivery Worker]
        ExportEngine[Async CSV / XLSX / PDF Export]
    end

    Patients --> ReportBuilder
    Appts --> ReportBuilder
    Invoices --> ReportBuilder
    Beds --> ReportBuilder
    LIMS --> ReportBuilder
    Pharma --> ReportBuilder

    ReportBuilder --> MetricReg
    ReportBuilder --> Aggregates
    ReportBuilder --> RoleDashboards
    ReportBuilder --> ExportEngine
    Scheduler --> ReportBuilder
    Invoices -.-> DataQuality
    Beds -.-> DataQuality
```

## 2. Core Architectural Pillars
1. **Zero Raw SQL Injections**: Dynamic queries are compiled through `ReportBuilderService` against a strict whitelist of approved datasets, fields, operators, and aggregations.
2. **Tenant Scoping & PostgreSQL RLS**: Every hospital report query automatically injects `where({ hospital_id: hospitalId })`. Super-Admin SaaS metrics run in a segregated platform scope.
3. **Decoupled Financial Domains**: Patient billings (consultations, beds, medicines) are strictly segregated from SaaS recurring subscription invoices (MRR/ARR).
4. **Data Quality Integrity Audits**: Automated background scans verify financial arithmetic, detect duplicate demographic records, and validate bed census consistency.

