# ASRTAVA Advanced Nursing Subsystem Architecture

## 1. Architectural Blueprint

The ASRTAVA Advanced Nursing Subsystem is structured into twelve cohesive domain services operating within the single-codebase modular monolith. It serves as the primary operational orchestration layer connecting bedside nurses with doctors, EMR, pharmacy, laboratory, radiology, and inpatient billing.

```
+---------------------------------------------------------------------------------------------------+
|                                     NURSING STATION COMMAND CENTER                                |
|  Shift Rostering  |  Ward/Bed Allocation  |  Patient Assignment  |  Acuity Triage  |  Handover    |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
+-----------------------------------------------+ +-------------------------------------------------+
|          BEDSIDE PATIENT WORKSPACE            | |         CLINICAL OBSERVATION & MONITORING       |
|  Identity Barcode | Demographics | Allergies  | |  Vitals Stream | NEWS2/MEWS Score | Alerts      |
|  Active Orders | Care Plans | Discharge Ready | |  Frequency Scheduler | Delivery vs Ack State   |
+-----------------------------------------------+ +-------------------------------------------------+
                         │                                                 │
                         ├────────────────────────┬────────────────────────┤
                         ▼                        ▼                        ▼
+---------------------------------+ +-----------------------------+ +-------------------------------+
|      eMAR MEDICATION PASS       | |     NURSING ASSESSMENTS     | |     INTAKE / OUTPUT FLUID     |
|  Five Rights | Pre-Admin Vitals | |  Braden Scale | Morse Fall  | |  Oral, IV, Enteral, Blood     |
|  High-Alert Dual Cosign         | |  GCS | MUST Nutrition | Pain| |  Urine, Drain, Net Balance    |
+---------------------------------+ +-----------------------------+ +-------------------------------+
                         │                        │                        │
                         ├────────────────────────┴────────────────────────┤
                         ▼                                                 ▼
+-----------------------------------------------+ +-------------------------------------------------+
|         WOUND CARE & DRESSING REGIMEN         | |            ICU & HDU FLOWSHEET TELEMETRY        |
|  Staging I-IV | Dimensions (L x W x D) | Photo| |  Ventilator Mode/FiO2/PEEP | Inotrope Titration|
|  Slough/Granulation % | Longitudinal Healing  | |  Arterial Line/CVP | GCS Sub-scores             |
+-----------------------------------------------+ +-------------------------------------------------+
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
|                                 SAFETY, INCIDENTS & COMMUNICATION                                 |
|  SBAR Escalation to Physician | Critical Broadcast | Safety Incident Reporting & Root Cause Audit|
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Domain Services & Data Contracts

### 2.1 Nursing Assignment Service (`NursingAssignmentService`)
- Manages nurse rosters, shifts (Morning, Evening, Night, General), ward allocations, and primary/secondary nurse-to-patient bindings.
- Tracks nurse workload acuity score ($\sum \text{Acuity}_{patient}$) to prevent nurse burnout and balance patient safety ratios.
- Enforces scope-based authorization: nurses can only view and document for patients in their assigned ward/unit unless emergency break-glass access is approved.

### 2.2 Bedside Patient Identification & Workspace Service (`BedsideWorkspaceService`)
- Centralizes multi-identifier verification (UHID, Barcode wristband, Inpatient Number, Name, DOB).
- Prevents wrong-patient errors: enforces barcode confirmation before opening clinical records or administering medications.
- Assembles consolidated chart: Attending physician, admitting diagnosis, active allergies, current medications, latest vitals, active care plans, and doctor orders.

### 2.3 Clinical Observation & Early Warning Scoring Service (`PatientMonitoringService`)
- Records scheduled and on-demand physiological vitals: BP (Systolic/Diastolic), Heart Rate, Respiratory Rate, Temperature ($^\circ\text{C}$), SpO2 (%), Supplemental Oxygen ($L/\text{min}$), Pain Score (0-10), and Blood Glucose ($\text{mg/dL}$).
- Evaluates validated **NEWS2** (National Early Warning Score 2) and **MEWS** (Modified Early Warning Score):
  - $0-4$: Low risk (Routine monitoring every 4-6h).
  - $5-6$ or single score of $3$: Medium risk (Urgent ward nurse review, increase frequency to 1h).
  - $\ge 7$: High risk (Emergency medical team / MET call, continuous monitoring).
- Tracks alert states independently: `ALERT_TRIGGERED` $\to$ `DELIVERED_TO_DEVICE` $\to$ `CLINICALLY_ACKNOWLEDGED` $\to$ `ACTION_DOCUMENTED`.

### 2.4 Structured Nursing Assessment Service (`NursingAssessmentService`)
- Implements standardized, clinically validated assessment instruments:
  1. **Braden Scale (Pressure Injury):** Sensory perception, moisture, activity, mobility, nutrition, friction/shear (Score 6-23; $\le 12$ high risk).
  2. **Morse Fall Scale:** History of falling, secondary diagnosis, ambulatory aid, IV therapy, gait, mental status (Score 0-125; $\ge 45$ high risk).
  3. **Glasgow Coma Scale (GCS):** Eye opening (1-4), Verbal response (1-5), Motor response (1-6) (Total 3-15).
  4. **MUST (Malnutrition Universal Screening Tool):** BMI, weight loss percentage, acute disease effect.
  5. **Wong-Baker / Numeric Pain Scale:** Rating 0 to 10 with anatomical pain localization and aggravating/alleviating factors.

### 2.5 Inpatient eMAR Administration Service (`BedsideEMARService`)
- Deep integration with `inpatient_emar_records` established in migration 024.
- Validates the **Five Rights** before dose recording.
- Checks pre-administration parameters (e.g. holding Digoxin if $\text{HR} < 60\text{ bpm}$, holding regular insulin if $\text{Blood Glucose} < 80\text{ mg/dL}$).
- Enforces mandatory dual-nurse cosign for High-Alert and Narcotic medications (`administeringNurseId !== cosigningNurseId`).
- Supports omission/refusal workflows with documented reason codes (`PATIENT_REFUSED`, `NPO_SURGERY`, `HELD_LOW_BP`, `HELD_LOW_PULSE`, `VOMITING`).

### 2.6 Doctor Orders & Care Plan Management Service (`DoctorOrderCarePlanService`)
- Ingests physician orders across categories: `MEDICATION`, `LABORATORY`, `RADIOLOGY`, `NURSING_PROCEDURE`, `DIET`, `ACTIVITY_RESTRICTION`, `FLUID_MANAGEMENT`.
- Tracks nurse review and execution: `ORDER_ENTERED` $\to$ `ACKNOWLEDGED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED` $\to$ `DISCONTINUED`.
- Manages Individualized Nursing Care Plans structured by Nursing Problem / Diagnosis, Measurable Goals, Interventions, Frequency, and Evaluation Outcomes.

### 2.7 Fluid Management & Balance Service (`FluidManagementService`)
- Records time-stamped intake (Oral, IV continuous/bolus, Enteral feeding, Blood products).
- Records time-stamped output (Urine catheter/void, Surgical drains, Vomitus, Stool/ileostomy, Blood loss).
- Computes automated hourly, shift, and 24-hour Net Fluid Balance:
  $$\text{Net Balance} = \sum \text{Intake} - \sum \text{Output}$$
- Emits fluid overload or dehydration warnings based on patient-specific cumulative volume thresholds.

### 2.8 Wound Care & Tissue Viability Service (`WoundCareService`)
- Tracks individual wounds by ID, anatomical location, and etiology (Surgical, Pressure injury, Venous/Arterial ulcer, Diabetic foot ulcer, Trauma).
- Staging (Stage I, II, III, IV, Unstageable, Deep Tissue Injury).
- Metric dimensions: Length, Width, Depth (cm), and surface area ($\text{cm}^2$).
- Exudate characteristics (Serous, Sanguineous, Serosanguineous, Purulent) and tissue bed percentage (Granulation %, Slough %, Eschar %, Epithelializing %).
- Dressing type, change frequency, and longitudinal healing progress graph.

### 2.9 Bedside Task & Procedure Service (`BedsideTaskService`)
- Bedside tasks with due timestamps: Foley catheter care, IV cannula site change (every 72h), central line dressing, blood glucose check, specimen collection, turning schedule (every 2h for Braden $\le 12$).
- Real-time task board for ward nurses.

### 2.10 Shift Management & SBAR Handover Service (`ShiftHandoverService`)
- Structured clinical handover using the healthcare **SBAR** standard:
  - **S (Situation):** Patient name, age, bed, admitting diagnosis, current code status (Full Code / DNR).
  - **B (Background):** Surgical history, comorbidities, relevant allergy profile, baseline status.
  - **A (Assessment):** Latest NEWS2 score, abnormal vitals, active IV lines/drains, current pain score, mental status.
  - **R (Recommendation):** Pending labs/radiology, scheduled medications during incoming shift, discharge tasks, clinical watch-outs.
- Mandatory electronic signature handshake: Outgoing nurse signs $\to$ Incoming nurse reviews and cosigns.

### 2.11 ICU & HDU Flowsheet Service (`ICUFlowsheetService`)
- High-frequency telemetry flowsheet: Ventilator settings (Mode, FiO2 %, PEEP $\text{cmH}_2\text{O}$, Tidal Volume $\text{mL}$, Plateau Pressure), Arterial line BP, CVP ($\text{mmHg}$), continuous inotrope/vasopressor/sedation titrations (e.g. Noradrenaline $\mu\text{g/kg/min}$, Fentanyl $\mu\text{g/h}$), and pupil reactivity (Right/Left size and response to light).

### 2.12 Patient Safety & Incident Reporting Service (`PatientSafetyIncidentService`)
- Captures safety events: Patient Fall, Medication Error, Extubation, IV Infiltration, Pressure Injury Development, Equipment Malfunction, Near Miss.
- Records Incident Date, Location, Staff Involved, Severity Index (Category A to I), Immediate Clinical Interventions, Attending Physician Notification.
- Immutable incident ledger: ordinary users cannot delete incident logs; updates require administrative root cause analysis (RCA) review and corrective action sign-off.

