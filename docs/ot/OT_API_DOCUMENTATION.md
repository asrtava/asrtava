# ASRTAVA Operation Theatre REST API Specification

## Base Path
`/api/v1/ot/advanced`

## Endpoints

### 1. Register Operating Theatre
- **POST** `/theatres`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "theatreNumber": "OT-Suite 1 (Modular)",
    "name": "Cardiothoracic & Vascular OT",
    "specialty": "CARDIOTHORACIC",
    "isLaminarAirflow": true,
    "branchId": "branch-main"
  }
  ```

### 2. Multi-Resource Surgery Scheduling
- **POST** `/schedules`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "theatreId": "theatre-101",
    "patientId": "pat-101",
    "primarySurgeonId": "doc-surgeon-sethi",
    "anaesthetistId": "doc-anaesth-ananya",
    "scheduledStart": "2026-11-10T08:30:00Z",
    "scheduledEnd": "2026-11-10T12:30:00Z"
  }
  ```

### 3. Preoperative PAC Assessment
- **POST** `/preop-assessments`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "scheduleId": "sched-101",
    "patientId": "pat-101",
    "anaesthetistId": "doc-anaesth-ananya",
    "asaClass": "ASA_III",
    "mallampatiScore": "II",
    "fastingHoursSolid": 8,
    "fastingHoursClearFluids": 3
  }
  ```

### 4. WHO Surgical Safety Checklist
- **POST** `/who-checklist`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "scheduleId": "sched-101",
    "phase": "TIME_OUT",
    "verifiedBy": "doc-surgeon-sethi",
    "details": {
      "teamMembersIntroduced": true,
      "antibioticGivenWithin60m": true,
      "imagingDisplayed": true
    }
  }
  ```

### 5. Surgical Counts Reconciliation
- **POST** `/surgical-counts`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "scheduleId": "sched-101",
    "countCategory": "SPONGES_GAUZE",
    "initialCount": 10,
    "intraopAddedCount": 5,
    "closingCount": 15,
    "scrubNurseId": "nurse-priya",
    "circulatingNurseId": "nurse-deepa"
  }
  ```

### 6. PACU Recovery & Discharge
- **POST** `/pacu/admit`
- **POST** `/pacu/aldrete-score`
- **POST** `/pacu/discharge`

