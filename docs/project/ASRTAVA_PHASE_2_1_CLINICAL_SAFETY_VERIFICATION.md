# ASRTAVA Phase 2.1: Clinical Safety & Durable Persistence Verification Report

**Document Reference:** `docs/project/ASRTAVA_PHASE_2_1_CLINICAL_SAFETY_VERIFICATION.md`  
**Audit Phase:** Phase 2.1 — Critical Operational Safety Verification  
**Audit Date:** 2026-11-13  
**Status:** **AUDIT VERIFICATION COMPLETE — CRITICAL GAPS IDENTIFIED — P0 ACTIONS REQUIRED**

---

## 1. Executive Summary & Critical Discovery: Durable Clinical Persistence

A foundational audit of all critical clinical write paths was conducted across the backend codebase (`backend/src/modules/`). The investigation revealed a vital architectural distinction between the foundational core modules and the advanced departmental modules:

### 1.1 The Two Persistence Architectures in Current Codebase

| Subsystem Group | Specific Modules | Code Implementation Location | Underlying Persistence Mechanism | Persistence Classification | Resilience Under Process Crash / Restart |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Foundational Clinical Core** | Patients, Appointments, Consultations (SOAP), IPD Admissions, Billing | `backend/src/modules/clinical/clinical.routes.ts`, `patients.routes.ts`, `inpatient.routes.ts` | Knex PostgreSQL ACID transactions (`db.transaction(async trx => ...)`). | **DURABLE & RECOVERABLE** | **Safe:** Committed to PostgreSQL write-ahead log (WAL) on disk. Data survives crashes. |
| **Advanced Departmental Modules** | Nursing eMAR, LIS Pathology, RIS/PACS, OT Surgery, Emergency ED, Advanced Pharmacy | `backend/src/modules/nursing/nursing-advanced.service.ts`, `lis-advanced.service.ts`, `ot-advanced.service.ts`, `emergency-advanced.service.ts` | In-memory `Map` data structures (e.g. `private emarRecords = new Map()`, `private whoChecklists = new Map()`). | **VOLATILE & POTENTIALLY LOSSY (UNSAFE FOR PRODUCTION)** | **CRITICAL RISK:** Total data loss upon process crash, container recreation, OOM kill, or host reboot. |

### 1.2 Evaluation of the "In-Memory Fallback" Claim
- **Audit Finding:** The previous claim that "in-memory fallback buffers critical operations" is **technically unsafe for live clinical healthcare**.
- In the advanced modules, the SQL migration schemas (`024` through `035`) created the physical tables in PostgreSQL with Row-Level Security, but the corresponding TypeScript service classes are storing active state in JavaScript `Map` instances in memory rather than executing SQL `INSERT`/`UPDATE` statements via Knex.
- **Safety Directive:** In healthcare software, an in-memory buffer must **never** be treated as durable clinical storage. An uncommitted medication administration or trauma intake chart can disappear completely if the container restarts.
- **Corrective Action Required (Pre-Pilot P0 Requirement):** All advanced clinical service classes must be refactored to execute durable Knex database queries against their respective PostgreSQL tables (`024_` through `035_`), with strict ACID transaction guarantees, before any real patient care occurs.

---

## 2. Status of the Three Active Clinical Safety P0 Items

The three items identified during previous review remain active, unverified blockers at the service/middleware integration layer:

### Item P0-01: Explicit Inpatient Encounter Context in Licensing Route Middleware
- **Service:** `backend/src/middleware/licensing.middleware.ts` & `backend/src/modules/licensing/license.service.ts`
- **Current Status:** **PARTIALLY IMPLEMENTED (HELPER EXISTS, MIDDLEWARE EXTRACTOR MISSING)**
- **Evidence:** `LicenseService.checkModuleEntitlement()` in commit `273f2b3` accepts `ClinicalContinuityContext` with `hasActiveEncounter: true`. However, the Express route middleware (`licensing.middleware.ts`) does not currently parse `req.params.encounterId` or query active admission status to automatically inject this context on incoming HTTP requests.
- **Clinical Risk:** An active inpatient vitals charting or nursing request could be denied if the hospital license status is administratively marked `suspended` or `lapsed`.
- **Classification:** **P0 Blocker (Must be implemented and tested prior to pilot).**

### Item P0-02: Surgical Suite "SURGICAL_CONTINUITY_ACTIVE" Session Lock
- **Service:** `backend/src/modules/ot/ot-advanced.service.ts`
- **Current Status:** **NOT IMPLEMENTED IN DURABLE STATE**
- **Evidence:** Surgical checklists and anaesthesia records in `ot-advanced.service.ts` are stored in in-memory Maps (`private whoChecklists = new Map()`). There is no dedicated immutable session state machine locking active operations against external administrative disruption.
- **Clinical Risk:** If an administrative license change occurs during an open surgery, or if the server restarts mid-operation, surgical count reconciliation and hemodynamic telemetry records are lost.
- **Required Architecture:** When surgery enters `IN_PROGRESS`, an immutable flag `surgical_continuity_active = true` must be durably written to PostgreSQL, immunizing the procedure until post-operative PACU discharge.
- **Classification:** **P0 Blocker (Safety Critical).**

### Item P0-03: eMAR Medication Administration Fail-Safe Exception Tagging
- **Service:** `backend/src/modules/nursing/nursing-advanced.service.ts` (`recordMedicationAdministration`)
- **Current Status:** **NOT IMPLEMENTED IN DURABLE STATE**
- **Evidence:** The eMAR administration method in `nursing-advanced.service.ts` charts into `this.emarRecords = new Map()`. There is no fail-safe decorator or fallback route allowing dual-nurse administration of existing valid prescriptions during a commercial license lockout.
- **Clinical Risk:** Inability to chart administered high-alert drugs (insulin, heparin, vasopressors) leading to lethal missed doses or accidental double dosing.
- **Classification:** **P0 Blocker (Safety Critical).**

---

## 3. Historical Clinical Record Read-Only Access Boundaries

The safety rule guaranteeing permanent read-only access to historical records after commercial license expiration is **strictly a safeguard against commercial extortion and clinician blindness**, not a general bypass of security controls.  
Under all conditions, access is verified to be constrained by:
1. **Mandatory Authentication:** Requires valid JWT issued with portal audience (`aud`).
2. **Hospital & Tenant Scope:** PostgreSQL Row-Level Security (`FORCE RLS`) strictly segregates tenant records. Hospital Alpha clinicians cannot view Hospital Beta records.
3. **Clinical Role Authorization:** Access requires clinical role binding (`role:doctor`, `role:nurse`). Administrative and billing users have zero clinical read access.
4. **Explicit Individual DENY Precedence:** Individual DENY permissions strictly override any role permission or continuity rule.
5. **Statutory Retention Boundaries:** DPDP Act 2023 purpose limitation rules apply.
6. **Cryptographic Audit Trail:** Every clinical read event generates a log entry in `clinical_audit_events`.

---

## 4. Emergency Clinical Override Controls

Under emergency triage conditions, the system supports emergency clinical overrides (`clinicalOverrideReason`):
- **Purpose Limitation:** Restricted exclusively to life-threatening resuscitation, trauma intake, and STAT blood/medication orders.
- **Time Limitation:** Overrides are valid for the active emergency episode only (maximum 4 hours).
- **Audit Accountability:** Overrides capture the clinician ID, timestamp, patient ID, and mandatory written justification, immediately logging to `clinical_audit_events` with alert escalation to the Medical Superintendent.

