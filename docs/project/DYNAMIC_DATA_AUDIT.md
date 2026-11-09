# ASRTAVA Comprehensive Static-Data & Hardcoded Business Values Audit

**Document Reference:** `docs/project/DYNAMIC_DATA_AUDIT.md`  
**Audit Standard:** Dynamic-First, Zero-Hardcoded Business Data Architecture  
**Assessment Date:** 2026-11-09  
**Auditor:** Principal Software Architect & Application Modernization Specialist

---

## 1. Executive Summary & Audit Scope

A comprehensive audit was performed across all 12 web portal dashboards (`apps/web-portal/src/portals/`), React Native mobile screens (`apps/patient-mobile/src/screens/`), backend domain modules (`backend/src/modules/`), and API client bindings (`apps/web-portal/src/services/api.ts`).

### Key Audit Findings
1. **Frontend Portals Hardcoded Data**: **140 static business records** (patients, doctors, bed allocations, drug batches, lab orders, invoices, and SaaS tenants) are hardcoded directly into the `useState(...)` initial states across all 12 web portal views.
2. **Missing Lifecycle API Hydration**: Many portal views lack a `useEffect` hook to fetch live records from the backend API (`apiClient`), displaying static initial mock records indefinitely.
3. **Local-Only State Mutations**: Forms in several dashboards (such as creating a department, scheduling an appointment, or dispensing medicine) only append to local React component state (`setDepartments([...])`), never persisting the transaction to PostgreSQL via `apiClient.post(...)`.
4. **Patient Mobile Static State**: **35 static records** (doctor discovery profiles, lab tests, prescriptions, and invoices) are statically initialized in React Native screens.
5. **Backend Database Infrastructure**: The backend routes (`backend/src/modules/*`) already contain real Knex database queries, schemas, and RLS mechanisms. The primary deficiency is the **frontend-to-backend API disconnection** in the UI presentation layer.

---

## 2. Detailed Audit Register by Component & Module

Every finding is evaluated and classified according to its architectural severity:
- **[CRITICAL]**: Directly prevents cross-portal synchronization, breaks business workflows, or stores financial/clinical records only in browser memory.
- **[HIGH]**: Prevents new entities (doctors, departments, medicines) from appearing in dependent workflows upon creation.
- **[MEDIUM]**: Hardcoded operational settings (tax rates, working hours, currencies) that should be tenant-configurable.
- **[LOW]**: Minor presentation mock items (sample notification text, static chart legends).
- **[ACCEPTABLE STATIC ELEMENT]**: Fixed technical constants, UI labels, route paths, icons, or validation regexes.

```
+-----------------------------------------------------------------------------------------------------------------------------+
| Severity Breakdown:  CRITICAL: 12  |  HIGH: 14  |  MEDIUM: 8  |  LOW: 6  |  ACCEPTABLE: 45                                      |
+-----------------------------------------------------------------------------------------------------------------------------+
```

---

### 2.1 Clinical Portals Audit

