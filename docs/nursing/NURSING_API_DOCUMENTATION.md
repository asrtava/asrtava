# ASRTAVA Advanced Nursing REST API Specification

**Base URL:** `/api/v1/nursing/advanced`  
**Authentication:** Bearer JWT (`Authorization: Bearer <TOKEN>`)  
**Content-Type:** `application/json`

---

## 1. Nurse Patient Assignments

### `POST /assignments`
Assign a registered nurse to an admitted inpatient.
- **Permissions:** `nursing.patient_assignment.manage`
- **Request Body:**
```json
{
  "wardId": "ward-icu-01",
  "bedId": "bed-icu-04",
  "admissionId": "adm-cardiac-101",
  "patientId": "pat-icu-900",
  "nurseUserId": "nurse-alpha-001",
  "assignmentRole": "PRIMARY",
  "acuityLevel": "CRITICAL"
}
```

### `POST /assignments/:id/reassign`
Reassign an active patient to another nurse with reason documentation.
- **Request Body:** `{ "newNurseId": "nurse-beta-002", "reason": "Emergency rotation" }`

### `GET /workload/:nurseUserId`
Query active patient assignments, bed numbers, and total acuity workload score for a nurse.

---

## 2. Vital Signs & NEWS2 Early Warning System

### `POST /vitals`
Record comprehensive vital signs and calculate NEWS2 score.
- **Permissions:** `nursing.observations.record`
- **Request Body:**
```json
{
  "admissionId": "adm-cardiac-101",
  "patientId": "pat-icu-900",
  "systolicBp": 120,
  "diastolicBp": 80,
  "heartRate": 72,
  "respiratoryRate": 16,
  "temperatureCelsius": 36.8,
  "spo2Percent": 98,
  "isSupplementalO2": false,
  "painScore": 2,
  "consciousnessLevel": "ALERT"
}
```
- **Response 201 Created:** Returns vital record and any triggered `nursing_observation_alerts`.

### `POST /vitals/alerts/:alertId/acknowledge`
Acknowledge an acute vital observation alert.
- **Request Body:** `{ "actionNotes": "MET activated, O2 applied" }`

---

## 3. Bedside eMAR Administration

### `POST /emar/administer`
Record medication administration with Five Rights validation and dual cosign.
- **Permissions:** `nursing.medication.administer`
- **Request Body:**
```json
{
  "admissionId": "adm-cardiac-101",
  "patientId": "pat-icu-900",
  "drugId": "drug-insulin-regular",
  "scheduledTime": "2026-11-09T18:00:00Z",
  "administrationStatus": "ADMINISTERED",
  "doseAdministered": "6 Units",
  "routeUsed": "SUBCUTANEOUS",
  "siteOfAdministration": "Abdomen, Left Lower Quadrant",
  "isHighAlertOrNarcotic": true,
  "cosigningNurseId": "nurse-cosign-002"
}
```

---

## 4. Structured Assessments & Care Plans

### `POST /assessments`
Record Braden, Morse Fall, GCS, or MUST assessments.
- **Request Body:** `{ "templateCode": "BRADEN_SCALE", "assessmentData": { "sensory": 2, "moisture": 2, "activity": 1, "mobility": 2, "nutrition": 2, "friction": 1 } }`

### `POST /care-plans`
Create individualized nursing care plan.
- **Request Body:** `{ "nursingDiagnosis": "Impaired Gas Exchange", "measurableGoals": "SpO2 >= 95%", "plannedInterventions": ["Semi-Fowlers positioning", "O2 nasal cannula"] }`

---

## 5. SBAR Handover & Incidents

### `POST /sbar-handover`
Submit SBAR shift handover.
- **Request Body:** `{ "wardId": "ward-icu-01", "incomingNurseId": "nurse-beta-002", "censusOccupiedBeds": 12, "censusVacantBeds": 2, "situationSummary": "...", "backgroundSummary": "...", "assessmentSummary": "...", "recommendationsSummary": "..." }`

### `POST /sbar-handover/:id/acknowledge`
Incoming nurse countersigns SBAR handover.

