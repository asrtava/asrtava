# ASRTAVA API & Data Flow Map

**Document Reference:** `docs/project/API_DATA_FLOW_MAP.md`  
**Execution Authority:** ASRTAVA API Architect  
**Scope:** Complete Mapping of Frontend Portals to Backend REST APIs & PostgreSQL Database Tables

---

## 1. End-to-End Data Flow Mapping

Every user action, form submission, and dashboard view is traced through its complete data path:

```
[ User Interaction ] ──> [ Frontend Service (`api.ts`) ] ──> [ Express Route Gateway ] ──> [ Knex / PostgreSQL Table ]
```

---

## 2. Comprehensive Module-by-Module Mapping Table

| Portal / View | UI Action / Component | Frontend API Function | Backend HTTP Endpoint | Target PostgreSQL Table(s) | Dynamic Trigger & Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hospital Admin** | Create Department Modal | `hospitalAdminApi.createDepartment()` | `POST /api/v1/hospitals/departments` | `departments` | Automatically populates Doctor Specialty & Appointment dropdowns. |
| **Hospital Admin** | Update Hospital Settings | `hospitalAdminApi.updateSettings()` | `PUT /api/v1/hospitals/settings` | `hospital_settings` | Updates slot duration, working hours, and tax rate across all portals. |
| **Hospital Admin** | Add Hospital Branch | `hospitalAdminApi.createBranch()` | `POST /api/v1/hospitals/branches` | `hospital_branches` | Dynamically updates branch selection in admission and staff rosters. |
| **Reception** | Register New Patient Form | `patientApi.registerPatient()` | `POST /api/v1/patients` | `patients`, `patient_consents` | Generates unique UHID (`APEX-2026-XXXXX`); increments patient counts. |
| **Reception** | Book OPD Appointment | `appointmentApi.scheduleAppointment()` | `POST /api/v1/appointments` | `appointments`, `opd_queues` | Prevents slot collision; queues token dynamically in Doctor Queue. |
| **Reception** | Check-in Patient | `appointmentApi.updateStatus()` | `PATCH /api/v1/appointments/:id/status`| `appointments` | Transitions status to `CHECKED_IN`; moves patient to Doctor Worklist. |
| **Doctor** | OPD Worklist View | `appointmentApi.getAppointments()` | `GET /api/v1/appointments?status=...` | `appointments`, `patients` | Displays live patient queue waiting outside doctor's consultation room. |
| **Doctor** | Save SOAP Consultation | `clinicalApi.createConsultation()` | `POST /api/v1/clinical/consultations` | `consultation_notes`, `prescriptions` | Creates immutable consultation record; pushes Rx to Pharmacy worklist. |
| **Doctor** | Order Diagnostic Lab Tests | `diagnosticsApi.orderLabTests()` | `POST /api/v1/diagnostics/lab/orders` | `lab_orders`, `lab_order_items` | Pushes specimen requisition to Laboratory Technician worklist. |
| **Nursing** | Bed Grid & Station Overview | `inpatientApi.getBeds()` | `GET /api/v1/inpatient/beds` | `wards`, `rooms`, `beds`, `admissions` | Renders live occupancy map; highlights occupied vs available beds. |
| **Nursing** | Administer Medication | `nursingApi.administerMedication()` | `POST /api/v1/nursing/medications/administer`| `medication_administrations` | Updates MAR; records nurse ID, dosage, timestamp, and patient vitals. |
| **Nursing** | Discharge Patient | `inpatientApi.dischargePatient()` | `POST /api/v1/inpatient/admissions/:id/discharge`| `admissions`, `beds` | Generates summary; transitions bed to `DIRTY/SANITATION` for cleaning. |
| **Pharmacy** | Prescription Dispensing Queue| `pharmacyApi.getMedicines()` | `GET /api/v1/pharmacy/medicines` | `medicines`, `medicine_batches` | Displays pending electronic prescriptions and available FEFO drug stock. |
| **Pharmacy** | Dispense Medicine Batch | `pharmacyApi.dispense()` | `POST /api/v1/pharmacy/dispense` | `medicine_batches`, `dispensations` | Atomically decrements batch stock; generates pharmacy billing line items. |
| **Laboratory** | Specimen Queue & Results | `diagnosticsApi.getLabCatalog()` | `GET /api/v1/diagnostics/lab/catalog` | `lab_tests`, `lab_order_items` | Evaluates bio-reference ranges; highlights abnormal values in red. |
| **Radiology** | Imaging Modality Worklist | `diagnosticsApi.getRadiologyOrders()` | `GET /api/v1/diagnostics/radiology/orders` | `radiology_orders` | Generates ephemeral signed DICOM viewer token for PACS review. |
| **Finance** | Inpatient Billing Folio | `billingApi.createInvoice()` | `POST /api/v1/billing/invoices` | `invoices`, `invoice_items` | Snapshots effective tariffs, room rent, and GST tax into immutable folio. |
| **Finance** | Settle Invoice Payment | `billingApi.collectPayment()` | `POST /api/v1/billing/payments` | `payments`, `invoices` | Deducts balance; records payment tender (Cash/Card/UPI) and prints receipt. |
| **HR & Staff** | Onboard Hospital Employee | `hospitalAdminApi.onboardStaff()` | `POST /api/v1/hospitals/staff` | `users`, `hospital_users` | Provisions staff account with department assignment and default role. |
| **Super Admin** | Platform SaaS Tenants View | `saasApi.getTenants()` | `GET /api/v1/saas/super-admin/tenants` | `tenants`, `hospitals`, `subscriptions` | Displays live active hospitals, bed usage quotas, and monthly recurring revenue. |
| **Super Admin** | Approve JIT Support Session | `saasApi.approveJitAccess()` | `POST /api/v1/saas/tenant/jit-access/:id/approve`| `jit_support_tickets` | Grants time-bound 60-min support token; logs approval to Merkle audit chain. |
| **Patient Mobile** | View Upcoming Appointments | `appointmentApi.getAppointments()` | `GET /api/v1/appointments` | `appointments`, `doctors` | Displays patient's real-time bookings across all linked hospital branches. |

