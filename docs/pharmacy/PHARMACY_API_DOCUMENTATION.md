# ASRTAVA Advanced Pharmacy REST API Specification

**Base URL:** `/api/v1/pharmacy/advanced`  
**Authentication:** Bearer JWT Header (`Authorization: Bearer <TOKEN>`)  
**Content-Type:** `application/json`

---

## 1. Drug Master & Formulary Catalog

### `GET /catalog`
Fetch active medications with filtering and Tall Man lettering formatting.
- **Headers:** `tenant-id`, `hospital-id`
- **Query Parameters:** `search` (optional string), `scheduleType` (optional enum), `isFormulary` (optional boolean)
- **Response 200 OK:**
```json
[
  {
    "id": "drug-001",
    "brandName": "predniSONE 10mg",
    "genericName": "prednisone",
    "dosageForm": "TABLET",
    "strength": "10mg",
    "scheduleType": "SCHEDULE_H",
    "isLasa": true,
    "coldChainRequired": false
  }
]
```

### `POST /catalog`
Register a new drug master entry into the hospital formulary.
- **Permissions Required:** `pharmacy.manage`
- **Request Body:**
```json
{
  "brandName": "Augmentin 625 Duo",
  "genericName": "amoxicillin and clavulanate potassium",
  "dosageForm": "TABLET",
  "strength": "625mg",
  "scheduleType": "SCHEDULE_H",
  "hsnCode": "300410",
  "gstRatePercent": 5,
  "coldChainRequired": false,
  "storageCondition": "STORE_BELOW_25C"
}
```
- **Response 201 Created:** Created drug master object.

---

## 2. Clinical Medication Safety & CDS

### `POST /safety/check`
Evaluate a proposed prescription against known allergies, current active medications (DDIs), and duplicate therapy.
- **Request Body:**
```json
{
  "patientId": "pat-100",
  "candidateDrugIds": ["drug-warfarin", "drug-aspirin"],
  "existingActivePrescriptionIds": []
}
```
- **Response 200 OK:**
```json
{
  "hasSevereAlerts": true,
  "alerts": [
    {
      "id": "alert-ddi-1",
      "type": "DRUG_DRUG_INTERACTION",
      "severity": "CONTRAINDICATED",
      "drugIdA": "drug-warfarin",
      "drugIdB": "drug-aspirin",
      "clinicalGuidance": "Co-administration severely elevates major hemorrhage risk. Avoid combination."
    }
  ]
}
```

### `POST /safety/override`
Submit a documented clinical justification for overriding a severe safety alert.
- **Permissions Required:** `pharmacy.prescribe`
- **Request Body:**
```json
{
  "prescriptionId": "rx-2026-901",
  "alertId": "alert-ddi-1",
  "clinicianId": "doc-cardio-01",
  "overrideReason": "BENEFIT_OUTWEIGHS_RISK",
  "justificationNotes": "Patient under mechanical aortic valve anticoagulation; low-dose aspirin mandated per protocol. Daily INR and hematocrit ordered."
}
```
- **Response 201 Created:** Override confirmation record.

---

## 3. Electronic Prescriptions (eRx) & Amendments

### `POST /prescriptions/create`
Create and digitally sign an electronic prescription.
- **Request Body:**
```json
{
  "patientId": "pat-100",
  "encounterId": "enc-500",
  "doctorId": "doc-01",
  "diagnosisCode": "J18.9",
  "items": [
    {
      "drugId": "drug-amox",
      "dose": "500mg",
      "frequency": "TID",
      "route": "ORAL",
      "durationDays": 7,
      "quantityRequested": 21,
      "instructions": "Take after meals"
    }
  ]
}
```

### `PUT /prescriptions/:prescriptionId/amend`
Create an immutable versioned amendment to a signed prescription.
- **Request Body:**
```json
{
  "amendedByDoctorId": "doc-01",
  "amendmentReason": "Adjust dose according to renal clearance (eGFR 35 mL/min)",
  "updatedItems": [
    {
      "drugId": "drug-amox",
      "dose": "250mg",
      "frequency": "BID",
      "route": "ORAL",
      "durationDays": 7,
      "quantityRequested": 14
    }
  ]
}
```
- **Response 200 OK:** Returns new prescription version with incremented `versionNumber = 2`.

