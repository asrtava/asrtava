# ASRTAVA End-to-End System Integration User Guide

## 1. Navigating the Unified Healthcare Workspace
ASRTAVA provides 13 dedicated role workspaces bound to the Centralized Permission Engine:
1. **Super Admin**: SaaS tenant provisioning, licensing, platform observability.
2. **Group Admin**: Multi-hospital group management, branch transfers, consolidated finance.
3. **Hospital Admin**: Hospital governance across 19 domains, staff access, tariffs, audit logs.
4. **Doctor**: OPD queues, clinical SOAP documentation, e-prescriptions, diagnostic ordering.
5. **Reception**: Patient registration, appointment booking, check-in passes, token dispatch.
6. **Nursing**: NEWS2 vitals escalation, eMAR dual-cosign medication administration, SBAR handovers.
7. **Pharmacy**: FEFO batch dispensing, LASA/DDI warnings, inventory replenishment.
8. **Laboratory (LIS)**: Specimen accessioning, analyzer telemetry, Westgard IQC, report authorization.
9. **Radiology (RIS/PACS)**: Modality scheduling, eGFR renal screening, DICOM viewer bridge, report addenda.
10. **Operation Theatre (OT)**: Triple-conflict scheduling, WHO checklist, PACU Aldrete recovery.
11. **Emergency**: ESI 5-level triage, Code Red trauma resuscitation, STAT billing overrides.
12. **Finance**: Cashier shift reconciliation, double-entry GL, 4-bucket AR aging, GST tax reports.
13. **Patient Mobile App**: Digital health records, appointment QR passes, RPM vitals logging.

## 2. Cross-Module Operational Verification Tips
- Changes in one department cascade immediately across the platform (e.g. discharging a patient in the Inpatient Ward marks the bed `CLEANING_REQUIRED`, alerts housekeeping, generates the final consolidated bill in Finance, updates the bed census in Executive Analytics, and triggers LACE+ readmission follow-up).

