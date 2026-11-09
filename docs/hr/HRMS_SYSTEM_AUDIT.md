# ASRTAVA — Human Resource Management System (HRMS) Audit

## 1. Executive Summary & Audit Context
This audit inspects the current human resources, staff management, duty rostering, attendance, leave, and payroll capabilities across the ASRTAVA platform prior to Prompt 24 implementation.

ASRTAVA already features foundational staff structures in PostgreSQL (`departments`, `doctors`, `staff_profiles`, `staff_attendance`, `staff_leaves`, `payroll_runs`) and basic endpoints in `backend/src/modules/hr/hr.routes.ts`. However, hospital group and enterprise healthcare operations require a comprehensive, end-to-end Human Resources Management System (HRMS).

This milestone delivers complete workforce lifecycle management:
1. **Workforce Planning & Recruitment (ATS)**: Job requisitions, vacancy tracking, applicant screening, interview evaluation, and offer issuance.
2. **Employee Master & Records**: Multi-tier organization (Group -> Hospital -> Branch -> Department -> Cost Center), professional credentials (MCI/NMC registration, BLS/ACLS, CME credits, expiry alerts), digital identity documents, and employment history.
3. **Identity & Access Integration**: Strict separation of HR record creation from user account provisioning; authorized approval workflow for system logins with individual ALLOW/DENY permission controls; separation-triggered automatic access revocation.
4. **Attendance & Biometric Integration**: Daily clock-in/out, shift-based attendance, break tracking, biometric device abstraction adapters (API, webhook, network sync), deduplication, and manager correction approvals.
5. **Shift Rostering & Duty Scheduling**: 24/7 hospital shift scheduling, rotation templates, on-call duty, clinical specialty matching, and automated double-booking / conflict prevention.
6. **Leave Management**: Configurable leave policies (Casual, Sick, Earned/Annual, Maternity, Paternity, Conference, Compensatory), dynamic balance calculation from approved transactions, and carry-forward rules.
7. **Comprehensive Payroll & Statutory Deductions**: Configurable earnings (Basic, HRA, Special, Night Allowance) and deductions (PF, ESI, Professional Tax, TDS/Income Tax, Loan recovery), decimal-safe net pay calculation, payslip generation, and double-entry General Ledger journal voucher posting into Finance & Accounting.
8. **Employee Performance & Training**: Annual appraisal cycles, KPI goals, clinical safety training, infection control certifications, and license renewal alerts.
9. **Employee Separation & Exit Management**: Resignation submission, notice period calculation, asset recovery checklist, clearance sign-offs, final payroll settlement, and instantaneous credential revocation.

---

## 2. Existing Database Schema Audit

| Table Name | Defined In | Primary Attributes | Identified Gaps for Enterprise HRMS |
| :--- | :--- | :--- | :--- |
| `departments` | Migration 004 | `id`, `hospital_id`, `name`, `code`, `department_type`, `head_of_department_user_id` | Missing cost center linkage, subdepartments, organizational hierarchy levels |
| `doctors` | Migration 004 | `id`, `user_id`, `hospital_id`, `department_id`, `specialization`, `medical_council_reg_number`, `consultation_fee` | Clinical focus only; missing employment contracts, grade, salary structure, performance reviews |
| `staff_profiles` | Migration 004 | `id`, `user_id`, `hospital_id`, `department_id`, `employee_code`, `designation`, `employment_status`, `base_monthly_salary` | Missing rich personal details, emergency contacts, qualifications, document vaults, probation tracking |
| `staff_duty_rosters` | Existing schema | `id`, `hospital_id`, `staff_profile_id`, `shift_date`, `shift_code`, `shift_start`, `shift_end` | Flat shift records; missing shift swap requests, conflict detection engine, on-call duty types |
| `staff_attendance` | Migration 014 | `id`, `hospital_id`, `user_id`, `attendance_date`, `clock_in`, `clock_out`, `status` | Basic manual timestamps; missing biometric device event logs, break tracking, overtime calculation |
| `staff_leaves` | Migration 014 | `id`, `hospital_id`, `user_id`, `leave_type`, `start_date`, `end_date`, `status` | Missing policy balance accrual ledger, leave carry-forward, half-day support, document attachments |
| `payroll_runs` | Migration 014 | `id`, `hospital_id`, `employee_user_id`, `pay_period_month`, basic/hra/pf/pt/tds columns | Generated column limited to fixed formulas; missing salary structure templates, variable incentives, GL posting |

---

## 3. Integration & Reusability Strategy

1. **Centralized Identity**: The HRMS will **not** create a separate authentication system. Every active employee requiring portal access links to `users.id`. However, an employee master record can exist prior to account activation (e.g., during onboarding or for field staff without system accounts).
2. **Access Control**: Role assignments and granular permissions continue to flow through ASRTAVA's existing RBAC with individual ALLOW/DENY overrides.
3. **Financial Accounting**: Payroll runs post balanced journal entries ($\sum \text{Debits} == \sum \text{Credits}$) directly to the General Ledger introduced in Milestone 16/23 (`enterprise_rcm_financial_accounting`).
4. **Notifications**: Credential expiry alerts (license expiring in 30 days), leave approval updates, and shift change notices route through the centralized notifications engine.

