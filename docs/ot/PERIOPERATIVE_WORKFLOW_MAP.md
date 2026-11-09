# ASRTAVA Complete Perioperative Workflow Map

## 1. End-to-End Surgical Care Pathway

```mermaid
flowchart TD
    A[Surgeon Outpatient or Ward Evaluation] --> B[Surgical Booking Request Submitted]
    B --> C{Urgency Level?}
    C -->|Emergency STAT| D[Immediate OT Room Allocation & Rapid PAC]
    C -->|Elective| E[Pre-Anaesthesia Clinic PAC Assessment]
    E --> F[Informed Consent & Fasting Instructions]
    F --> G[Conflict-Free Scheduling in OT Room]
    D --> H[Patient Transfer to OT Suite]
    G --> H
    H --> I[Phase 1: WHO Sign-In Before Induction]
    I --> J[Anaesthesia Induction & Intubation / Block]
    J --> K[Phase 2: WHO Time-Out Before Skin Incision]
    K --> L[Surgical Incision & Intraoperative Procedure]
    L --> M[Continuous Vital Charting & Narcotics Log]
    M --> N[Wound Closure & Phase 3: WHO Sign-Out]
    N --> O[Reconcile Sponges, Sharps & Instrument Counts]
    O -->|Count Correct| P[Transfer to PACU Recovery Room]
    O -->|Count Discrepancy| Q[Immediate X-Ray & Re-Exploration Alert]
    P --> R[Modified Aldrete Scoring Every 15 Mins]
    R -->|Score >= 9| S[Discharge to Inpatient Surgical Ward / ICU]
    R -->|Score < 9| T[Continued PACU Intensive Observation]
```

## 2. Key Safeguards & Governance
- **Mandatory Surgical Count**: Both Scrub Nurse and Circulating Nurse must verify counts before skin closure.
- **Antibiotic Prophylaxis**: Time-Out phase enforces documented administration of surgical antibiotic prophylaxis within 60 minutes prior to incision.
- **Controlled Narcotics Ledger**: Full dosage accounting (milligrams/micrograms) with nurse cosignature for all intraoperative opioids and sedatives.

