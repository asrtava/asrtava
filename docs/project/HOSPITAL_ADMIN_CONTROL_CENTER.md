# ASRTAVA — Hospital Admin Master Control Center & Complete Hospital Management System

## Executive Overview
The **ASRTAVA Hospital Admin Master Control Center** establishes a comprehensive, multi-tenant administrative command platform empowering Hospital Administrators to govern their entire hospital ecosystem without developer intervention. Built strictly on a **Dynamic-First Architecture**, every operational value, tariff rate, staff assignment, clinical quota, bed state, and audit event is backed by real PostgreSQL records scoped to the tenant context (`hospital_id`).

---

## 1. 19-Section Hospital Administration Architecture

The platform organizes hospital management across 19 administrative domains:

| # | Domain | Core Capabilities | API Endpoints |
|---|--------|-------------------|---------------|
| **1** | **Overview / Dashboard** | 14 live clinical, operational & financial KPIs, real-time telemetry refresh, quick navigation hub | `GET /api/v1/hospitals/admin-metrics` |
| **2** | **Staff Management** | Staff onboarding, auto-generated `EMP-XXXX`, role assignment, account activation, suspension, password reset, session revocation | `GET/POST /api/v1/hospitals/staff`, `PATCH /staff/:id/status`, `POST /staff/:id/reset-access`, `POST /staff/:id/revoke-sessions`, `PUT /staff/:id/roles` |
| **3** | **Roles & Permissions** | 9 System roles + custom hospital roles, action-level permissions (`view`, `create`, `edit`, `delete`, `approve`, `verify`, `dispense`, `export`, `manage`), explicit DENY override precedence, Super Admin escalation block | `GET /api/v1/permissions/catalog`, `GET/POST /api/v1/permissions/roles`, `POST /api/v1/permissions/user-overrides` |
| **4** | **Departments** | Clinical/surgical/diagnostic department creation, HOD assignment, doctor capacity, queue monitoring, activation toggle | `GET/POST /api/v1/hospitals/departments`, `PUT /api/v1/hospitals/departments/:id` |
| **5** | **Doctors** | Doctor onboarding, qualification, council registration, consultation & follow-up fees, weekly schedule, slot duration (15/30m), leave toggle | `GET/POST /api/v1/hospitals/doctors`, `PUT /api/v1/hospitals/doctors/:id` |
| **6** | **Patients** | Master Patient Index (MPI), duplicate screening, longitudinal record governance, ABHA M2 integration status | `GET /api/v1/patients`, `POST /patients` |
| **7** | **Appointments** | Consultation hours (08:00 - 20:00), default slot duration (15m), 30-day booking horizon, 2-hour cancellation deadline, double-booking prevention guard | `GET/POST /api/v1/appointments`, `POST /appointments/:id/reschedule` |
| **8** | **Wards & Beds** | Ward categories (General, ICU, Private, Emergency), room assignment, daily bed rates, live status transitions (`available`, `occupied`, `cleaning`, `maintenance`) | `GET/POST /api/v1/hospitals/wards`, `POST /rooms`, `POST /beds`, `PATCH /beds/:id/status` |
| **9** | **OPD & IPD** | Outpatient wait times, queue tracking, inpatient admission stays, daily physician rounds completion, discharge clearance | `GET /api/v1/inpatient/beds`, `POST /inpatient/admissions` |
| **10** | **Laboratory** | LIMS test catalogue (142 panels), specimen accessioning, panic value critical alerts, digital pathologist sign-off | `GET /api/v1/diagnostics/lab/catalog`, `POST /diagnostics/lab/orders` |
| **11** | **Radiology** | Modalities (128-Slice CT, 3T MRI, DR, USG), imaging queue, PACS DICOM server telemetry, radiation dose logging | `GET /api/v1/diagnostics/radiology/orders`, `POST /diagnostics/radiology/reports` |
| **12** | **Pharmacy** | Drug formulary (480 items), FEFO batch tracking, low-stock threshold alert (<= 50 units), 90-day expiry warning, dispensary billing | `GET /api/v1/pharmacy/medicines`, `POST /pharmacy/batches`, `POST /pharmacy/dispense` |
| **13** | **Billing & Finance** | Master service catalogue, procedure charges, bed tariffs, GST tax brackets (0% exempt healthcare vs 18% OT/consumables), discount approval limits | `GET/POST /api/v1/hospitals/billing-catalog`, `POST /billing/invoices`, `POST /billing/payments` |
| **14** | **Inventory** | Surgical supplies, PPE, biomedical equipment maintenance logs, vendor purchase orders, stock replenishment | `GET /api/v1/inventory/items`, `POST /inventory/purchase-orders` |
| **15** | **HR & Payroll** | Duty rosters, shift schedules (Morning 08:00-14:00, Evening 14:00-20:00, Night 20:00-08:00), on-call specialist cover, biometric attendance | `GET /api/v1/hospitals/staff` |
| **16** | **Reports & Analytics** | Executive BI dashboards, clinical statistics, bed occupancy trends, doctor productivity, revenue analytics | `GET /api/v1/reports/executive-overview` |
| **17** | **Notifications** | DLT SMS gateway (`APEXCR`), WhatsApp Business Cloud API, encrypted SMTP email, automated triggers & templating engine | `GET/PUT /api/v1/hospitals/notification-settings` |
| **18** | **Hospital Settings** | Hospital legal entity, registration number, emergency hotline (1066), physical address, timezone (`Asia/Kolkata`), currency (`INR`), prefixes (`INV-`, `PAT-`, `RX-`) | `GET /api/v1/hospitals/profile`, `PUT /api/v1/hospitals/settings` |
| **19** | **Audit Logs** | Cryptographically sealed, append-only administrative audit trail, tracking actor ID, action, entity type, diff payload, microsecond timestamp, IP address | `GET /api/v1/hospitals/audit-logs` |

