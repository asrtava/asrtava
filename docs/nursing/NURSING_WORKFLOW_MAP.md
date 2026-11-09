# ASRTAVA End-to-End Nursing Workflow Map

## 1. Shift Start, Roster Allocation & Patient Assignment

```
+---------------------------------------------------------------------------------------------------+
| 1. SHIFT COMMENCEMENT                                                                             |
| Nurse logs into Nursing Station Portal -> Selects assigned Ward & Shift (Morning/Evening/Night)    |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. PATIENT ALLOCATION & ACUITY BALANCING                                                          |
| Nursing Supervisor assigns Beds & Patients -> System checks workload acuity ratio                  |
| Scope-based authorization locks nurse's clinical access to assigned ward patients                 |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. INCOMING SHIFT HANDOVER REVIEW                                                                 |
| Nurse reviews SBAR Handover from outgoing shift -> Acknowledges census & critical watch-outs       |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Bedside Patient Identification & Clinical Rounds

```
+---------------------------------------------------------------------------------------------------+
| 1. BEDSIDE WRISTBAND SCAN & POSITIVE IDENTIFICATION                                               |
| Nurse approaches bedside -> Scans patient wristband 2D barcode                                   |
| System matches UHID, Inpatient No., and Full Name (Never relies on bed number alone)              |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. VITALS MEASUREMENT & EARLY WARNING SCORING (NEWS2)                                             |
| Nurse inputs: BP, HR, RR, Temp, SpO2, O2 Flow, Pain, Blood Glucose                                |
| System computes NEWS2 Score:                                                                      |
|   - 0-4 (Low): Routine schedule (Q4H)                                                             |
|   - 5-6 (Medium): Alert ward nurse, increase observation to Q1H                                   |
|   - >=7 (High): Immediate MET / Doctor Escalation -> Emergency Broadcast                          |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. STRUCTURED NURSING ASSESSMENTS                                                                 |
| Admission / Shift assessments executed:                                                           |
|   - Braden Scale (Pressure Risk) -> If <= 12, triggers 2-hourly turning task & air mattress       |
|   - Morse Fall Scale -> If >= 45, activates yellow fall-risk wristband & bed rail alert           |
|   - Glasgow Coma Scale (GCS) -> Documents Eye, Verbal, Motor responsiveness                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Electronic Medication Administration Record (eMAR) Pass

```
+---------------------------------------------------------------------------------------------------+
| 1. REVIEW SCHEDULED PASSES & PRE-ADMINISTRATION VITALS                                            |
| Nurse views eMAR timeline -> Identifies medications due within current administration window      |
| Checks clinical rules (e.g. Digoxin holds if HR < 60; Antihypertensive holds if SBP < 90)        |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. FIVE RIGHTS VERIFICATION                                                                       |
| 1. Right Patient (Barcode Scan)           4. Right Route (IV/Oral/SC/IM)                          |
| 2. Right Medication (Packaging Scan)      5. Right Time (Scheduled Window)                        |
| 3. Right Dose (Prescribed Strength)                                                               |
+---------------------------------------------------------------------------------------------------+
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
             [Standard Medication]                             [High-Alert / Narcotic]
                         │                                                 │
                         │                                                 v
                         │                                     MANDATORY DUAL-NURSE COSIGN
                         │                                     2nd Registered Nurse enters credentials
                         │                                     Cosigns dose, calculation, pump setting
                         │                                                 │
                         └────────────────────────┬────────────────────────┘
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. EXECUTION RECORDING                                                                            |
| - If Given: Records administered time, dose, nurse ID, and injection site (e.g. Left Deltoid)     |
| - If Omitted / Held: Requires mandatory reason code (e.g. NPO for surgery, patient refused)       |
| - Deducts stock batch automatically via FEFO inventory link                                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Fluid Management & Wound Care Documentation

```
+---------------------------------------------------------------------------------------------------+
| 1. FLUID BALANCE RECORDING                                                                        |
| Ingestion: Oral liquids, IV infusions, enteral feeds, blood products                              |
| Excretion: Catheter urine, surgical drain volume, vomitus, ileostomy output                       |
| Engine updates Shift Total and 24-Hour Net Balance: Net = Intake - Output                         |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. WOUND ASSESSMENT & DRESSING REGIMEN                                                            |
| Nurse examines surgical/pressure wound -> Documents Stage, Dimensions (L x W x D cm)              |
| Evaluates tissue bed (% Granulation, % Slough) and exudate level                                  |
| Applies prescribed dressing regimen (e.g. Hydrocolloid, Alginate) -> Schedules next dressing pass |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Shift Handover Handshake (SBAR) & Safety Reporting

```
+---------------------------------------------------------------------------------------------------+
| 1. SBAR SHIFT HANDOVER COMPILATION                                                                |
| Outgoing Nurse populates SBAR:                                                                    |
|   - S (Situation): Admitted diagnosis, surgical post-op day, code status                          |
|   - B (Background): Comorbidities, active allergies, surgical history                             |
|   - A (Assessment): Recent NEWS2, active IV lines/drains, pain control                            |
|   - R (Recommendation): Pending morning bloods, due antibiotics, discharge goals                  |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. MANDATORY RECIPIENT ACKNOWLEDGEMENT                                                            |
| Incoming Nurse reviews SBAR manifest at bedside -> Electronically signs handover acknowledgement  |
| Audit ledger permanently seals handover record with dual signatures and timestamp                 |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. PATIENT SAFETY INCIDENT REPORTING (AS OCCURRING)                                               |
| If fall, medication error, or infiltration occurs -> Nurse initiates Safety Incident Report       |
| Records Category, Location, Immediate Nursing Actions, Physician Notification                     |
| Incident enters immutable ledger -> Triggers QA Root Cause Analysis (RCA) review                  |
+---------------------------------------------------------------------------------------------------+
```

