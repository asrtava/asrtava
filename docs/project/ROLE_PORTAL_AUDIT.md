# ASRTAVA — Role-by-Role Portal Comprehensive Audit Report

**Document Reference:** `docs/project/ROLE_PORTAL_AUDIT.md`  
**Execution Authority:** ASRTAVA Chief Software Architect & Master Controller  
**Audit Date:** 2026-11-09  
**Status:** Pre-Implementation Baseline & Action Plan

---

## 1. Executive System Audit Summary

An exhaustive inspection of the frontend, backend, database schema, authentication system, and role-specific portals was conducted.

| Portal | Component File | Current Status | APIs Connected | DB Entities Involved | Privacy & Role Boundaries |
|--------|----------------|:--------------:|----------------|---------------------|---------------------------|
| **Hospital Admin** | `portals/hospital-admin/HospitalAdminDashboard.tsx` | **[VERIFIED]** | `/hospitals/*`, `/permissions/*` | `hospitals`, `users`, `departments`, `doctors`, `beds`, `tariffs`, `audit_logs` | Hospital-scoped only. No default access to clinical SOAP notes. |
| **Doctor** | `portals/doctor/DoctorDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/appointments`, `/clinical/*`, `/diagnostics/*` | `appointments`, `patients`, `consultations`, `prescriptions`, `lab_orders`, `radiology_orders` | Restricted to own patient queue & assigned IPD patients. |
| **Nursing** | `portals/nursing/NursingDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/inpatient/*`, `/nursing/*` | `wards`, `rooms`, `beds`, `admissions`, `vital_signs`, `medication_administrations` | Inpatient care only. No access to financial billing or tariffs. |
| **Reception** | `portals/reception/ReceptionDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/patients`, `/appointments`, `/hospitals/*` | `patients`, `appointments`, `doctors`, `departments` | Front office only. Strictly NO access to clinical notes or prescriptions. |
| **Laboratory** | `portals/laboratory/LaboratoryDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/diagnostics/lab/*` | `lab_orders`, `lab_order_items`, `lab_catalog`, `specimens` | Diagnostic data only. No access to doctor fees or financial ledgers. |
| **Radiology** | `portals/radiology/RadiologyDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/diagnostics/radiology/*` | `radiology_orders`, `radiology_studies`, `pacs_studies` | Modality imaging data only. No access to pharmacy inventory. |
| **Pharmacy** | `portals/pharmacy/PharmacyDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/pharmacy/*` | `medicines`, `pharmacy_batches`, `prescriptions`, `dispensations` | Medicine dispensary only. Cannot alter doctor diagnoses or nurse notes. |
| **Finance** | `portals/finance/FinanceDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/billing/*` | `invoices`, `invoice_items`, `payments`, `refunds`, `insurance_claims` | Financial records only. Strictly NO access to confidential clinical charts. |
| **HR & Staff** | `portals/hr/HRDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/hospitals/staff`, `/hospitals/*` | `users`, `staff_profiles`, `departments`, `leave_requests`, `shifts` | Staff credentials and rosters only. No patient EMR access. |
| **Inventory** | `portals/inventory/InventoryDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/pharmacy/*`, `/inventory/*` | `inventory_items`, `purchase_orders`, `suppliers`, `stock_movements` | Procurement & warehouse assets only. |
| **Patient Web** | `portals/patient/PatientDashboard.tsx` | **[PARTIALLY IMPLEMENTED]** | `/appointments`, `/billing/*`, `/clinical/*` | `patients`, `appointments`, `prescriptions`, `lab_reports`, `invoices` | Patient-scoped only (own records). Cannot see other patients. |
| **Patient Mobile** | `apps/patient-mobile/src/screens/*` | **[VERIFIED]** | Same backend API | Same patient records as web portal | Token-based mobile auth, patient-scoped data only. |
| **Super Admin** | `portals/super-admin/SuperAdminDashboard.tsx` | **[VERIFIED]** | `/saas/*` | `tenants`, `subscription_plans`, `platform_metrics`, `jit_requests` | Platform management only. Zero access to patient health data without JIT. |

---

## 2. Gaps Identified & Enhancement Plan

### A. Doctor Portal (`DoctorDashboard.tsx`)
- **Current State**: Working appointment queue, SOAP notes, ICD-10 diagnosis, e-prescriptions, and basic lab orders.
- **Gaps**:
  1. Patient Search by UHID/Name/Phone within authorized hospital context.
  2. Radiology ordering (alongside lab tests).
  3. IPD Inpatient Rounds View (reviewing admitted patients assigned to doctor, logging round notes).
  4. Doctor Availability Toggle (Available vs On Leave / Busy).
  5. Diagnostic report review tab (viewing published lab and imaging findings).

