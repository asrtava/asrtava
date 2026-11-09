# ASRTAVA Tariff Master & Surgical Package Management

## 1. Effective-Dated Tariff Catalog

The ASRTAVA Tariff Master (`tariff_master_catalog`) provides centralized pricing control for every hospital procedure, room category, diagnostic investigation, and clinical consultation.

### 1.1 Tariff Multi-Tier Architecture
Each billable item maintains rate schedules across five standardized payer classes:
1. `GENERAL_CASH`: Standard hospital tariff for walk-in self-pay patients.
2. `INSURANCE_TPA`: Contracted negotiated rate for private health insurance payers.
3. `CORPORATE_PANEL`: Agreed corporate discounted schedule for credit organizations.
4. `GOVERNMENT_SUBSIDIZED`: Ayushman Bharat PMJAY / CGHS / ECHS price ceilings.
5. `INTERNATIONAL_PATIENT`: Tariff schedule for overseas medical tourism patients.

### 1.2 Effective Dating & Version Control
Tariffs feature `effective_from` and `effective_to` dates. Rate revisions scheduled for future fiscal quarters take effect automatically at 00:00:00 on the target date without altering historical invoices.

---

## 2. Hospital Service & Surgical Packages

Packages (`hospital_service_packages`) group related services into standardized fixed-rate offerings (e.g. Normal Delivery, Cesarean Section, Laparoscopic Cholecystectomy, Total Knee Replacement).

### 2.1 Package Inclusion & Exclusion Rules
- **Included Services**: OT room rental, surgical team fee, standard anesthesia, routine post-op recovery stay (e.g. 3 days), standard IV fluids, and nursing care.
- **Excluded Services**: Non-standard blood components, high-cost implants, unexpected ICU escalations, hemodialysis sessions, and specialist cross-consultations.

### 2.2 Patient Package Enrollment (`patient_package_enrollments`)
When a patient is admitted under a surgical package:
1. All included line items are billed at ₹0.00 against the package umbrella.
2. Excluded items accumulate as standard line charges.
3. If the patient's stay exceeds the package stay limit (e.g. 5 days instead of contracted 3 days), additional bed days transition automatically to standard tariff rates.

