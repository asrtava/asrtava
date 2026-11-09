# ASRTAVA — HRMS Implementation Plan

## 1. Overview & Objectives
This document establishes the step-by-step technical implementation plan for Prompt 24 of 30: Complete Human Resource Management, Employee Records, Recruitment, Attendance, Payroll, Leave, Staff Rostering & Workforce Management.

---

## 2. Phased Implementation Roadmap

### Phase 1: Existing System Audit & Architectural Planning
- Complete architectural blueprints, lifecycle maps, and implementation plans.
- Create `docs/hr/HRMS_SYSTEM_AUDIT.md`, `docs/hr/HRMS_ARCHITECTURE.md`, `docs/hr/EMPLOYEE_LIFECYCLE_WORKFLOW.md`, `docs/hr/HRMS_IMPLEMENTATION_PLAN.md`.

### Phase 2: Database Schema Migration (`031_complete_hrms_workforce_management.sql`)
- Create enterprise HRMS tables:
  1. `hr_designations`: Job grades, titles, department links, min/max experience.
  2. `hr_employees`: Comprehensive master profile, demographics, emergency contact, joining/probation dates, employment status, reporting manager ID, linked user ID.
  3. `hr_employee_documents`: Document vault, categories, file paths, verification status.
  4. `hr_job_requisitions`: Hiring requests with vacancies, budgets, qualifications, approvals.
  5. `hr_candidates`: Applicant profiles, resumes, contact information.
  6. `hr_applications`: Stage transitions (`APPLIED` $\rightarrow$ `HIRED`).
  7. `hr_interview_evaluations`: Interviewer scoring, clinical competency assessment, recommendations.
  8. `hr_attendance_devices`: Physical biometric / RFID device registrations with sync protocols.
  9. `hr_attendance_logs`: Punch events with device mapping, direction, anomaly flags.
  10. `hr_attendance_corrections`: Correction requests with supervisor approval workflow.
  11. `hr_shift_templates`: 24/7 hospital shift definitions (Morning, Evening, Night, General, On-Call).
  12. `hr_duty_rosters`: Shift assignments with anti-collision validation.
  13. `hr_leave_types`: Configurable categories (Casual, Sick, Annual, Maternity, Paternity, Compensatory).
  14. `hr_leave_balances`: Yearly balance tracking (opening, accrued, taken, closing).
  15. `hr_leave_applications`: Leave application requests with supervisor approval.
  16. `hr_salary_structures`: Base salary, allowances, statutory deductions setup.
  17. `hr_payroll_batches`: Monthly hospital-wide payroll processing runs.
  18. `hr_payslips`: Individual employee payslips with earnings/deductions breakdown and net pay.
  19. `hr_professional_credentials`: Medical/Nursing registrations, certifications, license renewal dates.
  20. `hr_training_programs` & `hr_training_attendees`: Mandatory clinical and safety certifications.
  21. `hr_separations`: Resignation, clearance checklist, asset returns, and access revocation audit.

### Phase 3: Backend Service & Routes Implementation
- Create `backend/src/modules/hr/hrms-advanced.service.ts` implementing business logic, conflict detection, Indian payroll calculations, and GL journal voucher generation.
- Create `backend/src/modules/hr/hrms-advanced.routes.ts` providing REST API endpoints.
- Mount routes at `/api/v1/hr/advanced` in `backend/src/server.ts`.

### Phase 4: Frontend Portal & Workspaces
- Build `apps/web-portal/src/portals/hr/AdvancedHRMSHub.tsx` with tabs for:
  - Workforce Directory & Employee Profiles
  - Recruitment & Applicant Tracking (ATS)
  - Biometric Attendance & Shift Rostering Calendar
  - Leave Management & Balances
  - Payroll Engine & Payslip Viewer
  - Credential Tracking & Compliance Alerts
  - Employee Separation & Exit Clearance
- Integrate into `apps/web-portal/src/portals/hr/HRDashboard.tsx`.

### Phase 5: Automated Testing & Verification
- Author `backend/tests/advanced_hrms_workforce_management.test.ts` covering 16 comprehensive end-to-end scenarios.
- Add suite to `backend/package.json` test runner.
- Execute unit test suite and verify 100% pass rate.
- Run cumulative project regression suite verifying 406+ tests pass with 0 regressions.

### Phase 6: Documentation & Governance Updates
- Complete documentation files in `docs/hr/` and update project governance records (`IMPLEMENTATION_STATUS.md`, `TEST_RESULTS.md`, `CHANGELOG.md`).

