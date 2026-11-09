# Module 07: Inpatient Nursing Management & e-MAR Specification

## 1. Overview
The Nursing Management module delivers a clinical station workspace for charge sisters and ward nurses, incorporating Electronic Medication Administration Records (e-MAR), fluid balance intake/output charting, nursing care plans, and shift handovers.

---

## 2. Core Functional Capabilities

### 1. Electronic Medication Administration Record (e-MAR)
Ensures patient safety through strict enforcement of the **5 Rights of Medication Administration**:
1. **Right Patient**: Verified via UHID and patient wristband.
2. **Right Drug**: Cross-checked against active doctor prescription.
3. **Right Dose**: Dose quantity and formulation confirmed.
4. **Right Route**: IV push, IV infusion, oral, sublingual, or topical.
5. **Right Time**: Scheduled time window checked.

Administration requires explicit electronic nurse signature and notes. Finalized records cannot be modified or deleted.

### 2. Fluid Balance (Intake / Output Monitoring)
Tracks cumulative 24-hour fluid shifts:
$$\text{Net Balance} = (\text{Oral} + \text{IV Fluid} + \text{Tube Feeding}) - (\text{Urine} + \text{Drains} + \text{Vomitus})$$
Automatically alerts clinical teams if negative balance or severe fluid retention occurs in cardiac or renal patients.

### 3. Nursing Shift Handover Protocol
Ensures continuity of care between shift changes (Morning, Evening, Night):
- Total ward census (occupied vs. vacant beds).
- Critical patients summary (e.g., intubated, inotropic support, critical lab values).
- Outstanding nursing tasks (scheduled IV antibiotics, dressing changes).
- Signed confirmation by both outgoing and incoming nurses.

---

## 3. API Endpoints
- `GET /api/v1/nursing/station-overview`: Ward census, bed status, and active patient list.
- `POST /api/v1/nursing/medications/administer`: e-MAR 5-rights verification and dose sign-off.
- `POST /api/v1/nursing/intake-output`: Chart fluid intake and output volumes.
- `POST /api/v1/nursing/shift-handovers`: Submit and confirm shift handover report.
- `POST /api/v1/nursing/care-plans`: Establish standardized nursing care plan.

