# ASRTAVA Ward & Bed Management Implementation Plan

## 1. Execution Stages

### Stage 1: System Audit & Architecture (Phase 1)
- Author architectural documentation and patient flow maps in `docs/ward/*`.

### Stage 2: Database Migration (Phase 2 & 3)
- Author database migration `database/migrations/030_complete_ward_and_bed_lifecycle_management.sql`.
- Model complete infrastructure hierarchy (Buildings, Floors, Departments, Wards, Rooms, Beds).
- Model admission requests, admissions, transfers, housekeeping cleaning cycles, inspections, discharge planning, and visitor passes.
- Enable PostgreSQL Row-Level Security (RLS) across all 14 tables.

### Stage 3: Backend Services & API Gateway (Phase 4 to 10)
- Author `backend/src/modules/inpatient/ward-advanced.service.ts`:
  - Infrastructure master registration.
  - 8-state Bed lifecycle engine with concurrency lock assertions.
  - Admission request submission, triage, and reservation engine.
  - Inpatient admission formalization (`IPD-2026-XXXXX`).
  - Inter-ward and ICU step-up/step-down transfer handovers.
  - Housekeeping task creation, cleaning progression, and supervisor inspection.
  - Proactive discharge planning and clinical discharge summary generation.
  - Visitor gate pass issuance.
- Author REST routes in `backend/src/modules/inpatient/ward-advanced.routes.ts`.
- Mount at `/api/v1/inpatient/ward/advanced` in `backend/src/server.ts`.
- Verify backend build (`npm --prefix backend run build`).

### Stage 4: Frontend Portal Integration (Phase 11)
- Author `apps/web-portal/src/portals/nursing/AdvancedWardHub.tsx`.
- Connect into `NursingDashboard.tsx` and inpatient views.
- Verify web portal compilation (`npm --prefix apps/web-portal run build`).

### Stage 5: Automated Testing & Verification (Phase 12)
- Author `backend/tests/advanced_ward_bed_management.test.ts` (16+ scenarios).
- Execute test suite and update `package.json`.
- Complete all validation and user guide documentation in `docs/ward/*`.

