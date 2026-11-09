# ASRTAVA Portal Verification & Role Isolation Report

**Document Reference:** `docs/release/PORTAL_VERIFICATION_REPORT.md`  
**Scope:** Verification of 12 Role-Specific Portals in Web Portal & Mobile Ecosystem  
**Target Applications:** `apps/web-portal` (React 19) and `apps/patient-mobile` (React Native)

---

## 1. Role-Based Portal Architecture & Access Control

ASRTAVA features 12 dedicated, isolated role portals. Each portal exposes only the functional surface relevant to the authenticated user's active membership, while the underlying Centralized Permission Engine and PostgreSQL Row-Level Security guarantee that no unauthorized data can be inspected or manipulated.

---

## 2. Portal-by-Portal Functional Verification

### 2.1 ASRTAVA Super Admin Portal (`portals/super-admin/SuperAdminDashboard.tsx`)
- **Key Modules**: Platform KPIs (total hospitals, active MRR, system uptime), Tenant Management, Subscription Plan Builder, Usage & Quotas Metering, Platform Announcements, JIT Support Approvals, System Security & Audit Log Monitor.
- **Data Isolation Guarantee**: Super Admin has platform-level visibility but is strictly barred from clinical patient records (consultation notes, lab diagnoses, medical charts) unless an active, time-bound Just-In-Time (JIT) support ticket is approved with clinical consent.
- **Verification Status**: **[VERIFIED]**

### 2.2 Hospital Admin Portal (`portals/hospital-admin/HospitalAdminDashboard.tsx`)
- **Key Modules**: Hospital Profile & Branding, Departments & Specialty Management, Branch Locations, Staff Directory, Role & Custom Permission Overrides, Operational Telemetry, Billing & Tariffs Setup, Integration Configuration.
- **Permission Boundary**: Administrative authority strictly bound to the active `tenant_id` / `hospital_id`. Cross-hospital administration attempts return HTTP 403 Forbidden.
- **Verification Status**: **[VERIFIED]**

### 2.3 Doctor Portal (`portals/doctor/DoctorDashboard.tsx`)
- **Key Modules**: OPD Consultation Queue, Patient Medical Records, Structured SOAP Notes (Subjective, Objective, Assessment, Plan), ICD-10 Diagnostic Coding, e-Prescription Generator, Diagnostic Order Creation (Lab & Radiology), Clinical History, Follow-Up Scheduler.
- **Clinical Integrity**: Finalized consultation records are immutable; amendments create cryptographically chained audit versions.
- **Verification Status**: **[VERIFIED]**

### 2.4 Nursing Portal (`portals/nursing/NursingDashboard.tsx`)
- **Key Modules**: Inpatient Ward & Bed Map, Patient Bed Allocation, Vital Signs Monitoring (BP, Heart Rate, SpO2, Temperature), Nursing Notes, Medication Administration Records (MAR), Clinical Escalation Workflows, Discharge Preparation.
- **Safety Checks**: Automatic critical alert highlights for abnormal vitals (e.g., SpO2 < 92%, Systolic BP > 160 mmHg).
- **Verification Status**: **[VERIFIED]**

### 2.5 Reception Portal (`portals/reception/ReceptionDashboard.tsx`)
- **Key Modules**: Patient Registration with auto-generated UHID, Patient Search, Appointment Booking & Slot Collision Prevention, Doctor Availability Calendar, Queue Token Check-In, Cash/Card Initial Deposit Processing, Inpatient Admission Registration.
- **Data Protection**: Masks sensitive health details; displays only demographic and scheduling information.
- **Verification Status**: **[VERIFIED]**

### 2.6 Laboratory Portal (`portals/laboratory/LaboratoryDashboard.tsx`)
- **Key Modules**: Diagnostic Specimen Queue, Sample Collection Barcoding, Analyzer Worklist, Test Processing, Qualitative & Quantitative Result Entry, Bio-Reference Range Validation, Critical Value Highlighting, Report Authorization & Publishing.
- **Interoperability**: HL7 v2.5.1 ORU^R01 message generation and FHIR DiagnosticReport resource compliance.
- **Verification Status**: **[VERIFIED]**

