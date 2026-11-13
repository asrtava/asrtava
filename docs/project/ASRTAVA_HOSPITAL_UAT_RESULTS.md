# ASRTAVA Hospital Departmental User Acceptance Testing (UAT) Report
## Phase 2 Gate 3A: End-to-End Clinical & Operational Workflow Verification

**Document Reference:** `UAT-PHASE2-GATE3A-2026-FINAL`  
**Execution Date:** November 13, 2026  
**Test Environment:** Dedicated Disposable Staging Infrastructure  
**Dataset:** 100% Synthetic Patient & Clinical Test Records (Zero Live Patient Data)  
**Evaluator:** ASRTAVA Automated UAT Verification Engine & Clinical Protocol Review  
**Readiness Classification:** **VERIFIED (SIMULATION BASELINE) / REQUIRES FORMAL HOSPITAL USER SIGN-OFF**

---

### 1. Executive Summary

This report documents the structured departmental user acceptance testing (UAT) conducted across all 11 core clinical, diagnostic, and administrative departments of ASRTAVA.

Each workflow was evaluated under strict preconditions with synthetic patient journeys spanning registration, outpatient clinic, inpatient admission, emergency resuscitation, perioperative care, laboratory diagnostics, medical imaging, pharmaceutical dispensing, and financial discharge.

Automated simulation results and on-site human departmental acceptance prerequisites are reported separately to ensure total governance transparency.

---

### 2. Departmental Acceptance Testing Matrix

| Test ID | Department | Scope & Preconditions | Synthetic Data Profile | Executed Steps | Expected Result | Actual Result | Status | Defect Severity | Hospital Sign-Off Prerequisite |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UAT-REG** | Patient Registration & Front Office | Reception desk workstation; valid tenant context (`hosp-pilot-main-01`) | Patient: *Vikramaditya Rao*, M, DOB: 1978-11-20, Mobile: `+919811223344` | Ingest demographics; capture DPDP statutory consent; issue UHID | Unique UHID generated (`UHID-2026-UAT-9001`); SHA-256 consent hash chained | Generated `UHID-2026-UAT-9001`; consent logged | **PASS** | None | Front Office Supervisor Sign-Off |
| **UAT-OPD** | Outpatient Department (OPD) | Assigned doctor logged in; active appointment slot | Dr. Anita Desai (Cardiology); Chief Complaint: Chest tightness | Record SOAP note; select ICD-10 `I20.0`; issue eRx (Aspirin, Atorvastatin) | Encounter recorded without doctor collision; eRx locked | SOAP recorded; ICD-10 `I20.0` validated; eRx issued | **PASS** | None | Head of OPD Clinical Sign-Off |
| **UAT-IPD** | Inpatient & Bed Management | Doctor IPD admission order; available CCU beds | Patient admitted to CCU; Bed: `bed-ccu-04` | Formalize admission; transfer bed to `bed-ccu-05`; queue old bed for sanitization | Bed state transitions `RESERVED` $\rightarrow$ `OCCUPIED`; vacated bed flips to `CLEANING_REQUIRED` | Bed occupancy transitioned atomically; cleaning queued | **PASS** | None | Ward Sister & Bed Manager Sign-Off |
| **UAT-ED** | Emergency & Trauma | 24/7 ED reception; unknown trauma patient arrival | Polytrauma victim; GCS 7; Systolic BP 70 mmHg | Assign temporary UHID; triage as ESI Level 1; broadcast Trauma Team Code Red | Immediate emergency triage; zero billing blockades; team mobilized | `TEMP-UHID-ED-8821` issued; ESI 1 assigned; Code Red fired | **PASS** | None | Emergency Department Head Sign-Off |
| **UAT-NUR** | Inpatient Nursing & MEWS | Inpatient bed occupied; bedside telemetry active | Patient Vitals: HR 110, RR 24, Temp 38.6°C, SBP 88, SpO2 92% | Chart vitals; compute NEWS2; trigger clinical alert; sign SBAR handover | NEWS2 score of 9 triggers high-deterioration alert; dual nurse SBAR signature | NEWS2 calculated as 9; alert dispatched; SBAR signed | **PASS** | None | Nursing Superintendent Sign-Off |
| **UAT-EMAR** | eMAR Medication Safety | Inpatient prescription active; high-alert narcotic | Drug: *Heparin Sodium Injection*; Patient: *Aarav Sharma* | Scan barcode; screen allergy; require dual-nurse cosign; prevent duplicate dose | 5-Rights verified; second nurse credentials validated; dose committed | Administered by `nurse-icu-01` and cosigned by `nurse-icu-02` | **PASS** | None | Inpatient Pharmacy & Nursing Committee |
| **UAT-OT** | Operation Theatre & PACU | Scheduled CABG procedure; OT suite reserved | Schedule: `surg-cardiac-uat-01`; Surgeon: Dr. Rao | Execute WHO Sign-In, Time-Out, Sign-Out; reconcile sponges (25/25); PACU Aldrete | Zero missing sponges; Aldrete score 10 allows safe step-down discharge | WHO 3 phases logged; sponge count 25/25; Aldrete 10 approved | **PASS** | None | OT Committee & Chief Anaesthesiologist |
| **UAT-LIS** | Laboratory & Pathology | Blood sample drawn in EDTA tube; accessioned | Specimen: `ACC-2026-UAT-991`; Analyte: Cardiac Troponin I (0.22 ng/mL) | Ingest result; verify Westgard IQC; trigger panic alert; record telephone read-back | Troponin I $> 0.04$ triggers panic alert; verbatim read-back closes alert | Alert triggered; verbatim transcript verified; closed | **PASS** | None | Laboratory Director / Pathologist Sign-Off |
| **UAT-RIS** | Radiology & PACS (RIS) | MRI brain order; Siemens 3T Modality active | Order: `ris-ord-mri-01`; Patient cleared for ferromagnetic implants | Query MWL; acquire DICOM study; authorize radiologist textual report | DICOM indexed; report authorized; textual transcript available for a11y | DICOM series indexed; report authorized by `doc-rad-01` | **PASS** | None | Chief Radiologist Sign-Off |
| **UAT-PHARM** | Inpatient Pharmacy | Central warehouse stock; cold-chain storage | Drug: *Rabies Vaccine*; Refrigerator temp: 13.5°C (excursion) | Run FEFO batch pick; detect temperature breach ($> 8^\circ\text{C}$); lock stock | Excursion triggers automated stock quarantine; zero expired batch dispensing | Excursion detected; vaccine batch locked from dispense | **PASS** | None | Chief Pharmacist Sign-Off |
| **UAT-BILL** | Billing, RCM & Finance | Discharged inpatient encounter with itemized orders | CCU stay, Consultations, Diagnostics, eMAR drugs; Gross: ₹29,700 | Generate tax invoice; compute GST (₹2,190); post balanced JV to GL | Sum Debits (₹31,890) equals Sum Credits (₹31,890); zero invoice tampering | Invoice `INV-IPD-2026-8801` issued; GL balanced | **PASS** | None | Chief Financial Officer (CFO) Sign-Off |

---

### 3. Separation of Simulation Evidence vs Human Acceptance

- **Automated Simulation Status:** **11/11 Departmental Scenarios PASSED (100% Technical Conformance)**.
- **Physical Pilot Acceptance Status:** **PENDING ON-SITE DEPARTMENTAL USER SIGN-OFFS**.
- **Requirement:** During Phase 2.5 on-site hospital onboarding, each department representative must witness live execution on hospital workstations and sign the departmental acceptance certificate.
