# ASRTAVA Medication Safety Engine & Clinical Decision Support Validation

## 1. Safety Framework Overview

The ASRTAVA Medication Safety Engine provides real-time, proactive Clinical Decision Support (CDS) at both the point of physician prescription ordering (CPOE / eRx) and the point of pharmacist dispensing verification. It is designed to virtually eliminate preventable adverse drug events (ADEs), dispensing mix-ups, and overdose incidents.

```
+---------------------------------------------------------------------------------------------------+
|                                  PHYSICIAN PRESCRIPTION ORDER (eRx)                               |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                              CLINICAL DECISION SUPPORT (CDS) ENGINE                               |
|                                                                                                   |
|  [Allergy Cross-Reactivity]  [Drug-Drug Interactions]  [Duplicate Therapy]  [Dose Ceiling Guard]  |
|            |                           |                       |                      |           |
|            v                           v                       v                      v           |
|     Beta-Lactam Ring            CYP3A4 / Warfarin       Active Molecule       Renal eGFR Adjust   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                     SEVERITY EVALUATION & GATING                                  |
|                                                                                                   |
|   INFO / LOW       --> Non-blocking informational prompt                                           |
|   MODERATE         --> Caution prompt with acknowledgment                                         |
|   SEVERE / FATAL   --> HARD-STOP BLOCK (Requires Documented Clinical Override Justification)     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Safety Algorithms

### 2.1 Known Patient Allergy Screening
- **Chemical Class & Substance Mapping:** Evaluates patient active allergy profile (`patient_allergies`) against both the trade product and active chemical components in `drug_ingredients`.
- **Cross-Reactivity Rules:** Penicillin allergies automatically trigger alerts on semi-synthetic penicillins (Ampicillin, Amoxicillin, Piperacillin) and calculate cross-allergenicity scores against early-generation cephalosporins (Cephalexin, Cefazolin).
- **Severity Classification:** `FATAL` / `CONTRAINDICATED` creates an immediate prescription gate.

### 2.2 Drug-Drug Interaction (DDI) Matrix
- **Bidirectional Pair Evaluation:** Checked against the comprehensive `clinical_drug_interactions` repository.
- **Interaction Mechanisms Analyzed:**
  1. *Pharmacodynamic Synergism:* Concurrent anticoagulants and NSAIDs (e.g. Warfarin + Aspirin) leading to major GI hemorrhage.
  2. *Pharmacokinetic CYP450 Inhibition/Induction:* Macrolide antibiotics (Clarithromycin) co-prescribed with Statins (Atorvastatin) risking acute rhabdomyolysis.
  3. *Additive QT Prolongation:* Antiarrhythmics (Amiodarone) combined with fluoroquinolones (Levofloxacin) risking Torsades de Pointes.
  4. *Serotonin Syndrome:* SSRIs (Fluoxetine) combined with Tramadol or MAO inhibitors.

### 2.3 Duplicate Therapy & Active Ingredient Overdose Protection
- **Molecular Identity Inspection:** The engine inspects `drug_ingredients` rather than superficial trade names.
- **Example Prevention:** If a doctor prescribes *Augmentin* (Amoxicillin + Clavulanic Acid) while another active order exists for *Amoxil* (Amoxicillin), the engine flags duplicate active therapy and calculates the cumulative daily dose of Amoxicillin against maximum safe daily limits ($4000\text{ mg/day}$).

### 2.4 Look-Alike / Sound-Alike (LASA) & Tall Man Lettering
- **Algorithm:** Uses phonetic matching (Double Metaphone / Levenshtein distance) combined with ISMP (Institute for Safe Medication Practices) approved Tall Man capitalization tables.
- **Visual Distinction:**
  - `predniSONE` vs. `predniSOLONE`
  - `hydrOXYzine` vs. `hydrALAZINE`
  - `vinBLAStine` vs. `vinCRIStine`
  - `cycloSERINE` vs. `cycloSPORINE`
  - `dopAMINE` vs. `doBUTamine`
- **UI Rendition:** Tall Man characters are highlighted in bold colored typography in all search dropdowns, prescription views, and dispense labels to minimize cognitive fatigue errors.

---

## 3. Clinical Override Governance & Audit Trail

When a clinical warning is flagged with `severity = 'CONTRAINDICATED'` or `'SEVERE'`, the doctor cannot simply dismiss the dialogue with a single click.

1. **Mandatory Documentation Requirements:**
   - **Reason Code:** Selected from standardized taxonomy (`BENEFIT_OUTWEIGHS_RISK`, `MONITORING_ESTABLISHED`, `ALTERNATIVE_INEFFECTIVE`, `ACUTE_EMERGENCY_TREATMENT`, `PATIENT_TOLERATED_PREVIOUSLY`).
   - **Free-text Clinical Justification:** Minimum 15-character clinical rationale describing the monitoring plan (e.g. *"Daily INR monitoring ordered; patient in cardiac ICU under continuous observation"*).
   - **Clinician Authentication:** Authenticated clinician ID, digital timestamp, and IP address.
2. **Persistence in `clinical_alert_overrides`:**
   Every override is permanently logged and linked to the specific prescription ID and alert ID.
3. **Downstream Pharmacist Visibility:**
   Overrides appear highlighted in the Pharmacist Verification Queue. The pharmacist sees the exact clinical rationale entered by the doctor before deciding whether to approve, clarify, or reject the order.

---

## 4. Inpatient Five Rights & Dual-Nurse Cosign Rules

Medication administration in the electronic Medication Administration Record (`inpatient_emar_records`) validates the classical **Five Rights**:
1. **Right Patient:** Barcode scan of the patient wristband matches the active encounter ID.
2. **Right Drug:** Barcode scan of the dispensed medication packaging matches the prescribed drug master NDC/code.
3. **Right Dose:** Dispensed dosage form matches physician order.
4. **Right Route:** Oral, IV, IM, Subcutaneous, Topical, Inhalation.
5. **Right Time:** Administration window verified against scheduled dose time ($\pm 60\text{ minutes}$ tolerance).

### High-Alert & Controlled Substance Dual Cosign
- **Mandatory Trigger:** Any medication flagged as `isHighAlert: true` (e.g. IV regular insulin, IV potassium chloride, continuous sedation, concentrated electrolytes) or `scheduleType: 'NARCOTIC_NDPS'`.
- **Validation Rule:**
  - Both `administeringNurseId` and `cosigningNurseId` must be provided.
  - `administeringNurseId !== cosigningNurseId` (self-cosigning is strictly rejected with HTTP 400 `CO_SIGN_IDENTITY_ERROR`).
  - Both staff members must hold active nursing or clinical credentials.

