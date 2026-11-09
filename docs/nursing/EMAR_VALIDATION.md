# ASRTAVA Bedside eMAR Safety & Medication Administration Validation

## 1. Overview & Regulatory Compliance

The ASRTAVA Electronic Medication Administration Record (eMAR) subsystem provides bedside safety verification, linking doctor electronic prescriptions (eRx), pharmacy First-Expiry-First-Out (FEFO) dispensing, and registered nurse administration passes. It is engineered to satisfy JCI (Joint Commission International) and NABH (National Accreditation Board for Hospitals) standards for medication management and safety.

---

## 2. Five Rights Enforcement Architecture

Every administration event requires verified validation of the classical **Five Rights**:

1. **Right Patient:** Bedside positive barcode scanning of patient wristband matches UHID and Inpatient Number. The system strictly rejects using bed number alone as patient identity.
2. **Right Medication:** Barcode scan of dispensed unit-dose blister packaging matches active doctor order.
3. **Right Dose:** Prescribed strength and quantity matches dispensed unit.
4. **Right Route:** Oral, IV bolus/infusion, Subcutaneous, Intramuscular, Inhalation, Topical.
5. **Right Time:** Administration verified within scheduled dose pass window ($\pm 60$ minutes).

---

## 3. High-Alert & Narcotic Dual-Nurse Cosign Protocol

For medications classified under ISMP High-Alert lists (Insulin infusions, IV Heparin, Concentrated Electrolytes, Chemotherapy, and NDPS Narcotics):

- **Mandatory Policy Rule:** A single nurse is strictly prohibited from signing off High-Alert medication administration.
- **Two-Person Verification:** A second credentialed registered nurse must inspect the vial, calculate the dosage, verify pump infusion settings, and enter credentials.
- **Self-Cosign Hard-Block:** If `administeringNurseId === cosigningNurseId`, the backend immediately rejects the request with HTTP 400 `CO_SIGN_IDENTITY_ERROR`.

---

## 4. Omission, Hold & Refusal Workflows

When a scheduled medication cannot be administered:
- The nurse records status as `HELD`, `OMITTED`, or `REFUSED`.
- A mandatory clinical reason must be selected and documented (`NPO_SURGERY`, `PATIENT_REFUSED`, `HELD_LOW_BP`, `HELD_BRADYCARDIA`, `VOMITING`).
- The system prevents silent omission without reason documentation (`OMISSION_REASON_REQUIRED`).

