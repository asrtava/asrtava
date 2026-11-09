# ASRTAVA — Human Resource Management System (HRMS) Architecture

## 1. Architectural Overview & Modular Invariants
The ASRTAVA HRMS is built as an enterprise domain module within the modular monolith. It adheres strictly to:
- **Centralized Identity Integration**: Single identity store (`users`), unified JWT sessions with refresh token rotation.
- **Enterprise Hierarchy**: Organization $\rightarrow$ Hospital Group $\rightarrow$ Hospital $\rightarrow$ Branch $\rightarrow$ Department $\rightarrow$ Cost Center $\rightarrow$ Employee.
- **PostgreSQL Row-Level Security (RLS)**: Enforces hospital isolation, legal entity boundaries, and department scoping.
- **Two-Phase Identity Provisioning**: HR creates employee profile; Hospital Admin approves role and activates login account.
- **Double-Entry Financial Balancing**: Approved payroll batches post debits to Salary Expense / Allowance accounts and credits to Statutory Payables (PF, ESI, TDS, PT) and Net Salary Payable.

```
+----------------------------------------------------------------------------------------------------+
|                                    ASRTAVA HRMS Architecture                                       |
+----------------------------------------------------------------------------------------------------+
                                                  |
           +--------------------------------------+--------------------------------------+
           |                                      |                                      |
           v                                      v                                      v
+-----------------------+              +-----------------------+              +-----------------------+
|  Recruitment & ATS    |              |  Workforce Operations |              |  Compensation & Perks |
+-----------------------+              +-----------------------+              +-----------------------+
| - Job Requisitions    |              | - Employee Master     |              | - Salary Structures   |
| - Candidate Pipeline  |              | - Biometric Adapters  |              | - Attendance/Leaves   |
| - Interviews & Ratings|              | - Shift Rostering     |              | - Statutory Tax (IN)  |
| - Offer Issuance      |              | - Conflict Prevention |              | - GL Journal Vouchers |
| - Onboarding Formalities             | - Credentials & Lic.  |              | - Payslip Distribution|
+-----------------------+              +-----------------------+              +-----------------------+
           |                                      |                                      |
           +--------------------------------------+--------------------------------------+
                                                  |
                                                  v
                   +------------------------------------------------------+
                   |         Central Services & Cross-Module Bridges       |
                   +------------------------------------------------------+
                   | 1. Centralized Identity & RBAC (Users, Permissions)  |
                   | 2. General Ledger Financial Integration (RCM/GL)     |
                   | 3. Centralized Notifications (SMS, Email, In-App)    |
                   | 4. Document Vault & Encrypted S3 Object Storage      |
                   +------------------------------------------------------+
```

---

## 2. Core Subsystems

### Subsystem 1: Employee Master & Personal Document Vault
- Centralized `hr_employees` table storing personal demographics, contact information, date of birth, emergency contacts, blood group, and photograph URI.
- Linked `hr_employee_documents` table with encrypted storage paths, MIME types, document categories (`ID_PROOF`, `DEGREE_CERTIFICATE`, `REGISTRATION_LICENSE`, `BACKGROUND_CHECK`), and verification status (`PENDING`, `VERIFIED`, `REJECTED`).

### Subsystem 2: Recruitment & Applicant Tracking System (ATS)
- `hr_job_requisitions`: Departmental hiring requests with headcount, job grade, budget, required qualifications, and approval states.
- `hr_candidates` & `hr_applications`: Multi-stage pipeline (`APPLIED` $\rightarrow$ `SCREENING` $\rightarrow$ `INTERVIEW` $\rightarrow$ `OFFER` $\rightarrow$ `HIRED` $\rightarrow$ `REJECTED`).
- `hr_interview_evaluations`: Structured interviewer scoring matrix, notes, and recommendation flags.

### Subsystem 3: Biometric Attendance & Time Tracking
- `hr_attendance_devices`: Physical device registration (IP address, protocol, port, location, sync status).
- `hr_attendance_logs`: Punch events with source device reference, biometric badge ID, direction (`IN` / `OUT` / `BREAK_START` / `BREAK_END`), deduplication window, and anomaly flags (`LATE_ARRIVAL`, `EARLY_EXIT`, `MISSING_PUNCH`).
- `hr_attendance_corrections`: Formal employee correction requests with mandatory reason, supervisor approval, and audit trails.

### Subsystem 4: 24/7 Clinical Shift Rostering & Conflict Engine
- `hr_shift_templates`: Reusable shift definitions (Morning 07:00–15:00, Evening 15:00–23:00, Night 23:00–07:00, General 09:00–17:00, On-Call).
- `hr_duty_rosters`: Shift assignments by employee and date.
- **Conflict Prevention Engine**: Validates rest periods (minimum 11 hours rest between shifts), blocks overlapping shifts, checks mandatory clinical coverage (e.g. at least 1 Senior Anaesthetist on-call, 2 ICU nurses per shift).

### Subsystem 5: Dynamic Leave Management & Balances
- `hr_leave_types`: Configurable categories (Casual, Sick, Annual/Earned, Maternity, Paternity, Conference, Compensatory).
- `hr_leave_balances`: Dynamic balance tracking per employee per year with opening balance, accrued, used, and closing balance.
- `hr_leave_applications`: Application workflow with supervisor approval, attachment verification, and automatic balance deduction upon approval.

### Subsystem 6: Payroll Engine & Double-Entry Financial Integration
- `hr_salary_structures`: Base pay and percentage/fixed allowances (Basic 40-50%, HRA 20%, Special, Medical, Conveyance, Night Shift Allowance).
- `hr_statutory_configs`: Configurable rules for Indian payroll:
  - Provident Fund (PF): 12% employee contribution with configurable wage ceiling (e.g. ₹15,000 ceiling or actual).
  - Employee State Insurance (ESI): 0.75% employee contribution (applicable up to ₹21,000 gross).
  - Professional Tax (PT): State-specific slabs (e.g. ₹200/month, ₹300 in Feb).
  - Tax Deducted at Source (TDS): Section 192 income tax projections.
- `hr_payroll_batches` & `hr_payslips`: Monthly batch processing, net pay calculation, approval workflow, and automated GL voucher generation.

### Subsystem 7: Professional Credentials & Compliance Alerts
- `hr_professional_credentials`: Medical Council registration (NMC/SMC), Nursing Council (INC), Pharmacy Council (PCI), Atomic Energy AERB certs for radiographers, BLS/ACLS.
- Expiration tracking with automated 60-day, 30-day, and 7-day alert broadcasts to the practitioner and Department Head.

### Subsystem 8: Employee Separation & Access Termination
- `hr_separations`: Resignation submission, notice period calculation, handover completion, asset return verification (laptop, ID badge, access fobs, hospital keys), final settlement calculations.
- **Instantaneous Access Termination**: Approving the separation record automatically sets `users.is_active = FALSE` and revokes all active session token families.

