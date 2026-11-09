# ASRTAVA — HRMS & Workforce Management Test Plan

## 1. Executive Summary
This test plan defines the automated and manual verification procedures for Prompt 24 of 30: Complete Human Resource Management, Employee Records, Recruitment, Attendance, Payroll, Leave, Staff Rostering & Workforce Management.

## 2. Test Scope & Harness
- **Framework**: Node.js Native Test Runner (`node:test`, `node:assert/strict`) via `ts-node`.
- **Database Engine**: PostgreSQL with Row-Level Security (RLS) schemas (`031_complete_hrms_workforce_management.sql`).
- **Service Layer**: `HrmsAdvancedService` (`backend/src/modules/hr/hrms-advanced.service.ts`).
- **API Routes**: `/api/v1/hr/advanced` (`backend/src/modules/hr/hrms-advanced.routes.ts`).
- **Test File**: `backend/tests/advanced_hrms_workforce_management.test.ts`.

## 3. Test Scenarios Matrix

| Scenario # | Test Description | Verification Points |
| :---: | :--- | :--- |
| **01** | Designation & Grade Registration | Validates code, title, job grade (Grade A/B), and minimum required experience years. |
| **02** | Employee Master Creation | Verifies comprehensive personal, demographic, contact, emergency contact, pan, and masked aadhaar data. |
| **03** | Duplicate Employee Code Guard | Negative concurrency test ensuring duplicate employee numbers within the same hospital are rejected. |
| **04** | Document Vault & Supervisor Verification | Validates degree certificate upload, mime type, size, and supervisor verification status transition. |
| **05** | Identity User Account Linking | Verifies two-phase identity integration: linking `hr_employees.user_id = users.id` without granting auto-elevated rights. |
| **06** | Job Requisition Approval (ATS) | Validates departmental requisition creation, budget allocation, and clinical director approval. |
| **07** | Structured Clinical Interview Evaluation | Evaluates applicant scoring matrix (1–5), notes, and `SELECT`/`REJECT` recommendation. |
| **08** | Formal Job Offer & Acceptance | Ingests offered CTC and expected joining date; verifies digital candidate acceptance. |
| **09** | Biometric Hardware Device Punch Event | Validates terminal registration (IP, port, area) and punch event recording (FACIAL_BIOMETRIC, CHECK_IN). |
| **10** | Punch Deduplication Window Guard | Negative test verifying that identical punches within 2 minutes are rejected to prevent double-logging. |
| **11** | Attendance Correction Approval | Validates formal correction request with clinical reason and supervisor approval injecting verified punches. |
| **12** | 24/7 Shift Template & Duty Rostering | Configures hospital shift template (start, end, night flag) and schedules clinician duty roster. |
| **13** | Shift Collision Anti-Double-Booking Guard | Negative test verifying that assigning an employee to conflicting shifts on the same date is blocked. |
| **14** | Leave Policy & Quota Balance Validation | Configures leave categories and rejects leave applications requesting more days than available balance. |
| **15** | Leave Approval & Atomic Balance Deduction | Validates supervisor leave approval and atomic balance deduction from `hr_leave_balances`. |
| **16** | Indian Payroll & Double-Entry General Ledger Posting | Calculates basic, HRA, PF (12%), PT (₹200), and TDS; verifies net pay; and posts balanced JV ($\sum Dr == \sum Cr$) to GL. |

## 4. Exit Criteria & Quality Gates
- 16 / 16 tests in `advanced_hrms_workforce_management.test.ts` pass.
- 100% pass across all regression test suites (406+ tests).
- Backend TypeScript and Web Portal builds compile cleanly with exit code 0.

