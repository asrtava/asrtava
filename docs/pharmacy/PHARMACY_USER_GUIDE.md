# ASRTAVA Pharmacy Operations Manual & Standard Operating Procedures (SOP)

## 1. Introduction & Role Matrix

This user guide defines standard operational procedures across clinical and administrative workflows for the ASRTAVA Pharmacy and Medication Safety subsystem.

```
+---------------------------------------------------------------------------------------------------+
|                                  HOSPITAL MEDICATION WORKFLOW                                     |
+---------------------------------------------------------------------------------------------------+
|  1. DOCTOR            : Prescribes eRx -> Reviews CDS Alerts -> Submits with Digital Signature    |
|  2. PHARMACIST        : Opens Verification Queue -> Checks Authenticity -> Approves / Substitutes  |
|  3. PHARMACY DISPENSER: FEFO Batch Allocation -> Generates Label -> Dispenses / Delivers          |
|  4. WARD NURSE        : Inpatient eMAR -> Barcode Scans Five Rights -> Dual Cosigns High-Alert     |
|  5. STOREKEEPER       : Blind Stock Counts -> Cold-Chain Monitoring -> Quarantine Handling        |
|  6. PROCUREMENT       : Requisition -> Purchase Order Approval -> GRN 3-Way Matching -> Accounts   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Doctor Workflow: Electronic Prescribing (eRx) & Clinical Decision Support

### Step 1: Open Encounter & Medication Ordering
1. Navigate to Doctor Portal -> Active Encounter -> **Medications & e-Prescription**.
2. Search for the medication by generic name or brand name.
   - Note Tall Man lettering (e.g. `predniSONE` vs `predniSOLONE`) to avoid confusion with look-alike/sound-alike drugs.
   - Check the formulary badge (`FORMULARY`, `RESTRICTED_ANTIMICROBIAL`, or `NON_FORMULARY`).
3. Select dosage form, strength, dose, route, frequency (e.g. `BID`, `TID`, `Q8H`, `STAT`), and duration in days.

### Step 2: Responding to Clinical Decision Support (CDS) Alerts
- **Low / Moderate Alerts:** Yellow banners indicate mild food-drug interactions or cautions. Review and acknowledge.
- **Severe / Fatal Alerts:** Red modal dialog appears if a major drug interaction or allergy is detected:
  - If selecting an alternative: Click **Change Medication** to choose another agent.
  - If overriding: Select an authorized override reason code (e.g. `BENEFIT_OUTWEIGHS_RISK`), type the clinical justification notes, and click **Authorize Clinical Override**.

### Step 3: Digital Signing & Submission
1. Review the completed prescription summary.
2. Click **Digitally Sign & Transmit eRx**.
3. The prescription is locked, assigned a unique cryptographic verification hash, and queued in the Pharmacy Verification Queue.

---

## 3. Pharmacist Workflow: Verification Queue & Dispensing

### Step 1: Accessing the Verification Queue
1. Log in to the Pharmacy Portal -> **Verification Queue**.
2. Prescriptions are ordered by priority: `STAT / EMERGENCY` (red), `URGENT` (orange), and `ROUTINE` (blue).
3. Click a prescription to expand clinical encounter details, patient age, weight, eGFR, allergy profile, and prescriber notes.

### Step 2: Reviewing & Approving Orders
1. Review the prescribed items. Any physician-documented override is highlighted with a gold badge showing the doctor's rationale.
2. If brand-to-generic substitution is requested or required by hospital formulary policy:
   - Check the substitution toggle.
   - Select an approved bioequivalent generic product. The system automatically records the substitution and calculates patient cost savings.
3. Click **Verify & Approve** or **Reject / Return for Clarification**.

### Step 3: First-Expiry-First-Out (FEFO) Dispensing
1. Once verified, click **Allocate & Dispense**.
2. The engine automatically selects the earliest-expiring active batches in your pharmacy location.
3. Review the allocated batch numbers and expiry dates.
4. Click **Print POS Prescription Labels**. Each label contains patient name, drug name (with Tall Man typography), dosage, directions, batch number, and expiry date.

---

## 4. Nursing Workflow: Inpatient eMAR Administration

### Step 1: Reviewing Scheduled Passes
1. Open the Ward Nursing Portal -> **Inpatient eMAR**.
2. Select the ward and patient bed.
3. Review the administration timeline. Scheduled doses due within the active pass window are displayed.

### Step 2: Executing Administration (Five Rights)
1. Verify the patient wristband.
2. Verify the medication blister/vial barcode.
3. Click **Administer Dose**.
4. Select the administration route, dose given, and injection site (if parenteral).

### Step 3: Dual-Nurse Cosign for High-Alert & Narcotic Drugs
- If the medication is an insulin infusion, heparin, concentrated electrolyte, or narcotic:
  - The system prompts for a **Cosigning Registered Nurse**.
  - A second credentialed nurse must enter their credentials to confirm the dose calculation, infusion pump settings, and patient identity.
  - Click **Confirm Cosigned Administration**.

---

## 5. Storekeeper & Warehouse Operations

### Step 1: Daily Cold-Chain Audit
1. Navigate to **Cold Chain Monitor** tab.
2. Inspect refrigerator temperature graphs ($2.0^\circ\text{C} - 8.0^\circ\text{C}$).
3. If an excursion is logged:
   - Immediately inspect the unit physical thermometer.
   - The system automatically places affected lots in `QUARANTINED_TEMP_EXCURSION`.
   - Contact biomedical engineering and the Quality Assurance director.

### Step 2: Conducting Blind Stock Counts
1. Go to **Inventory Reconciliation** -> **Initiate Blind Count**.
2. Print count sheets.
3. Count physical stock without reference to system numbers.
4. Input counted totals. Review calculated variance. Post adjustments with appropriate justification.

---

## 6. Controlled Substance Vault Operations

1. **Dual Custody Mandate:** Two authorized staff (Nurse + Pharmacist) must be physically present at the vault.
2. **Accessing the Vault:**
   - Both staff log in or authenticate on the terminal.
   - Select the patient prescription and exact number of ampoules/tablets disbursed.
   - Both staff confirm their identities to record the transaction.
3. **End-of-Shift Blind Count:**
   - At every shift handoff, the outgoing charge nurse and incoming charge nurse perform a 100% physical count of all narcotic vials.
   - Both signatures are recorded on the shift reconciliation log.