### B. Nursing Portal (`NursingDashboard.tsx`)
- **Current State**: Live bed grid, vital signs logging with alert flags, e-MAR medication administration.
- **Gaps**:
  1. Shift Handover tab & modal (`nursingApi.submitShiftHandover`).
  2. Nursing Care Plan creation (`nursingApi.createCarePlan`).
  3. Intake / Output fluid balance recording (`nursingApi.logIntakeOutput`).
  4. Discharge clearance checklist support.

### C. Reception & Front Office Portal (`ReceptionDashboard.tsx`)
- **Current State**: Patient registration, queue list, check-in, dynamic doctor/department selection.
- **Gaps**:
  1. Appointment rescheduling and cancellation modal (`appointmentApi.reschedule`, `appointmentApi.updateStatus`).
  2. Patient search & verification bar.
  3. Basic billing initiation shortcut (`billingApi.createInvoice`).
  4. Verification of privacy boundary: Reception users cannot access confidential medical notes.

### D. Laboratory Portal (`LaboratoryDashboard.tsx`)
- **Current State**: Order listing, result entry, pathologist sign-off.
- **Gaps**:
  1. Sample collection & specimen barcoding action (`Sample Collected` status transition).
  2. Specimen rejection & recollection tracking.
  3. Critical panic value alert broadcast to attending physician.
  4. Test catalogue view.

### E. Radiology Portal (`RadiologyDashboard.tsx`)
- **Current State**: Worklist, modality filtering, study viewer, reporting & sign-off.
- **Gaps**:
  1. Modality study scheduling & technician assignment.
  2. Critical imaging findings alert toggle.
  3. PACS / DICOM server integration telemetry status indicator.

### F. Pharmacy Portal (`PharmacyDashboard.tsx`)
- **Current State**: Pending prescriptions queue, FEFO batch dispensing, inventory decrements.
- **Gaps**:
  1. Generic medicine substitution dialog conforming to hospital formulary.
  2. Purchase request trigger for items below threshold.
  3. Dispensing receipt review & print view.

### G. Finance & Accounts Portal (`FinanceDashboard.tsx`)
- **Current State**: Invoices list, payment collection (UPI, Card, Cash), invoice generation.
- **Gaps**:
  1. Refund processing modal with authorization checks (`billingApi.requestRefund`).
  2. Insurance / TPA claim pre-authorization workflow.
  3. Separate permission enforcement for viewing invoices, collecting payments, and issuing refunds.

### H. HR & Staff Portal (`HRDashboard.tsx`)
- **Current State**: Staff directory, leave requests list, staff onboarding modal.
- **Gaps**:
  1. Leave request approval and rejection actions.
  2. Shift management & duty roster viewer (Morning, Evening, Night).
  3. Staff attendance summary statistics.

### I. Inventory & Procurement Portal (`InventoryDashboard.tsx`)
- **Current State**: Purchase orders, PO creation, GRN receipt with batch and expiry logging.
- **Gaps**:
  1. Item catalog search and real-time stock levels.
  2. Stock transfer & internal consumption recording.
  3. Reorder level warning alerts.

### J. Patient Web Portal (`PatientDashboard.tsx`)
- **Current State**: Overview, appointments, online bill payment.
- **Gaps**:
  1. Dedicated Prescriptions tab with dosage timing schedule.
  2. Dedicated Diagnostic Reports tab (lab results & imaging reports).
  3. Medical history and allergy profile view.
  4. Strict verification: Patient only accesses their own records.

---

## 3. Implementation Order
1. **Doctor Portal**: Add patient search, radiology ordering, IPD rounds view, availability toggle, and diagnostic reports tab.
2. **Nursing Portal**: Add Shift Handover, Care Plan, and Intake/Output workflows.
3. **Reception Portal**: Add Appointment reschedule/cancel, patient search, and billing initiation.
4. **Laboratory Portal**: Add Sample collection status transition, rejected sample handling, and critical alert notification.
5. **Radiology Portal**: Add Modality study scheduling and critical findings notification.
6. **Pharmacy Portal**: Add Generic drug substitution dialog and purchase requisition.
7. **Finance Portal**: Add Refund processing modal and TPA insurance claim pre-auth.
8. **HR Portal**: Add Leave approval/rejection and shift duty roster view.
9. **Inventory Portal**: Add Item catalog, stock movements, and consumption logging.
10. **Patient Portal**: Add Prescriptions view, Diagnostic reports view, and allergy profile.
11. **Verification & Testing**: Automated end-to-end multi-role test suite and security negative test matrix.

