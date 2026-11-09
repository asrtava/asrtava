# ASRTAVA Reporting & Analytics API Documentation

Base URL: `http://localhost:5000/api/v1/reports`

## 1. Endpoints Specification

### 1.1 Metrics & Datasets
- `GET /metrics`: Lists all registered KPI definitions, mathematical formulas, and units.
- `GET /datasets`: Lists all whitelisted queryable datasets and allowed fields.

### 1.2 Role Dashboards
- `GET /dashboards/:role`: Returns structured operational data for the specified role (`owner`, `admin`, `doctor`, `nursing`, `reception`, `pharmacy`, `laboratory`, `finance`, `hr`, `super-admin`).
- `GET /executive-overview`: Backward-compatible executive overview summary.

### 1.3 Specialized Analytics
- `GET /analytics/patients`: Patient demographics, gender breakdown, age cohorts, retention.
- `GET /analytics/appointments`: OPD queue volume, peak consultation hours, waiting times.
- `GET /analytics/ipd`: Bed occupancy rates, ALOS (Average Length of Stay), ward utilization.
- `GET /analytics/clinical`: ICD-10 top diagnoses frequency, department volume.
- `GET /analytics/pharmacy`: Medicine sales, stock valuation, FEFO 90-day expiry risk.
- `GET /analytics/diagnostics`: Lab & radiology TAT turnaround times, modality volume.
- `GET /analytics/finance`: Revenue recognized vs Collections vs Outstanding vs Taxes.
- `GET /analytics/saas`: Super-admin platform BI (MRR, ARR, churn, plan tiers).

### 1.4 Custom Query Builder
- `POST /query`: Executes a parameter-validated query across approved datasets.

### 1.5 Exports & Schedules
- `POST /exports`: Initiates an asynchronous export job (`csv`, `xlsx`, `pdf`, `json`).
- `GET /exports/:jobId/status`: Polls progress of an export job.
- `GET /exports/:jobId/download?token=...`: Downloads completed export archive.
- `GET /schedules`: Lists recurring scheduled reports.
- `POST /schedules`: Creates a scheduled recurring report.
- `PATCH /schedules/:id/toggle`: Pauses or resumes an active schedule.

### 1.6 Data Quality Audits
- `GET /data-quality/audit`: Executes automated data consistency and reconciliation scans.

