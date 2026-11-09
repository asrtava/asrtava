# ASRTAVA — Inpatient Discharge & Care Transition Workflow Validation

## 1. Overview
The Discharge Workflow coordinates the patient's transition from hospital to home or another care setting. In accordance with clinical ethics, medical statutory law, and ASRTAVA architecture, clinical discharge summaries and care handoffs are strictly decoupled from commercial cashier clearance.

## 2. Proactive Discharge Planning
Discharge planning begins within 24–48 hours of admission:
- **Target Discharge Date (TDD)**: Estimated clinical readiness date.
- **Estimated Length of Stay (ELOS)**: Baseline benchmark based on admitting diagnosis.
- **Barrier Tracking**: Transportation needs, family caregiver availability, durable medical equipment (DME), home oxygen.
- **Medication Reconciliation**: Cross-referencing admission meds, in-hospital changes, and discharge prescriptions.

## 3. Clinical Discharge Finalization
When the treating physician deems the patient clinically stable for discharge:
1. **Discharge Summary Generated**:
   - Primary and secondary diagnoses, hospital course summary.
   - Procedures performed, operative findings.
   - Discharge vital signs and clinical condition (Stable, Guarded, Critical).
   - Discharge medications with dosage, frequency, and duration.
   - Follow-up appointment scheduling and warning signs / emergency red flags.
2. **Admission Status Transitioned**:
   - `ward_ipd_admissions.status` moves from `ADMITTED` to `DISCHARGED`.
   - `discharged_at` timestamp recorded.
3. **Bed Vacation & Housekeeping Automation**:
   - Vacated bed status is immediately flipped from `OCCUPIED` to `CLEANING_REQUIRED`.
   - Terminal sanitization housekeeping task generated with priority `HIGH`.

## 4. Discharge Types
- `ROUTINE`: Planned, clinically indicated discharge.
- `TRANSFER_OUT`: Transfer to higher medical center / specialized institute.
- `LAMA / DAMA`: Left Against Medical Advice / Discharge Against Medical Advice (with statutory signed waiver).
- `DECEASED`: Inpatient mortality documentation with mortuary handover.

