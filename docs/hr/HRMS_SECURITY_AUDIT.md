# ASRTAVA — HRMS Security & Access Control Audit

## 1. Overview
Human resources data contains highly sensitive Personally Identifiable Information (PII), bank account details, compensation structures, performance reviews, and disciplinary notes. ASRTAVA enforces strict zero-trust principles, PostgreSQL Row-Level Security, and granular RBAC.

## 2. RBAC Permissions Matrix

| Operation | Super Admin | Hospital Admin | HR Manager | Department Head | Staff Employee |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Workforce Directory | Read | Read | Read | Read (Dept) | Read (Public) |
| Create / Edit Employee Master | JIT Only | **Manage** | **Manage** | Denied | Denied |
| Link User Account | JIT Only | **Authorize** | Request | Denied | Denied |
| Manage Recruitment (ATS) | Denied | Read | **Manage** | Review / Score | Denied |
| Biometric Device Management | Denied | **Manage** | Read | Denied | Denied |
| Duty Rostering | Denied | Read | Read | **Manage** | Read Own |
| Leave Applications | Denied | Read | Read | **Approve** | **Apply Own** |
| Run Monthly Payroll | Denied | Review | **Calculate** | Denied | Denied |
| Approve Payroll Batch | Denied | **Authorize** | Denied | Denied | Denied |
| Post Payroll to GL | Denied | **Execute** | Denied | Denied | Denied |
| View Payslips | Denied | All | All | Denied | **View Own** |
| Professional Credentials | Denied | Read | **Verify** | Review | **Upload Own** |
| Finalize Separation & Revoke Access | Denied | **Authorize** | **Execute** | Sign Clearance | Denied |

## 3. Security Highlights
1. **Separation of Duties**: HR managers can calculate and verify payroll runs, but **cannot** approve or post them to the General Ledger. Only an authorized Hospital Admin or CFO can authorize GL disbursement.
2. **Explicit Deny Overrides**: Individual DENY permissions strictly take precedence over group or role-level ALLOWs.
3. **Instantaneous Access Termination**: When an employee resignation/termination is finalized, their user account is locked (`users.is_active = FALSE`), killing active JWT refresh families immediately.

