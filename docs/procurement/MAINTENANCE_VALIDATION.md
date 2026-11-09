# ASRTAVA — Planned Preventive Maintenance (PPM) & Work Order Validation

## 1. Overview
The Hospital Facility & Biomedical Maintenance module manages routine preventive maintenance schedules, vendor service contracts (AMC/CMC), equipment calibration, and emergency work order dispatch.

---

## 2. Preventive vs. Corrective Maintenance Workflows
1. **Planned Preventive Maintenance (PPM)**:
   - Schedules generated automatically based on manufacturer operating hours, calendar frequency (monthly, quarterly, annual), or cycles.
   - Biomedical checklists executed with calibration verification tools.
   - Next due date calculated automatically upon completion.
2. **Corrective Maintenance (Work Orders)**:
   - Priority levels: `CRITICAL` (immediate patient care impact, e.g. ICU ventilator), `HIGH` (OT suction unit), `MEDIUM`, `LOW`.
   - SLA tracking for response time and resolution time.
   - Downtime tracking in hours, with direct impact logging on department throughput.
3. **Annual Maintenance Contracts (AMC/CMC)**:
   - Tracks OEM / third-party vendor contracts, validity dates, covered parts, call limits, and penalty clauses for SLA breaches.