---

## 2. Dynamic-First Security & Permission Precedence Matrix

The access control engine enforces a strict 4-tier permission hierarchy:
```
Tier 1: Explicit Individual DENY (is_granted = false)
   └── Immediate 403 Forbidden with PERMISSION_EXPLICIT_DENIED (Absolute Precedence)
Tier 2: Explicit Individual ALLOW (is_granted = true, non-expired)
   └── Immediate 200 OK override
Tier 3: Role-Based Access Control (RBAC)
   └── Evaluates active assigned roles (System + Custom) and role_permissions
Tier 4: Default Deny
   └── Immediate 403 Forbidden
```

### Self-Promotion & Boundary Protection
1. **No Super Admin Self-Promotion**: Any attempt by a Hospital Admin to assign `super_admin` to any user or create a role containing `super_admin` is rejected with `403 Forbidden`.
2. **Strict Multi-Tenant Isolation**: Every query is filtered by `hospital_id = req.hospitalId`. Attempts to query or mutate another hospital's resources return `404 Not Found` or `403 Forbidden`.
3. **Session Invalidation**: When a staff member is deactivated or suspended, all active session tokens and refresh tokens in `user_sessions` are terminated immediately.

---

## 3. Automated Verification Test Matrix (15 Scenarios)

The test suite in [`backend/tests/hospital_admin_control.test.ts`](file:///c:/Users/madha/Desktop/Medical_Project/backend/tests/hospital_admin_control.test.ts) confirms all 15 scenarios:

| Scenario | Objective | Status |
|----------|-----------|--------|
| **Scenario 1** | Real database calculation of metrics across patients, doctors, beds, pharmacy, invoices, and payments | **PASSED** |
| **Scenario 2** | Staff onboarding with automatic `EMP-XXXX` sequential code generation | **PASSED** |
| **Scenario 3** | Immediate login lockout and session revocation on staff deactivation | **PASSED** |
| **Scenario 4** | Custom hospital role creation with action permissions (`view`, `create`, `edit`, `approve`) | **PASSED** |
| **Scenario 5** | Individual Explicit DENY strictly overriding role-based ALLOW permissions | **PASSED** |
| **Scenario 6** | Rejection of Hospital Admin attempts to assign or create `super_admin` roles | **PASSED** |
| **Scenario 7** | Hospital profile, localization, working hours, and invoice numbering prefix persistence | **PASSED** |
| **Scenario 8** | Department creation & immediate dynamic availability in dropdowns and live queue | **PASSED** |
| **Scenario 9** | Doctor consultation fees, room assignment, slot duration, and weekly schedule updates | **PASSED** |
| **Scenario 10** | Bed creation & status transitions (`available` → `occupied` → `cleaning` → `maintenance`) | **PASSED** |
| **Scenario 11** | Master billing catalogue configuration with accurate GST tax calculation (0% vs 18%) | **PASSED** |
| **Scenario 12** | Notification preferences and dynamic variable templating (`{{patient_name}}`, `{{doctor_name}}`) | **PASSED** |
| **Scenario 13** | Immutable audit log generation on administrative changes with actor ID, entity diff & timestamp | **PASSED** |
| **Scenario 14** | Strict multi-tenant isolation preventing cross-hospital access or mutations | **PASSED** |
| **Scenario 15** | Cross-module dynamic cascade (onboarded doctor immediately bookable and billed) | **PASSED** |

---

## 4. Production Build & Bundle Metrics

- **Backend Test Suite**: **154/154 tests passing across 14 test suites (0 failures)**.
- **Frontend Web Portal Chunk Distribution**:
  - `dist/index.html`: 0.94 kB
  - `dist/assets/icons-C9FNeLvv.js`: 32.74 kB
  - `dist/assets/portal-super-admin-DvKXh6J3.js`: 54.80 kB
  - `dist/assets/deps-CZOqAYUY.js`: 63.26 kB
  - `dist/assets/vendor-ajYo4zyp.js`: 138.64 kB
  - `dist/assets/portal-hospital-admin-DJoiKz4z.js`: 168.49 kB
  - `dist/assets/index-I5jfzwXi.js`: 242.87 kB
  - **Maximum Chunk Size**: 242.87 kB (well under the strict 500 kB threshold).
- **Patient Mobile App**: `npx tsc --noEmit` exits with status `0` (clean compilation).

