# Module 18: Reporting & Analytics Specification

## 1. Overview
The Reporting & Analytics module generates executive intelligence, operational metrics, and clinical quality indicators using real-time, tenant-scoped PostgreSQL queries.

---

## 2. Core Functional Capabilities

### 1. Hospital Key Performance Indicators (KPIs)
- **Patient Volume**: Daily new registrations and returning patient ratios.
- **Outpatient (OPD)**: Scheduled vs. checked-in vs. completed consultations, average wait time.
- **Inpatient (IPD)**: Real-time bed occupancy rate:
  $$\text{Occupancy Rate} = \frac{\text{Occupied Beds}}{\text{Total Operational Beds}} \times 100$$
- **Revenue Cycle**: Gross revenue, tax collected, payments collected, and outstanding receivables.
- **Pharmacy**: Active formulary SKUs, near-expiry count (< 60 days), and low-stock reorder warnings.
- **Diagnostics**: Laboratory sample accession volume and radiology imaging turnaround times.

---

## 3. API Endpoints
- `GET /api/v1/reports/executive-overview`: Executive performance analytics with date and department filtering.