### 2.7 Radiology Portal (`portals/radiology/RadiologyDashboard.tsx`)
- **Key Modules**: Imaging Order Worklist, Modality Scheduling (X-Ray, CT, MRI, Ultrasound), Study Acquisition Tracking, DICOM Viewer Bridge (WADO-RS), Radiologist Findings & Impression Editor, Report Authorization.
- **Verification Status**: **[VERIFIED]** (DICOMweb viewer proxy verified; physical PACS server simulated).

### 2.8 Pharmacy Portal (`portals/pharmacy/PharmacyDashboard.tsx`)
- **Key Modules**: Prescription Dispensing Queue, Real-time Stock Inventory, Batch & Expiry Management, First-Expiry-First-Out (FEFO) Auto-Allocation, Negative Inventory Prevention, Drug Dispensation Verification, Pharmacy Bill Generation.
- **Safety Enforcement**: Strict expiration locks prevent dispensing drugs within 30 days of shelf-life expiry without manager override.
- **Verification Status**: **[VERIFIED]**

### 2.9 Finance & Accounts Portal (`portals/finance/FinanceDashboard.tsx`)
- **Key Modules**: Consolidated Inpatient & Outpatient Invoicing, Itemized Tariff Calculations, Statutory GST 18% Tax Computation, Multi-tender Payment Collection (Cash, Card, UPI, Insurance/TPA), Refund Workflows, Daily Financial Reconciliation, Exportable Financial Ledger.
- **Financial Rigor**: Decimal-safe monetary arithmetic preventing floating-point precision loss.
- **Verification Status**: **[VERIFIED]**

### 2.10 HR & Staff Portal (`portals/hr/HRDashboard.tsx`)
- **Key Modules**: Staff Profile Directory, Medical License & Credential Tracking, Departmental Rosters & Shift Scheduling, Attendance Tracking, Leave Approvals, Monthly Payroll Preparation, Staff Verification Documents.
- **Verification Status**: **[VERIFIED]**

### 2.11 Inventory & Procurement Portal (`portals/inventory/InventoryDashboard.tsx`)
- **Key Modules**: Consumables & Equipment Catalog, Stock Balance Tracker, Automated Reorder Point Alerts, Purchase Requisitions, Vendor/Supplier Directory, Goods Received Notes (GRN), Departmental Stock Transfers.
- **Verification Status**: **[VERIFIED]**

### 2.12 Patient Web & Mobile Portal (`portals/patient/PatientDashboard.tsx` & Mobile App)
- **Key Modules**: Patient Self-Service Dashboard, Doctor Discovery, Slot Booking, Upcoming Appointments, Ephemeral QR Check-In Pass, Digital Prescription Downloads, Diagnostic Reports, Itemized Bills & Online Payment, Discharge Summaries, DPDP Consent Center.
- **Cross-Platform Identity**: Web portal and React Native mobile applications synchronize against the same authoritative patient profile and backend APIs.
- **Verification Status**: **[VERIFIED]**

---

## 3. Portal Authorization Matrix Summary

| Portal | Primary Permitted Roles | Default Deny Enforced? | Cross-Tenant Bleed Checked? |
| :--- | :--- | :---: | :---: |
| Super Admin | `SUPER_ADMIN` | YES | N/A (Platform Scope) |
| Hospital Admin | `HOSPITAL_ADMIN`, `HOSPITAL_OWNER` | YES | YES |
| Doctor | `DOCTOR`, `SPECIALIST`, `SURGEON` | YES | YES |
| Nursing | `NURSE`, `HEAD_NURSE` | YES | YES |
| Reception | `RECEPTIONIST`, `FRONT_DESK` | YES | YES |
| Laboratory | `LAB_TECHNICIAN`, `PATHOLOGIST` | YES | YES |
| Radiology | `RADIOLOGIST`, `IMAGING_TECH` | YES | YES |
| Pharmacy | `PHARMACIST`, `PHARMACY_ASSISTANT`| YES | YES |
| Finance | `ACCOUNTANT`, `BILLING_CLERK`, `FINANCE_MGR`| YES | YES |
| HR | `HR_MANAGER`, `STAFF_ADMIN` | YES | YES |
| Inventory | `INVENTORY_MGR`, `STORE_KEEPER` | YES | YES |
| Patient | `PATIENT`, `PATIENT_GUARDIAN` | YES | YES |

