# ASRTAVA Customer Onboarding & Implementation Architecture Audit

## 1. System Audit Summary

This document serves as the formal architectural verification audit for the **ASRTAVA Customer Onboarding, Hospital Implementation, Data Migration, Training & Go-Live Management System**.

- **Architectural Scope**: Multi-tenant, multi-deployment (Cloud, On-Premises, Hybrid), One-Time Perpetual Licensing model.
- **Migration & Schema**: PostgreSQL migration `020_customer_onboarding_and_implementation.sql` defines 10 normalized tables with foreign keys, compound indexes, and audit logging.
- **Backend Service Layer**: `OnboardingService` (`backend/src/modules/onboarding/onboarding.service.ts`) implements the full 18-stage state machine, data migration dry-run and reconciliation, training certification, UAT tracking, 14-gate go-live checklist, mandatory dual sign-off, and hypercare ticketing.
- **API Gateways**: 19 RESTful endpoints mounted at `/api/v1/onboarding` in `backend/src/modules/onboarding/onboarding.routes.ts` and registered in `backend/src/server.ts`.
- **Frontend Dashboards**:
  - Super Admin: `apps/web-portal/src/portals/super-admin/CustomerOnboardingView.tsx`
  - Hospital Admin: `apps/web-portal/src/portals/hospital-admin/HospitalOnboardingProgressView.tsx`
- **Automated Test Validation**: 14/14 automated tests passed in `backend/tests/customer_onboarding_implementation.test.ts`. Full backend suite passes 237/237 tests with 0 failures.

---

## 2. Table-by-Table Database Architecture

| Table Name | Primary Purpose | Primary & Foreign Keys |
|---|---|---|
| `customer_organizations` | Parent customer entity, branches, SLA priorities | `id` (PK), `customer_code` (UQ) |
| `hospital_implementations` | Implementation project, 18 stages, dual sign-offs | `id` (PK), `customer_id` (FK), `hospital_id` |
| `implementation_stage_logs` | Immutable audit trail for every stage transition | `id` (PK), `implementation_id` (FK) |
| `implementation_requirements`| Hospital-specific requirement catalog | `id` (PK), `implementation_id` (FK) |
| `data_migration_jobs` | Ingestion, dry-run, approval, execution & reconciliation | `id` (PK), `implementation_id` (FK) |
| `training_programs` | Role-specific training curriculum & module definition | `id` (PK), `implementation_id` (FK) |
| `training_attendance` | Staff attendance, scores, certification gate (&ge; 80%) | `id` (PK), `program_id` (FK) |
| `uat_test_cases` | 16-domain test execution & defect tracking | `id` (PK), `implementation_id` (FK) |
| `go_live_checklists` | 14 mandatory readiness gates | `id` (PK), `implementation_id` (FK) |
| `hypercare_tickets` | 30-day post-go-live incident resolution | `id` (PK), `implementation_id` (FK) |

---

## 3. Security, Safety & Governance Verification

1. **Mandatory Dual Sign-Off**: Production cutover requires both the Hospital Administrator and ASRTAVA Implementation Lead signatures. Attempts to transition without both signatures throw an unhandled-override rejection.
2. **Clinical Safety Guarantee**:
   - Zero silent data overwrites.
   - Append-only EMR lineage for clinical notes.
   - DPDP Act 2023 PII masking for outbox telemetry and migration dry-runs.
   - Emergency zero-lockout protocol operational under Cloud, On-Premises, and Hybrid deployments.
3. **Zero Mock Policy**: Schema migrations, backend routes, in-memory test states, frontend views, and build pipelines verified with real test execution.

