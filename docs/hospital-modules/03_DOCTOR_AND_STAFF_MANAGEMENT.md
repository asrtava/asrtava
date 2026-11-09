# Module 03: Doctor & Staff Management Specification

## 1. Overview
The Doctor & Staff Management module handles healthcare workforce credentialing, medical council registration tracking (MCI, INC, PCI), multi-role assignments, department associations, consultation fees, shift duty rosters, and leave approvals.

---

## 2. Core Functional Capabilities

### 1. Dual-Identity Architecture
- **Login Identity (`users`)**: Authenticated user account with email/phone, password hash, MFA status, and global user type.
- **Healthcare Professional Profile (`staff_profiles`)**: Employee code (`EMP-XXXX`), department, designation, employment status, joining date, and reporting manager.
- **Physician Profile (`doctors`)**: Medical council registration number, specialty, qualification degrees, consultation fee, and room assignment.

### 2. Multi-Role RBAC & Custom Permission Overrides
Staff members may hold multiple roles (e.g., `doctor` and `hospital_admin`). Permissions are dynamically resolved following strict precedence:
$$\text{Explicit DENY} > \text{Explicit ALLOW} > \text{Role RBAC ALLOW} > \text{Default DENY}$$

### 3. Consultation Schedules & Availability
Doctors configure scheduled slots:
- Slot Duration: 10, 15, 20, 30, 45, or 60 minutes.
- Shift Times: Morning (e.g. 09:00 - 13:00), Evening (e.g. 17:00 - 20:00).
- Days of the week and designated consultation room numbers.

---

## 3. API Endpoints
- `GET /api/v1/hospitals/staff`: Retrieve staff directory with roles and departments.
- `POST /api/v1/hospitals/staff`: Onboard employee with initial role and credentials.
- `GET /api/v1/hr/rosters`: View published duty shift rosters.
- `POST /api/v1/hr/rosters`: Publish daily/weekly shift assignments.
- `POST /api/v1/hr/attendance/clock-in`: Record attendance clock-in timestamp.
- `POST /api/v1/hr/attendance/clock-out`: Record attendance clock-out timestamp.
- `GET /api/v1/hr/leaves`: View leave applications.
- `POST /api/v1/hr/leaves`: Submit leave application.
- `PATCH /api/v1/hr/leaves/:id/status`: Supervisor leave approval or rejection.

