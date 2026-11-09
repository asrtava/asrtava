# Module 02: Patient Management & EMR Specification

## 1. Overview
The Patient Management Module provides comprehensive demographic registration, automated unique Medical Record Number (MRN / UHID) generation, Ayushman Bharat Health Account (ABHA) integration, multi-parameter search, duplicate detection algorithms, authorized record merging, and a consolidated Patient 360-degree clinical profile.

---

## 2. Core Functional Capabilities

### 1. Patient Registration & Identification
- **UHID Format**: `APEX-YYYY-XXXXX` (hospital prefix, registration year, 5-digit zero-padded sequence).
- **National Health ID**: Optional Ayushman Bharat ABHA address (e.g., `user@abdm`).
- **Demographics**: Name, DOB, calculated age, gender, blood group, phone, email, residential address, emergency contact person and relation.
- **DPDP 2023 Consent**: Explicit recording of digital health data storage consent.

### 2. Multi-Attribute Duplicate Detection Algorithm
To prevent duplicate patient records while preventing false merges, candidate matching employs a score-based algorithm:
- Exact Primary Telephone Match: **+50%**
- Exact First Name Match (Case-Insensitive): **+25%**
- Exact Last Name Match (Case-Insensitive): **+15%**
- Exact Date of Birth Match: **+10%**

Matching results are categorized as:
- **High Confidence (>= 75%)**: Strong likelihood of duplicate; prompts staff for verification.
- **Medium Confidence (50-74%)**: Review required.
- **Low Confidence (< 50%)**: Separate patient record created.

### 3. Patient Record Merge Workflow
When duplicates are confirmed, an authorized medical records administrator initiates an atomic merge:
1. Re-points all historical foreign keys (`appointments`, `consultations`, `admissions`, `prescriptions`, `lab_orders`, `invoices`, `hospital_documents`) from `source_patient_id` to `target_patient_id`.
2. Sets `source_patient_id.is_active = FALSE` and records deletion timestamp.
3. Inserts an immutable audit record into `patient_merges` capturing actor, reason, and previous state.

### 4. Consolidated Patient 360 Profile
A single API call (`GET /api/v1/patients/:id/360-profile`) retrieves:
- Demographics & Emergency Contacts
- Active Known Drug Allergies & Severity
- Upcoming & Historical Consultations
- Electronic Prescriptions & Dispensing Status
- Diagnostic Laboratory & Radiology Reports
- Inpatient Stays & Ward Bed Allocations
- Invoices, Payments & Outstanding Balances
- Uploaded Clinical Records & Consent Forms

---

## 3. API Endpoints
- `GET /api/v1/patients`: Multi-field patient search (UHID, Name, Phone, Email, Appt ID, Admission ID).
- `POST /api/v1/patients`: Register new patient with duplicate phone check.
- `GET /api/v1/patients/:id/360-profile`: Consolidated 360-degree medical records overview.
- `POST /api/v1/patients/detect-duplicates`: Evaluate potential duplicate candidate records.
- `POST /api/v1/patients/merge`: Atomic patient record merge with audit preservation.
- `POST /api/v1/patients/:id/allergies`: Record drug, food, or environmental allergies.

