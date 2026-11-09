# ASRTAVA — Inpatient Department (IPD) Workflow Test Results

**Test Suite:** `backend/tests/real_world_hospital_simulation.test.ts`  
**Execution Timestamp:** 2026-11-09T12:21:54Z  
**Duration:** 22.330ms  
**Result:** **100% PASSED (0 Failures)**

---

## 1. Test Execution Breakdown

| Step | Operation Tested | Expected Behavior | Actual Observed Outcome | Verdict |
|------|------------------|-------------------|-------------------------|---------|
| 2.1 | Inpatient Bed Admission | Patient admitted under Cardiology; Bed `BED-A-101` allocated; bed status marked `occupied`. | Admission `ADM-101` created; bed status = `occupied`. | **PASS** |
| 2.2 | Double Bed Allocation Prevention | Second admission attempting to claim `BED-A-101` is blocked. | Threw `BED_OCCUPIED_OR_UNAVAILABLE`. Concurrency lock held. | **PASS** |
| 2.3 | Nursing Vitals & Care Plan | Inpatient baseline vitals logged (BP 124/80, SpO2 98%); NCP care plan initiated. | Vitals logged; Care Plan established with active status. | **PASS** |
| 2.4 | e-MAR 5-Rights Verification | Administering medication without 5-rights confirmation is rejected. | Threw `FIVE_RIGHTS_VERIFICATION_REQUIRED`. Safety gate verified. | **PASS** |
| 2.5 | e-MAR Medication Sign-off | Confirmed 5-rights administration of Heparin 5000 IU records administration audit. | Medication record added with nurse signature and timestamp. | **PASS** |
| 2.6 | Fluid Balance Intake/Output | 1,200 mL intake vs 950 mL output logged; net positive balance (+250 mL) calculated. | Intake 1200 mL, Output 950 mL, Net +250 mL verified. | **PASS** |
| 2.7 | SBAR Shift Handover | Structured shift handover signed between outgoing and incoming nurses. | SBAR record stored with electronic signatures. | **PASS** |
| 2.8 | Consultant Discharge Order | Consultant conducts rounds, marks patient stable, and signs discharge summary. | Admission status transitioned to `discharged`. | **PASS** |
| 2.9 | Automated Bed Sanitization Release | On discharge, bed status automatically transitions to `cleaning` for housekeeping. | Bed `BED-A-101` status updated to `cleaning`. | **PASS** |

---

## 2. Technical Evidence & Logs

```
▶ Scenario 2: Complete IPD Admission, Nursing e-MAR, Fluid Balance & Discharge (22.3301ms)
  ✔ Admission ADM-101 allocated Bed BED-A-101 (status: occupied)
  ✔ Double bed assignment conflict blocked
  ✔ Baseline inpatient vitals (124/80, 98% SpO2) and Care Plan active
  ✔ Unverified e-MAR administration rejected (5-Rights enforced)
  ✔ Verified Heparin 5000 IU administration recorded
  ✔ Fluid balance logged: 1200 mL in, 950 mL out, Net +250 mL
  ✔ SBAR handover transferred to incoming Nurse Sneha Verma
  ✔ Discharge summary finalized by Dr. Vikram Malhotra
  ✔ Bed BED-A-101 released and transitioned to 'cleaning' status
```

