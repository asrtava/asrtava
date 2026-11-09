# Cross-Module End-to-End Workflow Mapping

## 1. Master Clinical & Financial Lifecycle Flow
```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant Rec as Reception / Mobile
    participant OPD as Outpatient Doctor
    participant LIS as Laboratory (LIS)
    participant RIS as Radiology (RIS/PACS)
    participant OT as Operation Theatre
    participant IPD as Ward & Bed Management
    participant PHARM as Inpatient Pharmacy
    participant RCM as Billing & General Ledger
    participant EDW as Data Warehouse & Quality

    Patient->>Rec: Registers / Checks in via QR Pass
    Rec->>OPD: Patient assigned to Doctor Queue
    OPD->>Patient: Conducts SOAP Consultation & Diagnoses
    OPD->>LIS: Orders STAT Cardiac Enzymes & CBC
    OPD->>RIS: Orders Chest CT Angiogram
    OPD->>IPD: Recommends Acute Admission
    
    par Diagnostics Execution
        LIS-->>OPD: Results verified with Westgard IQC check
        RIS-->>OPD: DICOM Study Indexed with Radiologist Addendum
    end

    IPD->>IPD: Allocates Bed atomically (Reserved -> Occupied)
    OPD->>OT: Books Emergency Vascular Bypass (Triple-Conflict check)
    OT->>OT: Executes WHO Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out)
    OT->>PHARM: Narcotic infusion (Propofol) requisitioned
    PHARM->>OT: Dual nurse verification & FEFO dispensing
    OT->>IPD: Post-Op Transfer to ICU (Aldrete Score >= 9)

    IPD->>RCM: Discharge Planning finalized & billing cleared
    RCM->>RCM: Consolidated Invoice generated with GST
    Patient->>RCM: Payment settled via Cash / TPA
    RCM->>RCM: Posts balanced Double-Entry Journal Voucher (Dr Bank == Cr Revenue)
    IPD->>IPD: Bed released to Cleaning -> Terminal Sanitization Inspection -> Available
    IPD->>EDW: Evaluates LACE+ Readmission Score & logs episode to Star Schema
```

## 2. Cross-Subsystem Handshakes
1. **Reception $\to$ OPD**: Concurrency-locked token issuing; zero appointment time collision.
2. **Clinical $\to$ LIS/RIS**: Diagnostic orders automatically spawn barcoded lab accession tokens and DICOM Modality Worklist items.
3. **Clinical $\to$ Pharmacy**: Electronic prescriptions carry Tall Man lettering, allergy check gates, and drug-drug interaction warnings.
4. **Clinical $\to$ IPD $\to$ OT**: PAC clearance with ASA physical score required prior to theatre induction.
5. **Clinical $\to$ RCM**: Automatic itemized tariff billing for bed occupancy days, nursing procedures, OT minutes, lab tests, and dispensed medications.
6. **Clinical $\to$ Quality/EDW**: Automatic detection of sentinel events, HAI infection surveillance denominator tracking, and LACE+ predictive risk scoring.

