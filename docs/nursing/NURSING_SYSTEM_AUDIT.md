# ASRTAVA Nursing System Audit & Architectural Gap Analysis

**Audit Date:** 2026-11-09  
**System Version:** ASRTAVA v1.8.0 Modular Monolith  
**Auditor:** ASRTAVA Clinical Systems Architect & Nursing Informatics Lead  
**Scope:** Review existing database entities, routes, services, and frontend workspaces relating to Nursing, IPD, Bed Management, eMAR, Observations, Assessments, and Ward Workflows.

---

## 1. Executive Summary

ASRTAVA currently features baseline inpatient bed allocation (`007_inpatient_beds.sql`), initial nursing station census endpoints (`modules/nursing/nursing.routes.ts`), fundamental fluid intake/output and handovers (`014_hospital_modules.sql`), and a comprehensive pharmacy-backed inpatient eMAR table (`024_advanced_pharmacy_and_medication_safety.sql`). 

However, prior to this milestone, clinical nursing workflows operated with fragmented tables and lacked enterprise-grade capabilities required by multi-specialty hospitals and tertiary care centers:
1. **Nurse-to-Patient Assignment:** No formal assignment table linking individual registered nurses to specific beds/patients by shift with workload tracking, supervisor reassignments, and scope-based authorization.
2. **Clinical Assessments & Scoring:** No structured validated scoring templates for Braden (Pressure Injury), Morse (Fall Risk), Glasgow Coma Scale (GCS), MUST (Malnutrition), or Pain assessments.
3. **Continuous Monitoring & Early Warning System:** Vitals recording lacked automated Early Warning Scoring (NEWS2/MEWS), observation scheduling frequencies, delivery vs. acknowledgement tracking, and clinician escalation rules.
4. **eMAR Bedside Integration:** While the pharmacy schema defined `inpatient_emar_records`, bedside nurses lacked real-time integration connecting doctor medication orders with scheduled passes, pre-administration vitals checks, and omission/refusal workflows.
5. **Doctor Order Lifecycle:** Doctor orders existed in silos without structured nurse review, acknowledgement, execution status, and issue reporting.
6. **Wound Care & Longitudinal Progress:** No structured wound tracking (staging I-IV, measurements $L \times W \times D$, exudate, dressing regimen, healing trajectory).
7. **ICU/HDU Telemetry:** Lack of specialized high-dependency flowsheets for ventilator parameters (FiO2, PEEP, mode), continuous inotrope/sedation infusions, and arterial/CVP line monitoring.
8. **Patient Safety & Incident Reporting:** Incident reporting was rudimentary without root cause investigation phases, severity classification, and immutable governance preventing silent record deletion.

---

## 2. Inventory of Existing Nursing-Related Entities & Endpoints

### 2.1 Existing Database Entities
| Table Name | Defined In | Primary Purpose | Deficiencies / Required Enhancements |
| :--- | :--- | :--- | :--- |
| `nursing_notes` | `007_inpatient_beds.sql` | Basic narrative notes | Lacks structured categorization (DAR/SOAP), supervisor cosign, and versioned amendments. |
| `medication_administration_records` | `007_inpatient_beds.sql` | Legacy MAR records | Superseded by `inpatient_emar_records` in migration 024. |
| `nursing_intake_output` | `014_hospital_modules.sql` | Simple intake/output | Lacks hourly breakdown, shift/24h net balance calculations ($\sum\text{In} - \sum\text{Out}$), and trend analytics. |
| `nursing_shift_handovers` | `014_hospital_modules.sql` | Basic handover notes | Lacks SBAR structured fields, patient-by-patient transfer, critical alerts, and mandatory recipient electronic sign-off. |
| `nursing_care_plans` | `014_hospital_modules.sql` | Flat care plan rows | Lacks measurable goals, standardized NANDA/NIC taxonomy, review schedules, and outcome evaluation states. |
| `inpatient_emar_records` | `024_advanced_pharmacy_and_medication_safety.sql` | Pharmacy eMAR ledger | Robust schema, but needs bedside nursing workflow endpoints and pre-admin vital checks. |

### 2.2 Existing Backend Endpoints (`backend/src/modules/nursing/nursing.routes.ts`)
| Route | Method | Description | Gap / Enhancement Required |
| :--- | :---: | :--- | :--- |
| `/station-overview` | `GET` | Census of beds in ward | Missing assigned nurse filters, patient acuity indicators, and pending task counts. |
| `/medications/administer` | `POST` | Legacy MAR write | Needs to integrate directly with `inpatient_emar_records` and enforce dual-nurse cosign. |
| `/intake-output` | `POST` | Basic fluid record | Needs automated balance calculation and historical shift summaries. |
| `/shift-handovers` | `POST` | Basic handover record | Needs SBAR format, patient manifest, and receiving nurse acknowledgement handshake. |
| `/care-plans` | `POST` | Flat care plan insert | Needs structured goals, intervention schedules, and progress reviews. |

---

## 3. Duplication & Technical Debt Elimination Plan

1. **Retire Legacy MAR Table:** Deprecate `medication_administration_records` in favor of the enterprise `inpatient_emar_records` established in migration 024. All eMAR reads and writes will route through the unified ledger.
2. **Harmonize Fluid Intake/Output:** Extend `nursing_intake_output` with hourly interval tracking, distinct fluids (IV, oral, enteral, blood; urine, drain, vomit, blood loss), and net fluid balance automation.
3. **SBAR Structured Handovers:** Refactor shift handovers to adhere strictly to the healthcare standard **SBAR** framework (Situation, Background, Assessment, Recommendation) with recipient confirmation.
4. **Preserve One-Time Perpetual Licensing & Offline Resilience:** Ensure all bedside operations function air-gapped on local hospital LAN with conflict-free outbox replication when reconnected.

