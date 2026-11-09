# ASRTAVA Emergency Department REST API Specification

## Base Path
`/api/v1/emergency/advanced`

## Endpoints

### 1. Register Emergency Encounter (Known or Unknown)
- **POST** `/encounters`
- **Request Body (Unidentified Patient)**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "isUnknownIdentity": true,
    "arrivalMode": "AMBULANCE",
    "presentingComplaint": "High-speed road traffic accident polytrauma, unconscious at scene",
    "isMedicoLegal": true
  }
  ```

### 2. Triage Assessment & Zone Allocation
- **POST** `/triage`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "encounterId": "ed-101",
    "triagedByUserId": "user-triage-nurse",
    "heartRate": 138,
    "systolicBp": 78,
    "diastolicBp": 42,
    "respiratoryRate": 32,
    "spo2Percent": 84,
    "gcsScore": 6
  }
  ```

### 3. Trauma Code Activation
- **POST** `/trauma-activations`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "encounterId": "ed-101",
    "activationType": "TRAUMA_TEAM_CODE_RED",
    "teamLeaderId": "doc-trauma-leader-01"
  }
  ```

### 4. ATLS Resuscitation Checklist
- **POST** `/resuscitation-checklist`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "encounterId": "ed-101",
    "airwayStatus": "INTUBATED_ETT",
    "cSpineImmobilized": true,
    "breathingStatus": "TACHYPNEIC",
    "circulationPulse": "WEAK_THREADY",
    "ivAccessGauge": "TWO_LARGE_BORE_16G",
    "disabilityGcs": 6,
    "fastScanPositive": true,
    "massiveTransfusionActivated": true
  }
  ```

### 5. STAT Emergency Orders (Payment Override)
- **POST** `/stat-orders`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "encounterId": "ed-101",
    "orderType": "IMAGING_STAT",
    "orderDetails": "STAT Polytrauma CT Whole Body (Head, C-Spine, Chest, Abdomen, Pelvis)",
    "orderedByUserId": "doc-trauma-leader-01"
  }
  ```

### 6. Medico-Legal Case (MLC)
- **POST** `/medico-legal`
- **Request Body**:
  ```json
  {
    "hospitalId": "hosp-apex-001",
    "encounterId": "ed-101",
    "incidentType": "RTA_ROAD_TRAFFIC_ACCIDENT",
    "injuryDescription": "Severe blunt polytrauma, depressed skull fracture, flail chest",
    "policeStationName": "Shivaji Nagar Police Station",
    "policeIntimationNumber": "INTIM-2026-8812",
    "policeConstableName": "HC S. Jadhav (Badge #4812)"
  }
  ```

### 7. Ambulance Fleet & Dispatch
- **POST** `/ambulances`
- **POST** `/ambulances/dispatch`
- **POST** `/ambulances/pcr`
- **POST** `/beds/assign`
- **POST** `/dispositions`

