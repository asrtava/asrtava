# ASRTAVA Role-Specific Portal Structure Specification

## 1. Portal Matrix & Permissions Overview

ASRTAVA delivers 12 specialized portal experiences, strictly bound to user roles and PostgreSQL Row-Level Security tenant policies:

```
                                  ┌───────────────────────────┐
                                  │   ASRTAVA Portal Matrix   │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│   Super Admin    │                  │  Hospital Admin  │                  │  Patient Portals │
│ Platform & Saas  │                  │ Tenant & Staff   │                  │  Web & Mobile    │
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
                                                │
         ┌──────────────────────────────────────┴──────────────────────────────────────┐
         ▼                                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Staff Clinical Portals                                    │
│   Doctor · Nurse · Reception · Pharmacy · Laboratory · Radiology · Finance · HR · Inventory  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Portal-by-Portal Feature Breakdown

### 1. Doctor Consultation Desk (`/doctor`)
- **Primary Function**: Ambulatory outpatient care, clinical examinations, ICD-10 diagnoses, and computerized physician order entry (CPOE).
- **Core Screens & Workflows**:
  - Live OPD Queue with status filters (`Waiting`, `In Consultation`, `Completed`).
  - Active EMR Consultation view displaying chief complaints and logged vitals.
  - Interactive Electronic Prescription (Rx) Builder Modal with medicine formulary quick-pills, dosage forms, frequencies, and durations.
  - Diagnostic Order Modal supporting laboratory tests and imaging requests with Routine vs. STAT urgency.
  - Finalize & Sign Encounter action advancing to next patient in queue.

### 2. Inpatient Nursing Station (`/nurse`)
- **Primary Function**: Ward management, patient monitoring, and medication administration.
- **Core Screens & Workflows**:
  - Interactive Ward Bed Grid (`ICU-A`, `ICU-B`, `General Male`, `General Female`) displaying bed occupancy status (`Occupied`, `Available`, `Cleaning`).
  - Bed Details Modal with attending physician, admitting diagnosis, and allergy alerts.
  - Electronic Medication Administration Record (e-MAR) with 5-rights verification (Right Patient, Right Drug, Right Dose, Right Route, Right Time) and nurse signature sign-off.
  - Physiological Vitals Logger (BP, HR, Temp, SpO2, Blood Sugar) with automated clinical alert threshold flagging.

### 3. Reception & Front Desk (`/reception`)
- **Primary Function**: Patient onboarding, appointment scheduling, queue management, and bed admission.
- **Core Screens & Workflows**:
  - Live OPD Token Queue table with search by UHID, Token, or Name, and doctor filtering.
  - Call Token action triggering visual/audible announcements.
  - Patient Intake & Verification Form with duplicate telephone checking, blood group selection, and DPDP 2023 digital consent.
  - Inpatient (IPD) Bed Allocation intake with instant UHID/IPD issuance.
  - Quick OPD Consultation Slot Booking Modal.

### 4. Pharmacy & Dispensary (`/pharmacy`)
- **Primary Function**: Prescription fulfillment, inventory batch control, and walk-in sales.
- **Core Screens & Workflows**:
  - Doctor Prescriptions Queue with itemized medication cards.
  - Prescription Dispense Drawer allocating stock according to First Expire First Out (FEFO) rules and computing 12% GST breakdown.
  - Point-of-Sale (POS) Counter Retail Checkout for OTC walk-in customers supporting Cash, Card, and UPI.
  - Formulary Stock & Batches table with near-expiry (<60 days) and low-stock warning indicators.

### 5. Clinical Pathology Laboratory (`/laboratory`)
- **Primary Function**: Specimen accessioning, diagnostic analysis, and pathologist validation.
- **Core Screens & Workflows**:
  - Specimen Accessioning Worklist with barcode scan verification simulator.
  - Result Entry & Validation Modal with parameter reference ranges (Biochemistry, Hematology, Microbiology).
  - Automated Normal / High / Low / Critical range indicator badges.
  - Pathologist Digital Signature & Dispatch publishing reports directly to Doctor desks and Patient portals.

### 6. Radiology & PACS Workstation (`/radiology`)
- **Primary Function**: Medical imaging study reviews and structured diagnostic reporting.
- **Core Screens & Workflows**:
  - Modality Worklist (CT Scan, MRI, Digital X-Ray, Ultrasound).
  - Diagnostic PACS Viewer Simulation with window leveling presets (Soft Tissue, Lung, Bone), zoom, and pan controls.
  - Structured Reporting Editor (Technique, Findings, Impression) with digital sign-off.

### 7. Hospital Billing & Finance (`/finance`)
- **Primary Function**: Invoicing, revenue cycle management, payment settlement, and insurance claims.
- **Core Screens & Workflows**:
  - Invoice & Payment Settlement Ledger with live search.
  - Generate Bill Modal for OPD, IPD, and surgery packages with automated GST.
  - Multi-Mode Payment Collection Modal (UPI, Credit Card, Cash, Insurance) with transaction reference and computerized receipt generation.
  - Cashless TPA / Insurance Tracker monitoring pre-authorization claims with Star Health, ICICI Lombard, and Ayushman Bharat (PM-JAY).

### 8. HR & Staff Management (`/hr`)
- **Primary Function**: Healthcare workforce directory, shift rosters, and credentialing.
- **Core Screens & Workflows**:
  - Staff Directory with department, shift timing, and medical council license registration numbers (MCI, INC, PCI).
  - Onboard Healthcare Employee Modal with role and department assignments.
  - Leave Requests Approval / Rejection Workflow with staffing constraint validation.

### 9. Inventory & Central Procurement (`/inventory`)
- **Primary Function**: Medical supply chain, purchase orders, vendor contracts, and warehouse intake.
- **Core Screens & Workflows**:
  - Purchase Orders table tracking orders from approved pharmaceutical suppliers.
  - Create Purchase Order Modal with items, quantities, and cost estimation.
  - Goods Receipt Note (GRN) Inspection & Verification Modal validating physical batches and updating central inventory stock.
  - Critical Reorder Buffer Threshold Alerts.

### 10. Patient Web Portal (`/patient`)
- **Primary Function**: Self-service personal health records, appointment booking, digital prescriptions, and bill payments.
- **Core Screens & Workflows**:
  - Health Overview Hero Card with UHID, blood group, allergies, and ABHA ID.
  - Upcoming Consultations schedule with instant slot booking modal.
  - Signed Electronic Prescriptions (Rx) viewer and PDF download action.
  - Diagnostic Lab & Imaging Reports repository.
  - Online Bill Payment Modal with instant simulated UPI / Net Banking checkout.

### 11. Hospital Administrator Console (`/hospital-admin`)
- **Primary Function**: Single-tenant hospital governance, department operations, and staff administration.
- **Core Screens & Workflows**:
  - Hospital KPI Summary (Active Patients, Bed Occupancy, Today's Revenue).
  - Department Operations & Revenue breakdown table.
  - Provision Staff Member Modal with department membership and custom permission policies.
  - Create Department Modal with dedicated bed quotas.

### 12. Super Admin Platform Console (`/super-admin`)
- **Primary Function**: Multi-tenant SaaS governance, hospital onboarding, subscription tier management, and security audits.
- **Core Screens & Workflows**:
  - Subscribed Hospitals directory with tenant organization codes and plan tiers.
  - Onboard New Hospital Modal with automated PostgreSQL RLS tenant provisioning.
  - Tenant Governance Drawer allowing suspension or reactivation of tenant access.
  - SaaS Pricing Matrix (Starter, Professional, Enterprise).
  - Platform Real-Time Security & Audit Log Stream tracking every cross-tenant access and permission override.

