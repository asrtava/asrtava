# ASRTAVA — Role Permission Matrix & Negative Security Boundary Specifications

## 1. Architectural Overview & Policy Enforcement Model

The ASRTAVA platform enforces a **Zero-Trust Multi-Tenant Role-Based and Attribute-Based Access Control (RBAC/ABAC)** model with dynamic negative authorization overrides.

### Core Tenets of the Permission Engine
1. **Explicit Individual DENY Overrides Role ALLOW**:
   - Even if a role (e.g., `doctor`, `hospital_admin`, `nurse`) possesses an permission (e.g., `clinical:prescription:sign`, `billing:refund`), any explicit deny entry attached to the user's record (`deniedPermissions: string[]`) immediately terminates authorization and returns `HTTP 403 Forbidden` (`PERMISSION_EXPLICIT_DENIED`).
2. **Platform Super Admin Zero Standing Clinical Access**:
   - Super Admins manage platform tenants, subscriptions, billing, and system infrastructure. They have **zero standing permission** to query, read, or export Protected Health Information (PHI) or clinical data. Access to clinical endpoints requires an active, time-bound, cryptographically signed Just-In-Time (JIT) access authorization token.
3. **Strict Departmental Confidentiality Barriers**:
   - **Reception & Front Office**: Strict administrative boundary. Granted appointment scheduling, patient registration, and OPD token generation. Explicitly forbidden (`clinical:all`) from viewing doctor SOAP notes, clinical diagnoses, medical summaries, and detailed prescription regimens.
   - **Finance & Billing**: Strict administrative boundary. Granted invoice generation, payment processing, insurance TPA claims, and supervisor-authorized refunds. Explicitly forbidden (`clinical:all`) from clinical records and notes.
4. **Tenant Isolation (`hospital_id`)**:
   - All role permissions are evaluated within the boundary of the user's cryptographically verified `hospital_id`. Cross-tenant requests are denied at the gateway before RBAC evaluation (`CROSS_TENANT_FORBIDDEN`).

---

## 2. Comprehensive Role-to-Permission Matrix

