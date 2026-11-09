# Module 06: Inpatient Department (IPD) & Bed Management Specification

## 1. Overview
The Inpatient (IPD) & Bed Management module oversees inpatient admissions, real-time ward bed grid allocations, bed transfers, daily clinical rounds, discharge summaries, final billing clearance, and automated bed sanitization transitions.

---

## 2. Core Functional Capabilities

### 1. Inpatient Admission Intake
- Generated IPD Number: `ADM-XXXXX`.
- Captures admitting doctor, department, initial diagnosis, and admission type (`emergency`, `planned`, `referral`, `day_care`).
- Concurrency-safe bed allocation using pessimistic row-locking (`FOR UPDATE`) to prevent double allocation.

### 2. Bed State Lifecycle
```
                ┌───────────────┐
                │   AVAILABLE   │ ◄──────────────────┐
                └───────┬───────┘                    │
                        │ Allocate                   │ Sanitization
                        ▼                            │ Completed
                ┌───────────────┐                    │
                │   OCCUPIED    │                    │
                └───────┬───────┘                    │
                        │ Discharge / Transfer       │
                        ▼                            │
                ┌───────────────┐                    │
                │   CLEANING    │ ───────────────────┘
                └───────────────┘
```

### 3. Concurrency-Protected Bed Transfer
When a patient is moved from ICU to General Ward (or step-down):
1. Locks the target bed row (`SELECT ... FOR UPDATE`).
2. Marks the previous allocation record `is_current = FALSE` and sets previous bed status to `cleaning`.
3. Creates new allocation record pointing to the target bed and sets target bed status to `occupied`.

### 4. Patient Discharge & Automated Bed Release
Discharge initiates an atomic settlement workflow:
1. Records final discharge diagnosis, clinical summary, and discharge medication instructions.
2. Updates admission record status to `discharged` and timestamps `actual_discharge_date`.
3. Immediately releases the active bed allocation, transitioning the bed status to `cleaning`.
4. Publishes a signed discharge summary document to the patient profile.

---

## 3. API Endpoints
- `GET /api/v1/inpatient/beds`: Live ward bed occupancy directory with patient details.
- `POST /api/v1/inpatient/admissions`: Inpatient admission intake with atomic bed allocation.
- `POST /api/v1/inpatient/bed-transfers`: Bed transfer with old bed cleaning transition.
- `POST /api/v1/inpatient/admissions/:id/rounds`: Inpatient daily doctor rounds & progress notes.
- `POST /api/v1/inpatient/admissions/:id/discharge`: Final patient discharge and bed release.

