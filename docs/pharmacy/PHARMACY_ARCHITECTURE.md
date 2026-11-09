# ASRTAVA Advanced Pharmacy Architecture & Subsystem Specification

## 1. Architectural Blueprint

The ASRTAVA Advanced Pharmacy Management Subsystem is structured into ten cohesive, loosely coupled domain services integrated within the ASRTAVA modular monolith:

```
+---------------------------------------------------------------------------------------------------+
|                                     ELECTRONIC PRESCRIPTION (eRx)                                 |
|  Doctor Encounter  |  Clinical Safety Engine  |  Allergy & DDI Checks  |  Digital Signature Gate  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                PHARMACIST VERIFICATION QUEUE                                      |
|  Authenticity Check  |  Dosage Validation  |  Drug Substitution Policy  |  Clinical Clarification  |
+---------------------------------------------------------------------------------------------------+
                                                  |
                         +------------------------+------------------------+
                         |                                                 |
                         v                                                 v
+-----------------------------------------------+ +-------------------------------------------------+
|          OUTPATIENT & RETAIL PHARMACY         | |           INPATIENT eMAR & WARD STOCK           |
|  Fast Checkout | POS Label Printing | Counseling| |  Ward Orders | Scheduled Passes | eMAR Log   |
+-----------------------------------------------+ +-------------------------------------------------+
                         |                                                 |
                         +------------------------+------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                               BATCH-LEVEL INVENTORY & FEFO ENGINE                                 |
|  First-Expiry-First-Out  |  Quarantine  |  Manufacturer Recalls  |  Cold-Chain Excursions        |
+---------------------------------------------------------------------------------------------------+
                                                  |
                         +------------------------+------------------------+
                         |                                                 |
                         v                                                 v
+-----------------------------------------------+ +-------------------------------------------------+
|             PROCUREMENT & SUPPLIERS           | |             RCM BILLING & DOUBLE-ENTRY GL       |
|  PR -> PO -> GRN -> 3-Way Matching -> AP Bill | |  HSN 3004 (5%) | HSN 300490 (12%) | Balanced JV |
+-----------------------------------------------+ +-------------------------------------------------+
```

---

## 2. Core Domain Services & Data Contracts

### 2.1 Drug Master & Formulary Service (`DrugMasterService`)
- Manages standardized drug definitions: generic chemical entity, trade brand, active pharmaceutical ingredients (API), strength, dosage form, administration route, package size, manufacturer, storage condition, and Indian regulatory schedule (Schedule H, H1, X, Narcotic).
- Maintains hospital-specific formulary status (`FORMULARY_OPEN`, `RESTRICTED_ANTIMICROBIAL`, `NON_FORMULARY_SPECIAL_ORDER`).

### 2.2 Medication Safety & Clinical Validation Engine (`MedicationSafetyEngine`)
- **Allergy Check**: Compares prescribed active ingredients against patient medical history allergy profiles (`patient_medical_histories`).
- **Drug-Drug Interaction (DDI)**: Evaluates pairs of active ingredients against reference interaction matrices, assigning severity:
  - `CRITICAL_BLOCK`: Potentially fatal interaction; blocks creation without medical director override.
  - `MAJOR_WARNING`: Serious clinical risk; requires documented prescriber rationale.
  - `MODERATE_MONITOR`: Therapeutic combination requires monitoring.
- **Duplicate Therapy & Active Ingredient Check**: Flags duplicate prescribing of identical molecules or overlapping pharmacological classes.
- **Look-Alike Sound-Alike (LASA) & High-Alert Warnings**: Alerts clinicians to error-prone drug pairs (e.g. Vinblastine vs Vincristine; Hydroxyzine vs Hydralazine) using Tall Man lettering.

### 2.3 Pharmacist Verification & Dispensing Service (`PharmacyDispensingService`)
- Enforces multi-step dispensing pipeline:
  1. Receipt into Pharmacist Verification Queue.
  2. Clinical review of dose, route, frequency, and patient renal/hepatic considerations.
  3. Batch allocation using strict First-Expiry-First-Out (FEFO) logic.
  4. Substitution recording (when brand unavailable, generic alternative permitted under hospital policy).
  5. Barcode verification of physical package before customer handover or ward transit.
  6. Label generation with patient name, UHID, drug name, dosage, frequency, and cautionary pictograms.

### 2.4 Inpatient eMAR & Nursing Integration Service (`InpatientMARService`)
- Manages inpatient Electronic Medication Administration Records (eMAR):
  - Five Rights of Medication Administration: Right Patient, Right Medication, Right Dose, Right Route, Right Time.
  - Administration statuses: `ADMINISTERED`, `OMITTED`, `REFUSED`, `DELAYED`, `HELD`.
  - Mandatory dual-nurse cosign for High-Alert Medications (IV insulin, heparin, chemotherapy, potassium chloride).

### 2.5 Batch, Recall & Cold-Chain Monitoring Service (`PharmacyBatchService`)
- Near-expiry forecasting (90, 60, 30 days) and automated quarantine of expired lots.
- Manufacturer recall management: instant lot freeze, recall cascade, and patient traceability list.
- Cold-chain temperature tracking (2°C – 8°C) with automated excursion alarms and release reviews.

### 2.6 Procurement & 3-Way Matching Service (`PharmacyProcurementService`)
- Purchase Requisition (PR) -> Purchase Order (PO) with tier-based approval -> Goods Receipt Note (GRN) with batch/expiry entry -> Supplier Invoice 3-way match -> Accounts Payable ledger posting.

### 2.7 Controlled Substances & Narcotic Vault Service (`ControlledDrugsService`)
- Double-custody perpetual digital ledger for Schedule X and narcotic drugs.
- Shift-by-shift physical count verification, wastage witness recording, and discrepancy escalation.

