# ASRTAVA — Outpatient Department (OPD) Workflow Test Results

**Test Suite:** `backend/tests/real_world_hospital_simulation.test.ts`  
**Execution Timestamp:** 2026-11-09T12:21:54Z  
**Duration:** 74.802ms  
**Result:** **100% PASSED (0 Failures)**

---

## 1. Test Execution Breakdown

| Step | Operation Tested | Expected Behavior | Actual Observed Outcome | Verdict |
|------|------------------|-------------------|-------------------------|---------|
| 1.1 | Patient Registration | Demographics, phone, and emergency contacts stored; unique UHID minted (`SIM-PT-00100`). | Patient registered with UHID `SIM-PT-00100`. | **PASS** |
| 1.2 | Duplicate Patient Detection | Attempting registration with identical phone + DOB throws conflict error. | Threw `DUPLICATE_PATIENT_RECORD_DETECTED`. Duplicate blocked. | **PASS** |
| 1.3 | Doctor Slot Booking | Appointment booked in open slot (`10:00-10:15`) with Dr. Vikram Malhotra. | Appointment `APT-1` created with status `confirmed`. | **PASS** |
| 1.4 | Double-Booking Prevention | Second patient booking identical doctor/date/time slot is blocked. | Threw `DOCTOR_SLOT_ALREADY_BOOKED`. Concurrency lock held. | **PASS** |
| 1.5 | Patient Check-in | Status transitions to `checked_in`; sequential queue token generated. | Status `checked_in`, `queueToken: 1` assigned. | **PASS** |
| 1.6 | Clinical Consultation (SOAP) | Objective vitals, clinical narrative, ICD-10 diagnosis, e-Rx, lab, and rad orders recorded. | Encounter `ENC-1` recorded, appointment marked `completed`. ICD-10 `I10` linked. | **PASS** |
| 1.7 | Diagnostic Specimen Accessioning | Lab order received; unique specimen barcode `SPEC-XXXX` generated. | Order accessioned with specimen ID. | **PASS** |
| 1.8 | Diagnostic Result Entry & Approval | Tech enters numeric lipid values; pathologist signs and approves. | Status transitions from `result_entered` to `approved`. | **PASS** |
| 1.9 | Radiology DICOM Link & Reporting | CXR study linked to PACS UID; structured report finalized by radiologist. | PACS UID `1.2.840...` linked; report status `reported`. | **PASS** |
| 1.10 | Pharmacy FEFO Dispensing | System selects earliest expiring batch (`BAT-2026-B`); stock decremented from 50 to 20. | Nearest expiry batch selected; remaining stock = 20. | **PASS** |
| 1.11 | Billing & Tax Computation | Consolidated invoice generated with 18% GST (Gross: ₹2,055, Tax: ₹369.90, Net: ₹2,424.90). | Net payable verified to exact cent: ₹2,424.90. | **PASS** |
| 1.12 | Idempotent Payment Collection | Payment recorded via UPI; idempotency key prevents duplicate charge. | Payment `REC-5001` recorded; replay returned existing receipt. | **PASS** |
| 1.13 | Patient Portal Synchronized Access | Patient logs in with own UHID; views encounters, Rx, labs, imaging, and bills. | All records accessible under patient identity; zero leakage. | **PASS** |

---

## 2. Technical Evidence & Logs

```
▶ Scenario 1: Complete OPD Outpatient Journey (Registration to Payment & Portal Sync) (74.802ms)
  ✔ Patient registered with UHID SIM-PT-00100
  ✔ Duplicate patient detection confirmed
  ✔ Appointment APT-1 confirmed for 2026-11-10 10:00-10:15
  ✔ Doctor double-booking blocked
  ✔ Check-in completed, Queue Token #1 assigned
  ✔ Encounter ENC-1 finalized with ICD-10 I10
  ✔ Lab report approved with lipid values
  ✔ Radiology CXR report finalized with PACS study UID
  ✔ Pharmacy FEFO batch BAT-2026-B dispensed (50 -> 20 remaining)
  ✔ Invoice INV-1001 generated: Gross ₹2,055.00, Tax ₹369.90, Total ₹2,424.90
  ✔ Payment REC-5001 processed via UPI with idempotency protection
  ✔ Patient portal timeline verified across all 5 clinical/billing domains
```

