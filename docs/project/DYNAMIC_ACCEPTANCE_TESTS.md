# ASRTAVA Dynamic Acceptance Tests & Verification Specifications

**Document Reference:** `docs/project/DYNAMIC_ACCEPTANCE_TESTS.md`  
**Execution Authority:** ASRTAVA QA Lead & Senior Verification Engineer  
**Standard:** 15 Mandatory Dynamic Scenarios (Section 18 of Master Prompt)

---

## 1. Dynamic Acceptance Test Matrix

Every test scenario verifies that data is dynamically retrieved, mutated, and reflected across dependent workflows and database tables without reliance on static arrays or hardcoded mock constants:

```
+-------------------------------------------------------------------------------------------------------+
|  #   | Test Scenario Name                   | Action & Trigger             | Verification Invariant   |
+------+--------------------------------------+------------------------------+--------------------------+
| TC01 | Dynamic Department Propagation       | Admin creates department     | Appears in doctor dropdown|
| TC02 | Dynamic Doctor & Booking Discovery   | Admin onboards doctor        | Appears in appointment UI|
| TC03 | Dynamic Doctor Availability Shift    | Doctor updates schedule      | Booking slots recompute  |
| TC04 | Dynamic Tariff Update & Snapshot     | Admin changes service price  | New bills use new tariff |
| TC05 | Dynamic Patient Registration Count   | Reception registers patient  | Dashboard counts increment|
| TC06 | Dynamic FEFO Pharmacy Inventory      | Pharmacist dispenses batch   | Stock decrements atomically|
| TC07 | Dynamic Diagnostic Order Propagation | Doctor orders lab test       | Appears in Lab Worklist  |
| TC08 | Dynamic Role & Permission Assignment | Admin changes staff role     | Permissions take effect  |
| TC09 | Dynamic Hospital Operational Setting | Admin changes slot duration  | Calendar slots adapt     |
| TC10 | Dynamic Database-Derived Dashboard   | Query dashboard metrics      | Matches SQL aggregates   |
| TC11 | Dynamic Filtered Clinical Report     | Generate report with filters | Returns exact match rows |
| TC12 | Dynamic Multi-Tenant Isolation       | Hospital A queries Hospital B| Returns HTTP 403 / empty |
| TC13 | Zero Fake Data on API Failure        | Simulate 500 error           | Shows error, zero mock   |
| TC14 | Real Form Mutation Synchronization   | Submit create form           | Requires backend HTTP 201|
| TC15 | Dynamic Merkle Audit Log Append      | Mutate any record            | Appends SHA-256 block    |
+-------------------------------------------------------------------------------------------------------+
```

---

## 2. Detailed Step-by-Step Acceptance Specifications

### TC01: Dynamic Department Propagation
- **Action**: Hospital Administrator executes `POST /api/v1/hospitals/departments` with `{ name: "Pediatric Cardiology", code: "PEDCARD" }`.
- **Expected Result**: Department is inserted into `departments` table in PostgreSQL. Subsequent calls to `GET /api/v1/hospitals/departments` include `"Pediatric Cardiology"`, and doctor onboarding dropdown immediately displays it as an available department.

### TC02: Dynamic Doctor Onboarding & Discovery
- **Action**: Hospital Administrator registers Dr. Sunita Rao in Pediatric Cardiology via `POST /api/v1/hospitals/staff`.
- **Expected Result**: Doctor appears immediately in Reception appointment scheduling, Patient Web Portal, and Patient Mobile Doctor Discovery screen.

### TC03: Dynamic Doctor Availability Slots
- **Action**: Doctor changes consultation hours from `09:00 - 13:00` to `14:00 - 18:00`.
- **Expected Result**: Slot generation engine dynamically renders 14:00+ slots; morning slots are removed from booking calendar.

### TC04: Dynamic Pricing & Historical Price Snapshot
- **Action**: Hospital Admin updates General Consultation fee in `billing_tariffs` from ₹500 to ₹750.
- **Expected Result**: All future consultations generate invoices with ₹750 line items. Invoices generated yesterday remain locked at ₹500 (zero silent price drift).

### TC05: Dynamic Patient Registration & Dashboard Metrics
- **Action**: Receptionist registers new patient via `POST /api/v1/patients`.
- **Expected Result**: Patient is assigned unique UHID; `Total Registered Patients` counter on Hospital Admin Dashboard and Reception Dashboard increments by exactly +1.

### TC06: Dynamic FEFO Inventory Dispensation
- **Action**: Pharmacist dispenses 10 tablets of Atorvastatin 20mg.
- **Expected Result**: System automatically deducts units from batch with earliest expiry date (`medicine_batches.quantity_on_hand` decremented). Zero negative stock permitted.

### TC07: Dynamic Diagnostic Lab Worklist
- **Action**: Doctor orders Lipid Profile and Cardiac Troponin I during patient consultation.
- **Expected Result**: Specimen accession records appear in real-time in the Laboratory Technician dashboard with `PENDING_SAMPLE_COLLECTION` status.

### TC08: Dynamic Role & Immediate Permission Enforcement
- **Action**: Admin revokes `billing:refund` from a cashier account.
- **Expected Result**: The cashier's next request to issue a refund returns HTTP `403 Forbidden` immediately, without requiring session re-login or server reboot.

### TC09: Dynamic Hospital Setting Propagation
- **Action**: Admin updates `appointment_slot_duration` from 15 minutes to 30 minutes in `hospital_settings`.
- **Expected Result**: Appointment booking calendar dynamically renders 30-minute intervals across web and mobile apps.

### TC10: Real Database-Derived Dashboard Statistics
- **Action**: Fetch Hospital Admin Dashboard metrics.
- **Expected Result**: Displayed values (Occupied Beds, Active Patients, Revenue) correspond exactly to `SELECT COUNT(*)` and `SELECT SUM(amount)` queries against PostgreSQL, with zero fabricated or static mock numbers.

### TC11: Dynamic Filtered Clinical & Financial Reports
- **Action**: Financial auditor filters revenue report for `department = 'Cardiology'` and `date_range = 'last_30_days'`.
- **Expected Result**: Generated CSV export and chart display only Cardiology transactions within the specified date boundary.

### TC12: Multi-Tenant Zero-Bleed Isolation
- **Action**: Hospital Alpha administrator attempts to fetch patients belonging to Hospital Beta.
- **Expected Result**: PostgreSQL RLS and API tenant middleware block query; returns empty array or HTTP `403 Forbidden`.

### TC13: Zero Fake Data on API Failure
- **Action**: Simulate network disconnection or server 500 error while loading patient list.
- **Expected Result**: UI renders dedicated error retry banner ("Failed to communicate with server"); UI **NEVER** falls back to hardcoded mock records.

### TC14: Strict Form Synchronization
- **Action**: User submits patient registration form.
- **Expected Result**: Success toast notification is displayed **ONLY AFTER** backend returns HTTP `201 Created` with valid database UUID. If backend returns an error, form displays error message and preserves user input.

### TC15: Dynamic Cryptographic Audit Non-Repudiation
- **Action**: Any user creates, updates, or deletes a business record.
- **Expected Result**: Mutation appends to `audit_events_immutable` with SHA-256 cryptographic linkage to the previous audit block.

