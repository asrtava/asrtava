# ASRTAVA — Ward & Bed Management REST API Documentation

## Base URL
`/api/v1/inpatient/ward/advanced`

## Authentication & Headers
- `Authorization: Bearer <JWT_TOKEN>`
- `x-tenant-id: <TENANT_ID>`
- `Content-Type: application/json`

---

## 1. Bed Availability & Matrix Endpoints

### GET `/availability-metrics`
Returns aggregated real-time occupancy counts across all beds in the hospital or filtered branch.
- **Query Params**: `hospitalId` (optional), `buildingId` (optional), `wardId` (optional)
- **Response**:
```json
{
  "success": true,
  "data": {
    "totalBeds": 120,
    "availableBeds": 42,
    "occupiedBeds": 68,
    "reservedBeds": 5,
    "cleaningRequiredBeds": 3,
    "cleaningInProgressBeds": 1,
    "maintenanceBeds": 1,
    "blockedBeds": 0,
    "occupancyRate": 56.67
  }
}
```

### GET `/matrix`
Returns the hierarchical visual bed grid grouped by building, floor, department, ward, and room.
- **Query Params**: `hospitalId`, `wardType`, `status`
- **Response**: Array of ward objects containing rooms and individual bed operational records.

---

## 2. Inpatient Admission Endpoints

### POST `/admission-requests`
Submits an inpatient admission request by an OPD doctor, ER physician, or external referral.
- **Request Body**:
```json
{
  "hospitalId": "hosp-001",
  "patientId": "pat-9901",
  "doctorConsultantId": "doc-cardio-01",
  "departmentId": "dept-cardio",
  "provisionalDiagnosis": "Acute Coronary Syndrome",
  "priority": "URGENT",
  "preferredRoomType": "PRIVATE",
  "specialRequirements": ["Ventilator", "Continuous Telemetry"]
}
```
- **Response**: 201 Created with `requestId` and status `PENDING`.

### PATCH `/admission-requests/:id/triage`
Coordinator reviews and triages an admission request.
- **Request Body**:
```json
{
  "status": "APPROVED",
  "triageNotes": "Cardiology private room bed 201-A allocated",
  "triagedBy": "coord-priya"
}
```

### POST `/admissions`
Formalizes inpatient admission, assigns the bed, generates IPD admission number, and locks bed status.
- **Request Body**:
```json
{
  "hospitalId": "hosp-001",
  "admissionRequestId": "req-adm-001",
  "patientId": "pat-9901",
  "admittingDoctorId": "doc-cardio-01",
  "attendingDoctorId": "doc-cardio-01",
  "primaryNurseId": "nurse-rekha",
  "wardId": "ward-2a",
  "roomId": "room-201",
  "bedId": "bed-201a",
  "departmentId": "dept-cardio",
  "admittedDiagnosis": "Acute Coronary Syndrome",
  "admissionType": "URGENT"
}
```

---

## 3. Bed Reservation & Transfers

### POST `/bed-reservations`
Places a time-bound holding reservation on an available bed.
- **Request Body**:
```json
{
  "hospitalId": "hosp-001",
  "bedId": "bed-201a",
  "patientId": "pat-9901",
  "reservedBy": "coord-priya",
  "durationMinutes": 45,
  "reason": "Patient transferring from Emergency Observation"
}
```

### POST `/transfers`
Executes an inter-bed or inter-ward clinical transfer.
- **Request Body**:
```json
{
  "hospitalId": "hosp-001",
  "admissionId": "adm-101",
  "fromBedId": "bed-201a",
  "toBedId": "bed-201b",
  "transferReason": "Patient requested window-side private room",
  "transferredBy": "nurse-rekha"
}
```

---

## 4. Housekeeping & Inspection Endpoints

### POST `/housekeeping-tasks/:id/assign`
Assigns cleaning staff to a pending terminal sanitization task.

### POST `/housekeeping-tasks/:id/complete`
Logs completion of terminal cleaning protocols, chemical agents used, and UV sanitization duration.

### POST `/cleaning-inspections`
Supervisor evaluates bed cleanliness, approves release to `AVAILABLE`, or rejects for rework.
- **Request Body**:
```json
{
  "hospitalId": "hosp-001",
  "taskId": "task-hk-101",
  "bedId": "bed-201a",
  "inspectedBy": "supervisor-sunita",
  "status": "APPROVED",
  "checklistCompleted": true,
  "notes": "Terminal sanitization verified; ATP bioluminescence swab passed"
}
```

---

## 5. Discharge Planning & Summaries

### POST `/discharge-plans`
Records proactive multidisciplinary discharge plans, estimated length of stay, barriers, and medication reconciliation.

### POST `/admissions/:id/discharge`
Finalizes clinical discharge summary, transitions admission to `DISCHARGED`, and queues the vacated bed for sanitization.

