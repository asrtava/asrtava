# ASRTAVA — Telemedicine EMR & Clinical Integration Validation

## 1. Zero Clinical Silos
ASRTAVA guarantees that teleconsultations do not exist in an isolated island. All notes, diagnoses, prescriptions, and investigation orders written during virtual consultations are stored directly in the hospital's unified Electronic Medical Record (EMR).

---

## 2. Integrated Clinical Modules
1. **SOAP Clinical Encounter**:
   - `Subjective`: Chief complaint, history of present illness.
   - `Objective`: Tele-observations, patient self-reported vitals (SpO2, BP, pulse).
   - `Assessment`: Provisional or confirmed clinical assessment with mandatory ICD-10 diagnostic coding (e.g. `R07.9` Chest pain, unspecified).
   - `Plan`: Management instructions and home care advice.
2. **e-Prescription Integration**:
   - Authorized clinician inputs drug, dosage, route, frequency, duration, and food instructions.
   - Prescription record (`prescriptions` table) is created with status `ACTIVE`.
   - Prescription becomes immediately visible in the patient's mobile app and is queued for fulfillment in the hospital's central/outpatient pharmacy.
3. **Diagnostic Test Requisitions**:
   - Doctor orders lab investigations (e.g. Troponin-I, Lipid Profile) and imaging studies (e.g. 12-lead ECG, Chest X-ray).
   - Orders link directly to the Laboratory Information System (LIS) and Radiology Information System (RIS).
4. **In-Person Hospital Conversion & Referral**:
   - Doctor can flag `requires_in_person_follow_up: true` and specify a referral category (`OPD_IN_PERSON`, `EMERGENCY`, `SPECIALIST`, `INPATIENT_ADMISSION`).
   - Generates follow-up appointment or triggers emergency triage pre-arrival alert.