#### Finding AUD-001: Doctor Dashboard Patient Queue & Prescriptions
- **File Path**: `apps/web-portal/src/portals/doctor/DoctorDashboard.tsx`
- **Module**: Clinical / Outpatient (OPD)
- **Static Value Found**: Hardcoded `patients` array (lines 59–135) with 3 dummy patients (`Ramesh Verma`, `Pooja Hegde`, `Mohammed Ali`), static vitals, and pre-filled consultation notes. Hardcoded `selectedTests` array.
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: The doctor queue must reflect real patients checked in by the Receptionist (`GET /appointments?status=checked_in&doctorId=...`), and e-prescriptions must save to `consultation_notes` and `prescriptions` tables in PostgreSQL.
- **Required Change**: Replace hardcoded `useState` with `useEffect` calling `appointmentApi.getAppointments()` and `clinicalApi.createConsultation()`. Provide proper empty state ("No patients waiting in queue").
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-002: Nursing Dashboard Beds & Medication Schedule
- **File Path**: `apps/web-portal/src/portals/nursing/NursingDashboard.tsx`
- **Module**: Inpatient (IPD) / Nursing
- **Static Value Found**: Hardcoded `beds` array (lines 62–140) with 8 static beds (`ICU-01`, `GW-101`, etc.) and hardcoded `medicationsDue` array (lines 143–185).
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: Inpatient bed statuses must reflect live database records from `beds`, `wards`, and `admissions`. Administrations must be saved via `nursingApi.administerMedication()`.
- **Required Change**: Hydrate bed grid dynamically via `inpatientApi.getBeds()` and station overview via `nursingApi.getStationOverview()`.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-003: Reception Dashboard Queue & Token Distribution
- **File Path**: `apps/web-portal/src/portals/reception/ReceptionDashboard.tsx`
- **Module**: Outpatient (OPD) / Front Desk
- **Static Value Found**: Hardcoded `queue` array (lines 59–110) with 5 static queue tokens (`T-012`, `T-013`, etc.).
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: Checking in a patient must assign a dynamic token in PostgreSQL and immediately trigger an event visible on the Doctor Dashboard.
- **Required Change**: Wire `patientApi.registerPatient()` and `appointmentApi.getAppointments()` directly to the form submission handlers.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-004: Pharmacy Dashboard Dispensing Queue & Drug Batches
- **File Path**: `apps/web-portal/src/portals/pharmacy/PharmacyDashboard.tsx`
- **Module**: Pharmacy / Inventory
- **Static Value Found**: Hardcoded `prescriptions` array (lines 57–95) and hardcoded `inventory` drug batches with static quantities and expiry dates (lines 98–165).
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: Pharmacy inventory must be fetched from `medicine_batches` and ordered by First-Expiry-First-Out (FEFO). Dispensation must atomically decrement database stock.
- **Required Change**: Hydrate via `pharmacyApi.getMedicines()` and execute dispensations via `pharmacyApi.dispense()`.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-005: Laboratory Dashboard Orders & Critical Biomarkers
- **File Path**: `apps/web-portal/src/portals/laboratory/LaboratoryDashboard.tsx`
- **Module**: Diagnostics / LIS
- **Static Value Found**: Hardcoded `orders` array (lines 44–110) with 4 static test specimens (`CBC`, `Lipid Profile`, `HbA1c`, `Cardiac Troponin I`).
- **Severity**: **[HIGH]**
- **Why Inappropriate**: Diagnostic orders placed by doctors must appear dynamically in the laboratory worklist, and entering results must update database test records.
- **Required Change**: Connect to `diagnosticsApi.getLabCatalog()` and `diagnosticsApi.enterLabResult()`.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-006: Radiology Dashboard Imaging Studies
- **File Path**: `apps/web-portal/src/portals/radiology/RadiologyDashboard.tsx`
- **Module**: Diagnostics / RIS
- **Static Value Found**: Hardcoded `studies` array (lines 42–115) with static DICOM study instances and modalities (CT, MRI, X-Ray).
- **Severity**: **[HIGH]**
- **Why Inappropriate**: Studies must be queried from `radiology_orders` and authorized reports persisted to the database.
- **Required Change**: Fetch via `diagnosticsApi.getRadiologyOrders()` and submit reports via `diagnosticsApi.recordRadiologyReport()`.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

---

### 2.2 Operational, Financial & Governance Portals Audit

