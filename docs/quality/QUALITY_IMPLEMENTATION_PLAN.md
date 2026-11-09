# ASRTAVA — Quality Management & Patient Safety Implementation Plan

## 1. Roadmap & Phased Execution

### Phase 1: System Audit & Dependency Mapping (Completed)
- Reviewed cross-module touchpoints with EMR, Pharmacy, LIS, RIS, OT, Emergency, Nursing, and HRMS.
- Authored architecture, system audit, and integration map documents in `docs/quality/`.

### Phase 2: Database Schema & Migration
- Create `database/migrations/034_complete_quality_management_and_accreditation.sql`.
- Provision 14 relational tables:
  1. `qm_incidents`: Patient safety and operational incident reports.
  2. `qm_incident_investigations`: Structured investigation logs with timeline reconstruction.
  3. `qm_root_cause_analyses`: 5-Whys and Fishbone root cause analyses.
  4. `qm_capa_actions`: Corrective and Preventive Actions with verification gates.
  5. `qm_hai_surveillance`: Hospital-Acquired Infection surveillance records (CAUTI, CLABSI, VAP, SSI).
  6. `qm_hand_hygiene_audits`: WHO 5-Moments hand hygiene observation sessions.
  7. `qm_medication_safety_events`: ADR, dispensing, and administration error logs.
  8. `qm_clinical_audits`: Scheduled clinical audit findings and compliance scores.
  9. `qm_patient_complaints`: Patient grievances, investigations, and resolutions.
  10. `qm_risk_register`: Hospital risk matrix (likelihood, impact, mitigations).
  11. `qm_quality_indicators`: Healthcare KPI formulas, targets, and monthly values.
  12. `qm_accreditation_standards`: NABH / NABL standards and clause mappings.
  13. `qm_controlled_documents`: Policies, SOPs, clinical guidelines with version control.
  14. `qm_mock_inspections`: Internal accreditation readiness assessments.
- Enforce PostgreSQL Row-Level Security (RLS) on all tables.

### Phase 3: Backend Quality Service & API Routes
- Build `backend/src/modules/quality/quality-advanced.service.ts`:
  - Incident intake, investigation, RCA, and closure.
  - Closed-loop CAPA creation, completion, and effectiveness verification.
  - HAI surveillance recording and denominator rate calculation.
  - Hand hygiene compliance scoring.
  - Patient complaints tracking and escalation.
  - Risk register assessment and scoring.
  - Accreditation evidence mapping and mock inspection scoring.
- Mount routes at `/api/v1/quality` in `backend/src/server.ts`.

### Phase 4: Frontend Quality Hub
- Build `apps/web-portal/src/portals/quality/AdvancedQualityHub.tsx` with:
  - Incident & Adverse Event Manager
  - Root Cause Analysis & CAPA Tracker
  - Infection Prevention & Control (IPC) / HAI Surveillance
  - Hand Hygiene & Clinical Audits
  - Risk Register & Quality Indicators
  - Accreditation & Document Control (NABH/NABL)

### Phase 5: Automated Testing & Verification
- Author `backend/tests/advanced_quality_and_accreditation.test.ts` (16 scenarios).
- Execute unit and full regression test suites.
- Verify production builds.

