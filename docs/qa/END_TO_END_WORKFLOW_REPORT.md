# ASRTAVA End-to-End Hospital Operational Workflow Test Report

## 1. Journey Architecture & Workflow Trace

The end-to-end hospital workflow test (`backend/tests/e2e_workflows.test.ts`) simulates a complete patient care lifecycle across multiple hospital departments.

```
[1. Patient Registration] ---> [2. OPD Appointment Booking] ---> [3. Reception Triage Check-in]
                                                                               |
[6. Laboratory Diagnostics] <-- [5. IPD Admission & Bed Allocation] <-- [4. Doctor Consultation SOAP]
             |
             v
[7. FEFO Pharmacy Dispense] --> [8. Consolidated IPD Billing] --> [9. Discharge & Bed Sanitization]
                                                                               |
                                                                               v
                                                         [10. Cryptographic Audit Chain Linking]
```

---

## 2. Step-by-Step Test Execution Log

| Step | Department | Action Executed | Verification Assertion | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Reception | Patient registered with details | UHID generated: `ASR-PAT-2026-XXXX`; DPDP consent recorded. | **PASSED** |
| **2** | Reception | Appointment booked for Cardiology | Doctor slot reserved (10:00 - 10:20); no double-booking collision. | **PASSED** |
| **3** | Nursing | Patient arrives; vitals recorded | BP (138/88), Pulse (76), SpO2 (98%); triaged to consultation queue. | **PASSED** |
| **4** | Cardiology | Doctor completes SOAP consultation | Primary ICD-10 diagnosis (`I20.0` Unstable Angina) + E-Prescription. | **PASSED** |
| **5** | Admissions | Emergency admission to Cardio ICU | Target bed (`bed-cardio-icu-04`) transitioned from `available` to `occupied`. | **PASSED** |
| **6** | Laboratory | Stat cardiac markers ordered | Troponin I ($0.14 \text{ ng/mL}$) correctly flagged as `critical_high`. | **PASSED** |
| **7** | Pharmacy | Prescribed Aspirin & Atorvastatin | First-Expiry-First-Out (FEFO) batch selected; inventory decremented. | **PASSED** |
| **8** | Billing | Consolidated final invoice created | Subtotal (₹20,650) + GST (₹1,803) = ₹22,453; settled with idempotency. | **PASSED** |
| **9** | Wards | Patient discharge & follow-up | Summary generated; bed transitioned to `cleaning` -> `available`. | **PASSED** |
| **10**| Compliance | Cryptographic Audit Trail linked | SHA-256 Merkle chain block verified for complete patient stay. | **PASSED** |

---

## 3. Workflow Concurrency & Reliability Assessment

- **Atomic Transitions**: Inpatient bed state transitions (`available` $\to$ `occupied` $\to$ `cleaning` $\to$ `available`) prevent split-brain double allocation.
- **Inventory Depletion Integrity**: FEFO sorting guarantees that batches closest to expiry are dispensed first, preventing pharmaceutical expiration waste.
- **Tax Accuracy**: Decimal-safe arithmetic guarantees exact GST calculations across 5%, 12%, and 18% tax categories with zero floating-point drift.