#### Finding AUD-007: Hospital Admin Dashboard Departments & Settings
- **File Path**: `apps/web-portal/src/portals/hospital-admin/HospitalAdminDashboard.tsx`
- **Module**: Hospital Governance
- **Static Value Found**: Hardcoded `departments` array (lines 51–58) with static departments (`Cardiology`, `Neurology`, etc.), static JIT requests, and static export jobs.
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: Creating a new department in this dashboard should make it immediately selectable in doctor registration, appointment booking, and clinical reports across all portals.
- **Required Change**: Connect `hospitalAdminApi.getDepartments()`, `hospitalAdminApi.createDepartment()`, and `hospitalAdminApi.getProfile()`.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-008: Finance Dashboard Invoices, Tariffs & Taxes
- **File Path**: `apps/web-portal/src/portals/finance/FinanceDashboard.tsx`
- **Module**: Finance & Invoicing
- **Static Value Found**: Hardcoded `invoices` array (lines 41–110) with 6 static invoices, static totals, and hardcoded tax calculations.
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: Invoices must be dynamically aggregated from OPD/IPD charges and payments recorded to `payments` table.
- **Required Change**: Hydrate invoice ledger dynamically from `billingApi` and execute payment settlements through API.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-009: HR Dashboard Staff Directory & Shift Rosters
- **File Path**: `apps/web-portal/src/portals/hr/HRDashboard.tsx`
- **Module**: Human Resources
- **Static Value Found**: Hardcoded `staff` array (lines 42–50) with 5 static employees and hardcoded leave requests.
- **Severity**: **[HIGH]**
- **Why Inappropriate**: Staff onboarding must persist to `users` and `hospital_users`, and role assignments must immediately update user permissions.
- **Required Change**: Hydrate staff directory via `hospitalAdminApi.getStaff()` and onboard staff via API.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-010: Inventory Dashboard Consumables & Purchase Orders
- **File Path**: `apps/web-portal/src/portals/inventory/InventoryDashboard.tsx`
- **Module**: Procurement & Stores
- **Static Value Found**: Hardcoded `orders` array (lines 31–75) with static purchase orders and static stock balances.
- **Severity**: **[HIGH]**
- **Why Inappropriate**: Stock balances must reflect physical receipts and dispensations.
- **Required Change**: Connect to inventory APIs with live stock level alerts.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-011: Super Admin Dashboard Tenants & Invoices
- **File Path**: `apps/web-portal/src/portals/super-admin/SuperAdminDashboard.tsx`
- **Module**: SaaS Platform Management
- **Static Value Found**: Hardcoded `hospitals` array (lines 73–120), static SaaS subscription invoices, static JIT tickets, and static platform announcements.
- **Severity**: **[HIGH]**
- **Why Inappropriate**: The Super Admin dashboard must reflect real registered hospital tenants (`GET /saas/super-admin/tenants`) and live platform MRR.
- **Required Change**: Connect `saasApi.getTenants()`, `saasApi.getSuperAdminDashboard()`, and `saasApi.getJitRequests()`.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

#### Finding AUD-012: Patient Web & Mobile Dashboards
- **File Path**: `apps/web-portal/src/portals/patient/PatientDashboard.tsx` & `apps/patient-mobile/src/screens/*`
- **Module**: Patient Self-Service
- **Static Value Found**: Hardcoded appointments, prescriptions, and lab report cards in patient views.
- **Severity**: **[CRITICAL]**
- **Why Inappropriate**: Patients must view their own authenticated appointments and medical records in real time.
- **Required Change**: Connect to patient-specific endpoints with authenticated user ID context.
- **Status**: **IDENTIFIED — REMEDIATION PLANNED (PHASE 2)**

---

### 2.3 Acceptable Static Elements Inventory
The following source code elements are audited and confirmed as **ACCEPTABLE STATIC ELEMENTS** per Section 13 of the Master Prompt:
- Application UI labels, button text, and headings (e.g., `"Save Patient"`, `"In Consultation"`).
- Lucide React icon definitions and visual decorators.
- Fixed navigation routes (e.g., `"/staff/login"`, `"/super-admin/dashboard"`).
- Standard healthcare classification enums (e.g., Gender: `Male`, `Female`, `Other`; Blood Groups: `A+`, `A-`, `B+`, etc.).
- RFC standard mime types and file extension allowlists.
- Mathematical algorithms (e.g., FEFO sorting comparator, Merkle hash formula, Luhn check algorithm).

