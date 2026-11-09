# Module 16: Human Resources & Payroll Specification

## 1. Overview
The HR & Payroll module manages healthcare employee files, professional licenses (MCI, INC, PCI), daily attendance tracking (clock-in / clock-out), leave applications with supervisor approval, and payroll runs with automated allowances and statutory deductions.

---

## 2. Core Functional Capabilities

### 1. Shift Scheduling & Attendance Tracking
- Records daily clock-in and clock-out timestamps with geolocation/terminal tracking.
- Statuses: `present`, `absent`, `on_leave`, `half_day`, `holiday`.
- Matches actual clock-in times against scheduled duty shift rosters.

### 2. Leave Management & Approval Workflow
- Leave types: `casual`, `sick`, `earned`, `maternity`, `conference`, `unpaid`.
- Department supervisors review staffing constraints before approving or rejecting leave requests.

### 3. Payroll Architecture & Deductions
Calculates net monthly remuneration:
$$\text{Net Salary} = (\text{Basic} + \text{HRA} + \text{Medical} + \text{Special}) - (\text{PF} + \text{Professional Tax} + \text{TDS})$$
- Generates itemized payslip records linked to employee user IDs.
- Tracks disbursement status (`draft`, `approved`, `paid`, `hold`) with transaction reference numbers.

---

## 3. API Endpoints
- `POST /api/v1/hr/attendance/clock-in`: Record attendance clock-in.
- `POST /api/v1/hr/attendance/clock-out`: Record attendance clock-out.
- `GET /api/v1/hr/leaves`: Retrieve leave requests.
- `POST /api/v1/hr/leaves`: Submit leave application.
- `PATCH /api/v1/hr/leaves/:id/status`: Supervisor review and approval.
- `GET /api/v1/hr/payroll`: View monthly payroll records.
- `POST /api/v1/hr/payroll/generate`: Generate and approve payroll run for pay period.

