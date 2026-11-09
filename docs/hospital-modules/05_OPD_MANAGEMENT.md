# Module 05: Outpatient Department (OPD) Management Specification

## 1. Overview
The OPD Management module coordinates the end-to-end outpatient journey: patient arrival, triage vitals logging, doctor consultation workbench, clinical notes (SOAP), ICD-10 diagnoses, electronic prescriptions (CPOE), diagnostic investigation requisitions, and visit closure.

---

## 2. End-to-End Clinical OPD Workflow

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Token Called   │ ────► │ Vitals Recorded │ ────► │ Doctor Consult  │ ────► │  SOAP Notes &   │
│ (Waiting Queue) │       │ (Triage Nurse)  │       │  (Room / Desk)  │       │  ICD-10 Diag    │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                                                       │
         ┌─────────────────────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ E-Prescription  │ ────► │   Diagnostic    │ ────► │  Visit Closure  │
│ (Formulary CPOE)│       │  Orders (Lab)   │       │  & Follow-up    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 3. Clinical Data Integrity & Amendment Protocol
1. **Immutable Finalized Records**: When a physician completes a consultation, the clinical record is finalized. The original notes cannot be overwritten.
2. **Versioned Clinical Amendments**: If modifications are required (e.g., in light of new lab findings), an authorized physician submits an amendment through `/api/v1/clinical/consultations/:id/amend`:
   - Records historical note state in `consultation_amendments`.
   - Appends an audit trace: `[AMENDMENT #N - TIMESTAMP by DOCTOR]: TEXT (Reason: REASON)`.
   - Retains full legal and clinical audit traceability.

---

## 4. API Endpoints
- `POST /api/v1/clinical/consultations`: Record SOAP consultation notes, vitals, ICD-10 diagnoses, e-prescriptions, and order lab tests in an atomic transaction.
- `POST /api/v1/clinical/consultations/:id/amend`: Legally amend a finalized clinical consultation record.
- `GET /api/v1/clinical/patients/:patientId/prescriptions`: Retrieve active and past patient electronic prescriptions.

