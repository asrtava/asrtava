# ASRTAVA — HRMS REST API Documentation

## Base URL
`/api/v1/hr/advanced`

## Authentication & Headers
- `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- `x-tenant-id: <TENANT_ID>`
- `x-hospital-id: <HOSPITAL_ID>`
- `Content-Type: application/json`

---

## 1. Workforce Analytics

### `GET /metrics`
Returns aggregate workforce metrics (total staff, active, probation, resigned, open requisitions, active leaves).

---

## 2. Employee Master Management

### `POST /employees`
Creates a comprehensive employee master record.
- **Request Body**:
```json
{
  "hospitalId": "hosp-metro-001",
  "employeeNumber": "EMP-DOC-8801",
  "firstName": "Dr. Vikram",
  "lastName": "Sethi",
  "gender": "MALE",
  "dateOfBirth": "1984-07-22",
  "phone": "+91 98765 11223",
  "email": "vikram.sethi@asrtava-health.in",
  "bloodGroup": "B+",
  "departmentId": "dept-cardio-01",
  "designationId": "desig-01",
  "baseMonthlySalary": 180000,
  "panNumber": "ABCPS1234F",
  "aadhaarMasked": "XXXX-XXXX-9876"
}
```

### `GET /employees`
Lists employees with optional `departmentId` and `status` filters.

### `POST /employees/:id/link-user`
Links an employee record to a central identity user account upon admin authorization.

---

## 3. Recruitment & ATS

### `POST /requisitions`
Creates a departmental hiring requisition.

### `PATCH /requisitions/:id/approve`
Approves a job requisition, moving status to `OPEN`.

### `POST /candidates`
Registers a job candidate profile and resume.

### `POST /applications`
Submits an application for a specific requisition.

### `POST /applications/:id/evaluate`
Records structured clinical interview evaluation with score (1–5) and recommendation.

### `POST /applications/:id/offer`
Issues formal offer with offered CTC and expected joining date.

---

## 4. Biometric Attendance & Rostering

### `POST /attendance/devices`
Registers a biometric or RFID hardware device with IP and port.

### `POST /attendance/punch`
Records a punch event with automatic 2-minute deduplication checking.

### `POST /attendance/corrections`
Submits an attendance correction request.

### `PATCH /attendance/corrections/:id/approve`
Supervisor approves attendance correction, injecting verified punch logs.

### `POST /rosters`
Assigns duty roster shift with anti-collision validation.

---

## 5. Leaves & Payroll

### `POST /leaves/apply`
Applies for leave with balance quota validation.

### `PATCH /leaves/:id/approve`
Approves leave and deducts employee quota balance atomically.

### `POST /payroll/batches`
Creates monthly hospital payroll run.

### `POST /payroll/batches/:id/calculate`
Calculates employee earnings, Indian statutory deductions (PF, ESI, PT, TDS), and net pay.

### `POST /payroll/batches/:id/post-gl`
Validates $\sum \text{Debits} == \sum \text{Credits}$ and posts balanced double-entry JV to General Ledger.

---

## 6. Separation & Access Termination

### `POST /separations`
Initiates employee resignation or termination.

### `PATCH /separations/:id/clearance`
Updates departmental handover, asset return, and finance clearance.

### `POST /separations/:id/finalize`
Finalizes separation, marks employee inactive, and instantaneously revokes user account access.

