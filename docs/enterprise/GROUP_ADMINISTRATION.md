# ASRTAVA Central Group Administration Portal Architecture

## 1. Overview

The Central Group Administration Portal provides healthcare corporate headquarters, hospital group leadership (Chief Executive Officers, Chief Medical Officers, Group Chief Operating Officers, and Finance Directors) with an executive command center for multi-facility operations.

---

## 2. Real-Time Telemetry & Aggregate Metrics

All metrics surfaced in the Group Admin Portal (`apps/web-portal/src/portals/group-admin/GroupAdminDashboard.tsx`) are aggregated dynamically from underlying database tables without exposing restricted individual clinical records:

1. **Facility Directory**: Real-time operational status across all hospitals, daycare branches, and diagnostic clinics.
2. **Patient Volumes**: Today's OPD consultations and IPD admissions broken down by region and hospital.
3. **Bed Occupancy Census**: Consolidated occupancy rate across ICU, step-down, surgical, and general wards.
4. **Group Revenue & Financial Rollup**: Gross revenue, insurance receivables, and inter-branch reimbursement settlements.
5. **Cross-Hospital Transfer Grid**: Real-time tracking of patients transferring between group hospitals with clinical summaries and triage priority.
6. **Inter-Branch Stock Movement**: Traceable medication transfers between central warehouses and peripheral pharmacies.
7. **Enterprise License Utilization**: Consumed vs authorized location limits and bed tier quotas under the perpetual license.

---

## 3. Scoped Multi-Dimensional Filtering

Every widget and report supports granular multi-level filtering:
- **Organization**: Top-level corporate holding.
- **Region**: Northern, Southern, Eastern, Western Regional Directorates.
- **Hospital**: Specific tertiary care facility or general hospital.
- **Branch / Clinic**: Dedicated outpatient branch or satellite unit.
- **Department**: Cardiology, Neurology, Orthopedics, Nephrology, etc.
- **Date Range**: Today, Yesterday, This Week, Month-to-Date, Year-to-Date, Custom ISO Range.

---

## 4. Security & Privacy Boundaries

To comply with the DPDP Act 2023 and medical confidentiality ethics:
- Group Administrators cannot browse raw doctor clinical SOAP notes, psychological evaluations, or patient diagnostic imaging scans without an approved JIT clinical audit token.
- Dashboard queries compute count aggregations (`COUNT()`), sums (`SUM()`), and percentiles (`AVG()`, `p95`) rather than returning full patient clinical rows.

