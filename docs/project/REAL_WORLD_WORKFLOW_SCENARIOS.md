# ASRTAVA — Real-World Hospital Operational Workflow Scenarios

## 1. Scope & Objective

This document formalizes the complete operational specifications, lifecycle state machines, transactional integrity guarantees, and cross-department handoffs for realistic hospital operations across the ASRTAVA multi-tenant platform.

---

## 2. Comprehensive Operational Scenarios

### Scenario 1: Outpatient Department (OPD) End-to-End Journey
1. **Patient Intake & Deduplication**:
   - Patient arrives at reception desk.
   - Reception searches by phone number (`+91 98765 43210`) and DOB (`1984-06-15`).
   - If found, patient profile is reused. If new, unique UHID (`SIM-PT-00100`) is minted.
   - Duplicate creation attempts with matching demographic vectors trigger `DUPLICATE_PATIENT_RECORD_DETECTED`.
2. **Consultation Scheduling**:
   - Reception queries Dr. Vikram Malhotra (Cardiology).
   - Slot selected: `10:00-10:15 AM`.
   - Concurrency lock prevents double-booking the doctor's calendar.
3. **Queue Check-In**:
   - Status transitions from `confirmed` to `checked_in`.
   - Sequential daily queue token (`Token #1`) is issued and broadcast to doctor's queue.
4. **Clinical Encounter (SOAP, ICD-10 & e-Rx)**:
   - Doctor reviews medical history, records vitals (BP 130/84, HR 74, SpO2 99%).
   - Subjective symptoms, objective exam, assessment, and management plan documented.
   - ICD-10 diagnosis: `I10` (Essential Hypertension).
   - Electronic prescription issued: Amlodipine 5mg OD x 30 days.
   - Diagnostic orders: Lipid Profile Panel and Chest X-Ray PA view.
5. **Diagnostic Processing**:
   - Lab technician accessions blood specimen (`SPEC-2026`), enters lipid values, and pathologist approves report.
   - Radiographer schedules CXR, acquires DICOM series (`pacs_study_uid`), and radiologist finalizes structured report.
6. **Pharmacy FEFO Fulfillment**:
   - Pharmacist receives signed e-prescription.
   - System auto-selects batch with earliest expiry date (`BAT-2026-B`, Exp: Dec 2026).
   - Available quantity decrements atomically from 50 to 20 units.
7. **Consolidated Billing & Idempotent Payment**:
   - Invoice itemizes consultation, lab panel, imaging, and medication with 18% GST.
   - Net payable: ₹2,424.90.
   - Payment processed via UPI with `idempotency_key` (`IDEMP-OPD-PAY-001`).
   - Replay attempt returns original receipt without duplicate debit.
8. **Patient Portal Synchronization**:
   - Patient logs into web or mobile app; encounters, prescriptions, diagnostic results, and invoices are accessible immediately.

---

### Scenario 2: Inpatient Department (IPD) Admission to Discharge
1. **Admission & Bed Lock**:
   - Patient admitted under Cardiology for rule-out acute coronary syndrome.
   - Semi-Private bed `BED-A-101` allocated atomically.
   - Simultaneous allocation attempt for the same bed is rejected with `BED_OCCUPIED_OR_UNAVAILABLE`.
2. **Nursing Vitals & Care Plan (NCP)**:
   - Nurse records baseline vitals (BP 124/80, HR 72, SpO2 98%).
   - Nursing Care Plan initiated: Goal = "Maintain hemodynamic stability", Interventions = "Continuous ECG, hourly monitoring, low sodium diet".
3. **e-MAR Medication Administration**:
   - Nurse opens e-MAR panel for Heparin 5000 IU IV.
   - Mandates electronic confirmation of the 5 Rights (Right Patient, Right Drug, Right Dose, Right Route, Right Time).
   - Unverified attempts trigger `FIVE_RIGHTS_VERIFICATION_REQUIRED`.
4. **Fluid Balance (Intake / Output)**:
   - Shift intake recorded: 1,200 mL (IV fluids + oral).
   - Shift output recorded: 950 mL (urine + drains).
   - Net balance computed: +250 mL.
5. **SBAR Shift Handover**:
   - Outgoing nurse documents Situation, Background, Assessment, Recommendation.
   - Incoming nurse countersigns electronically.
6. **Discharge & Sanitization Release**:
   - Consultant conducts morning rounds, marks patient stable, and signs discharge order.
   - Admission status transitions to `discharged`.
   - Bed status transitions from `occupied` to `cleaning`, notifying housekeeping.

---

### Scenario 3: Emergency Department (ED) Rapid Triage
1. **Intake & Triage Severity Index**:
   - Walk-in/ambulance triage categorizes patient condition into Emergency Severity Index (ESI) Levels:
     - Level 1: Resuscitation (immediate life threat)
     - Level 2: Emergent (high risk, severe pain)
     - Level 3: Urgent (requires multiple resources, stable vitals)
     - Level 4: Less Urgent (single resource)
     - Level 5: Non-Urgent
2. **Priority Ordering**:
   - Resuscitation cases automatically bubble to the top of the clinical worklist above urgent or routine patients regardless of arrival time.
3. **Rapid Disposition**:
   - Emergency physician initiates immediate stabilization and updates disposition (`transferred_to_icu_ot` or `discharged`).

---

### Scenario 4: Pharmacy Inventory & Concurrency Protection
1. **First-Expired, First-Out (FEFO)**:
   - Stock allocation algorithm evaluates expiration dates and forces consumption of nearest-expiry batches first.
2. **Pessimistic Concurrency Locking**:
   - Database row-level locks prevent race conditions where concurrent dispensers attempt to allocate stock exceeding available quantities.
   - Inventory quantities are strictly guaranteed to never become negative.
3. **Automated Purchase Requisitions**:
   - When active stock drops below defined `reorder_level`, automated purchase orders (`PO-SIM-XXXX`) are drafted for administrative approval.

---

### Scenario 5: Financial Reconciliation & Dual-Control Refunds
1. **Multi-Payment Modes**:
   - Accommodates Cash, Card, UPI, and Bank Wire with partial advance payment and subsequent balance settlement.
2. **Idempotency Guarantee**:
   - All payment endpoints mandate unique idempotency headers. Network retries replay the stored receipt rather than generating double charges.
3. **Supervisor-PIN Authorized Refunds**:
   - Reversal of settled transactions requires dual-control supervisor PIN authorization and mandatory audit justification notes.