---

## 4. Pharmacist Verification Queue

### `GET /verification/queue`
Fetch pending prescription orders awaiting clinical pharmacist review.
- **Query Parameters:** `status` (default: `PENDING_REVIEW`)

### `POST /verification/verify`
Verify, clarify, or reject an eRx order.
- **Permissions Required:** `pharmacy.verify`
- **Request Body:**
```json
{
  "prescriptionId": "rx-2026-901",
  "pharmacistId": "pharm-lead-02",
  "decision": "VERIFIED",
  "verificationNotes": "Dosage, renal clearance adjustments, and duration verified. Approved for dispensing.",
  "substitutionsAllowed": true
}
```

---

## 5. First-Expiry-First-Out (FEFO) Dispensing

### `POST /inventory/dispense-fefo`
Allocate and decrement inventory strictly by earliest expiry date.
- **Request Body:**
```json
{
  "prescriptionId": "rx-2026-901",
  "locationId": "loc-central-pharmacy",
  "dispensedByUserId": "pharm-tech-01",
  "items": [
    {
      "drugId": "drug-amox",
      "quantityRequested": 21
    }
  ]
}
```
- **Response 200 OK:**
```json
{
  "dispenseStatus": "COMPLETED",
  "allocations": [
    {
      "drugId": "drug-amox",
      "batchNumber": "LOT-2026-001",
      "expiryDate": "2026-12-31",
      "quantityAllocated": 21
    }
  ]
}
```

---

## 6. Inpatient Electronic MAR (eMAR)

### `POST /emar/record`
Record a medication administration event with Five Rights validation and dual cosign.
- **Permissions Required:** `pharmacy.administer`
- **Request Body:**
```json
{
  "admissionId": "adm-ward-402",
  "patientId": "pat-100",
  "drugId": "drug-insulin-reg",
  "scheduledTime": "2026-11-09T18:00:00Z",
  "administrationStatus": "ADMINISTERED",
  "doseGiven": "6 Units",
  "routeGiven": "SUBCUTANEOUS",
  "administeringNurseId": "nurse-ward-01",
  "cosigningNurseId": "nurse-ward-02",
  "siteOfAdministration": "Abdomen, Left Upper Quadrant"
}
```

### `GET /emar/admission/:admissionId`
Retrieve the complete medication administration log for an admitted inpatient.

---

## 7. Cold-Chain Monitoring & Recalls

### `POST /cold-chain/log`
Ingest refrigerator or cold room telemetry reading.
- **Request Body:** `storageBinId`, `sensorId`, `temperatureCelsius`, `readingTimestamp`
- **Behavior:** Ingests reading; flags excursion and triggers automated lot quarantine if $T < 2^\circ\text{C}$ or $T > 8^\circ\text{C}$.

### `POST /recalls/initiate`
Initiate an emergency product recall.
- **Request Body:** `recallNumber`, `drugId`, `lotNumber`, `hazardLevel`, `recallReason`
- **Behavior:** Locks batch status hospital-wide and builds past-patient traceability list.

### `GET /recalls/:recallId/traceability`
Retrieve full list of past patients administered or dispensed medication from the recalled lot.

---

## 8. Controlled Substance & Narcotic Vault

### `POST /narcotics/transaction`
Record an immutable dual-custody entry in the Narcotic Vault ledger.
- **Permissions Required:** `pharmacy.narcotics`
- **Request Body:**
```json
{
  "drugId": "drug-morphine-10mg",
  "vaultLocationId": "vault-icu-01",
  "transactionType": "DISBURSEMENT_TO_PATIENT",
  "quantity": 1,
  "patientId": "pat-icu-05",
  "custodianNurseId": "nurse-icu-lead",
  "witnessPharmacistId": "pharm-lead-01",
  "prescriptionReference": "rx-narc-441"
}
```