| # | Role Key | Role Name | Allowed System Permissions | Explicitly Forbidden Operations / Negative Boundaries | Primary Operational Portal |
|---|----------|-----------|----------------------------|-------------------------------------------------------|----------------------------|
| 1 | `super_admin` | Platform Super Admin | `saas:tenant:manage`, `saas:billing:manage`, `saas:audit:view`, `saas:system:monitor` | `clinical:*` (zero standing access to patient charts, notes, labs, imaging, prescriptions without JIT token) | Super Admin Portal (`/super-admin`) |
| 2 | `hospital_admin` | Hospital Administrator | `admin:dashboard:view`, `admin:departments:manage`, `admin:doctors:manage`, `admin:staff:manage`, `admin:wards:manage`, `admin:pricing:manage`, `admin:shifts:manage`, `admin:audit:view`, `admin:settings:manage` | Patient medical treatment modification, signing clinical prescriptions, dispensing medications | Hospital Admin Portal (`/hospital-admin`) |
| 3 | `doctor` | Medical Doctor / Consultant | `doctor:opd:queue`, `doctor:consultation:conduct`, `clinical:soap:write`, `clinical:diagnosis:icd10`, `clinical:prescription:sign`, `clinical:lab:order`, `clinical:radiology:order`, `clinical:ipd:rounds` | Financial billing overrides, direct pharmacy inventory decrement, hospital settings modification | Doctor Portal (`/doctor`) |
| 4 | `nurse` | Staff Nurse / Charge Nurse | `nurse:station:view`, `nurse:vitals:record`, `nurse:emar:administer`, `nurse:careplan:manage`, `nurse:fluid:record`, `nurse:handover:sbar`, `nurse:orders:execute` | Independent prescription generation, ICD-10 diagnostic sign-off, financial fee waivers | Nursing Portal (`/nursing`) |
| 5 | `receptionist` | Reception & Registration Clerk | `reception:queue:view`, `patient:register`, `patient:search`, `appointment:schedule`, `appointment:reschedule`, `appointment:cancel`, `billing:opd:collect` | `clinical:*` (SOAP notes, diagnostic reports, clinical summaries, prescriptions) | Reception Portal (`/reception`) |
| 6 | `lab_technician` | Laboratory Technician / Pathologist | `lab:orders:view`, `lab:specimen:accession`, `lab:specimen:reject`, `lab:results:enter`, `lab:results:verify`, `lab:panic:broadcast` | Prescribing treatments, patient direct billing alteration, unauthorized medical diagnosis outside lab | Laboratory Portal (`/laboratory`) |
| 7 | `radiologist` | Radiologist / Radiographer | `radiology:queue:view`, `radiology:order:assign`, `radiology:dicom:view`, `radiology:report:draft`, `radiology:report:verify`, `radiology:alert:critical` | Prescribing pharmaceutical drugs, changing inpatient bed allocations, financial accounting | Radiology Portal (`/radiology`) |
| 8 | `pharmacist` | Pharmacist / Dispensary Manager | `pharmacy:rx:view`, `pharmacy:dispense:fefo`, `pharmacy:substitute:generic`, `pharmacy:pos:sale`, `pharmacy:requisition:create`, `pharmacy:stock:view` | Creating new clinical prescriptions, diagnosing patients, modifying hospital ward tariffs | Pharmacy Portal (`/pharmacy`) |
| 9 | `accountant` | Finance Officer / Billing Manager | `finance:invoices:view`, `finance:payments:collect`, `finance:refunds:process`, `finance:tpa:claims`, `finance:reports:view` | `clinical:*` (clinical notes, diagnostic history, medical regimens), modifying doctor prescriptions | Finance & Accounts Portal (`/finance`) |
| 10 | `hr_manager` | HR & Roster Manager | `hr:staff:view`, `hr:staff:onboard`, `hr:roster:manage`, `hr:roster:reassign`, `hr:leave:approve`, `hr:leave:reject`, `hr:performance:view` | `clinical:*` (all patient medical records), financial general ledger modification | HR & Staff Portal (`/hr`) |
| 11 | `inventory_manager` | Inventory & Procurement Officer | `inventory:catalog:view`, `inventory:stock:view`, `inventory:po:create`, `inventory:grn:process`, `inventory:transfer:ward`, `inventory:audit:conduct` | Clinical documentation, patient records, financial revenue adjustments | Inventory Portal (`/inventory`) |
| 12 | `patient` | Registered Patient | `patient:portal:view`, `patient:records:own`, `patient:prescriptions:own`, `patient:appointments:own`, `patient:bills:pay` | Cross-patient record inspection, access to other patients' bills or prescriptions, administrative portals | Patient Web Portal & Mobile App (`/patient`) |
| 13 | `system` | Automated Background Daemons | `system:cron:execute`, `system:telemetry:write`, `system:backup:execute` | Interactive user login, clinical decision authoring | Background Microservices |

---

## 3. Explicit Negative Boundary & Permission Precedence Rules

### Rule 1: Individual DENY Precedence
```typescript
if (user.deniedPermissions && user.deniedPermissions.includes(requiredPermission)) {
  return { allowed: false, reason: "PERMISSION_EXPLICIT_DENIED" };
}
```
- When an individual user has a permission revoked (e.g. `clinical:prescription:sign` removed from a suspended resident doctor), this negative constraint takes precedence over the user's role assignment.

### Rule 2: Clinical Confidentiality Firewall
```typescript
if (user.role === 'receptionist' || user.role === 'accountant' || user.role === 'hr_manager') {
  if (requestedResource.category === 'clinical_notes' || requestedResource.category === 'prescriptions') {
    return { allowed: false, reason: "CLINICAL_CONFIDENTIALITY_VIOLATION" };
  }
}
```
- Non-clinical staff cannot view patient clinical narratives, diagnostic impressions, or medication schedules.
- Front-desk clerks receive only operational tokens: Patient Name, UHID, Doctor Name, Appointment Slot, Room Number, Fee Amount.

### Rule 3: Cross-Tenant Boundary
```typescript
if (user.hospital_id !== requestedResource.hospital_id && user.role !== 'super_admin') {
  return { allowed: false, reason: "CROSS_TENANT_VIOLATION" };
}
```
- Even with identical roles across hospitals (e.g. Doctor in Hospital A accessing Patient in Hospital B), access is rejected at the API gateway layer.

### Rule 4: Supervisor Authorization for Financial Reversals
```typescript
if (requestedAction === 'finance:refund:execute') {
  if (amount > threshold && !request.supervisorPinVerified) {
    return { allowed: false, reason: "SUPERVISOR_AUTHORIZATION_REQUIRED" };
  }
}
```
- Refunds and credit notes require dual-control verification with a supervisor PIN and an immutable audit reason.
