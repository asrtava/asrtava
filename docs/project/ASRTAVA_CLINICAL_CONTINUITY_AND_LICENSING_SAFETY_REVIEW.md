# ASRTAVA Clinical Continuity & Licensing Safety Review

**Document Reference:** `docs/project/ASRTAVA_CLINICAL_CONTINUITY_AND_LICENSING_SAFETY_REVIEW.md`  
**Audit Date:** 2026-11-13  
**Review Type:** Mandatory Clinical Risk & Patient Safety Evaluation  
**Subject:** Commercial Software Licensing Enforcement vs. Uninterrupted Healthcare Delivery  
**Status:** **READY WITH DOCUMENTED CONDITIONS — P0 BLOCKER ITEMS OUTSTANDING**

---

## 1. Executive Summary & Core Architectural Principle

A critical patient-safety hazard in healthcare software occurs when commercial licensing mechanisms (e.g. license expiration, AMC lapse, entitlement mismatch, or billing disputes) blindly lock out clinical users from ongoing patient care. In a hospital, abruptly terminating clinical access during active resuscitation, surgery, medication administration, or specimen analysis can cause severe patient harm or fatality.

### The ASRTAVA Invariant: Zero Clinical Lockout
1. **Clinical Health Records are Inviolable:** Existing medical records, prescriptions, imaging scans, and laboratory observations are permanent medical documentation under statutory law (NMC RMP Regulations 2023). They are **never deleted, never corrupted, and never made inaccessible** to authorized treating clinicians due to commercial license status.
2. **Active Treatment Continuity is Protected:** Any patient with an active admission (`hasActiveEncounter = true`), emergency episode, or active prescription is guaranteed continuity of care.
3. **Strict Separation of Clinical Care vs. Commercial Transactions:** Commercial license restrictions apply strictly to **new commercial purchases, new license activations, tariff updates, and non-clinical administrative tooling**. Commercial restriction must **never block ongoing life-sustaining patient care**.

---

## 2. Boundaries of Historical Read-Only Clinical Access (No Security Bypass)

The principle that licensing restrictions cannot block historical read-only clinical access is **strictly a clinical safety protection against commercial lockouts**, not a bypass of application security or privacy controls.  
Under all conditions (including license lapse or suspension), historical record access remains **strictly constrained** by:
1. **Mandatory Authentication:** The user must present a valid, non-expired cryptographic JWT token signed by the platform. Anonymous or unauthenticated access is rejected immediately (`HTTP 401 Unauthorized`).
2. **Hospital & Tenant Boundary:** A clinician at Hospital Alpha has zero access to records belonging to Hospital Beta, regardless of license status. PostgreSQL Row-Level Security (`FORCE RLS`) strictly isolates tenant records.
3. **Role & Departmental Authorization:** The clinician must possess clinical permissions (`role:doctor`, `role:nurse`, etc.) associated with the patient care team or department. Non-clinical staff (e.g. billing clerks, IT technicians) gain zero clinical access.
4. **Explicit Individual DENY Precedence:** Individual DENY overrides configured by the Hospital Admin strictly override any role permission or continuity rule (`isDenied = true`).
5. **Statutory Retention & Purpose Limitation:** Clinical reads are strictly bound to direct patient care and statutory retention under the DPDP Act 2023 and NMC RMP 2023.
6. **Cryptographic Audit Logging:** Every read access event writes an immutable entry into `clinical_audit_events` recording user ID, patient ID, timestamp, and accessed fields.

---

## 3. Formal Investigation of the 14 Clinical Scenarios

| # | Scenario Description | Commercial Status | Clinical Risk | Safeguard Status & Implementation Detail | Resolution & Backlog Tracking |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | Patient admitted and undergoing treatment when license becomes invalid | License invalid / expired | Inpatient care aborted; vitals/eMAR unavailable | Foundational check in `LicenseService.checkModuleEntitlement` checks `hasActiveEncounter = true`. Requires middleware extraction. | **P0 Blocker (Item P0-01)** |
| **2** | Doctor needs to view existing medication order | Pharmacy unlicensed | Medication error; inability to verify therapy | **Protected:** Read-only access to existing records is permitted (`operation = 'read'`). Constrained by tenant & auth rules. | Verified Safe |
| **3** | Nurse needs to administer already prescribed medication | Pharmacy / Inpatient unlicensed | Missed life-sustaining dose (e.g. insulin, vasopressors) | Foundational logic supports encounter continuity. Specific eMAR route exception tag required. | **P0 Blocker (Item P0-03)** |
| **4** | Pharmacy staff need to dispense existing valid prescription | Pharmacy module lapsed | Delay in acute medication delivery | Inpatient eRx dispensing permitted under active encounter; retail walk-in cash sales blocked. | Item P1-04 |
| **5** | Laboratory has received specimens awaiting processing | LIS module unlicensed | Specimen degradation; delayed sepsis diagnosis | Specimen accessioning for ED/IPD patients must proceed without license block. | Item P1-04 |
| **6** | Critical laboratory result must be communicated to treating doctor | LIS / Comms unlicensed | Untreated panic value (e.g. Potassium > 6.5 mmol/L) leading to cardiac arrest | **Protected:** Critical panic broadcasts bypass quiet hours and commercial blocks unconditionally. | Verified Safe |
| **7** | Radiology report must be reviewed during ongoing treatment | RIS / PACS unlicensed | Missed intracranial bleed or pneumothorax | **Protected:** Read-only viewing of acquired PACS studies and finalized reports is permanently permitted. | Verified Safe |
| **8** | Patient already undergoing surgery | OT module unlicensed | Intraoperative monitoring failure; anaesthesia record loss | Foundational encounter check exists. Dedicated immutable session lock required. | **P0 Blocker (Item P0-02)** |
| **9** | Patient requires postoperative recovery and monitoring in PACU | OT / IPD unlicensed | Unmonitored respiratory depression post-extubation | **Protected:** Aldrete recovery tracking and ward transfer remain active under encounter continuity. | Verified Safe |
| **10** | Doctor needs to retrieve historical clinical records | License lapsed / dispute | Clinician blindness to previous allergies, surgeries | **Protected:** `operation = 'read'` or `isExistingRecord = true` grants read access, subject to auth & RBAC. | Verified Safe |
| **11** | Hospital temporarily disconnected from internet | Cloud verification down | Hospital shutdown during network outage | **Protected:** Offline air-gapped HMAC token verification runs locally with 0 cloud egress. | Verified Safe |
| **12** | On-prem / hybrid license validation service temporarily unavailable | Local service timeout | Total system paralysis | **Protected:** In-memory cached claims token retains active state with 72-hour grace period. | Verified Safe |
| **13** | Hospital has expired AMC but valid perpetual license | AMC lapsed | Unjustified software shutdown | **Protected:** Lapsed AMC locks version upgrades only; perpetual software usage continues indefinitely. | Verified Safe |
| **14** | License server unavailable during emergency | License check error | Refusal of emergency resuscitation | **Protected:** `module:emergency` is fail-safe; emergency override reason logs audit and proceeds. | Verified Safe |

---

## 4. Prioritized Clinical Safety Backlog Items (P0 Blockers)

Clinical continuity is categorized as **READY WITH CONDITIONS** because while the core service logic (`LicenseService.checkModuleEntitlement`) has been implemented and tested in `backend/tests/licensing_management.test.ts`, the three items below must be fully wired into route middleware and service state machines prior to live clinical pilot deployment:

### Item P0-01: Explicit Inpatient Encounter Context in Licensing Route Middleware
- **Priority:** **P0 (Blocker / Safety Critical)**
- **Affected Service:** `backend/src/middleware/licensing.middleware.ts`
- **Affected Endpoint:** All `/api/v1/nursing/*`, `/api/v1/ipd/*`, and `/api/v1/emr/*` mutation endpoints.
- **Clinical Risk:** If an incoming HTTP mutation request does not extract and validate `encounter_id`, default commercial entitlement enforcement could inadvertently reject active inpatient care during a license lapse.
- **Required Architecture:** Update middleware to inspect request headers, query params, and body for `encounter_id`. Validate active encounter status in PostgreSQL/cache, then pass `hasActiveEncounter: true` into `checkModuleEntitlement()`.
- **Status:** Open P0 Backlog Item awaiting implementation authorization.

### Item P0-02: Surgical Suite "SURGICAL_CONTINUITY_ACTIVE" Session Lock
- **Priority:** **P0 (Blocker / Safety Critical)**
- **Affected Service:** `backend/src/modules/ot/ot.service.ts` & `backend/src/modules/ot/ot.routes.ts`
- **Affected Endpoint:** `/api/v1/ot/surgeries/:id/checklist`, `/api/v1/ot/surgeries/:id/telemetry`
- **Clinical Risk:** An active surgery in progress cannot risk losing access to intraoperative documentation, narcotics ledgers, or WHO checklist phases due to an administrative licensing event.
- **Required Architecture:** When surgery transitions to `IN_PROGRESS`, set immutable session state `surgical_continuity_active = true`. This state is completely immunized against licensing changes until formal PACU discharge.
- **Boundary Restriction:** Surgical continuity applies strictly to the active surgical episode; it does **not** grant permanent commercial entitlement to the OT module.
- **Status:** Open P0 Backlog Item awaiting implementation authorization.

### Item P0-03: eMAR Medication Administration Fail-Safe Exception Tagging
- **Priority:** **P0 (Blocker / Safety Critical)**
- **Affected Service:** `backend/src/modules/nursing/nursing.service.ts` (`recordMedicationAdministration`)
- **Affected Endpoint:** `/api/v1/nursing/emar/administer`
- **Clinical Risk:** Inability to record administration of high-alert cardiac, narcotic, or ICU medications during an administrative commercial dispute.
- **Required Architecture:** Add an explicit `@ClinicalContinuity` decorator to `recordMedicationAdministration()`. Permit dual-nurse administration charting for any existing, verified prescription order regardless of commercial module entitlement.
- **Status:** Open P0 Backlog Item awaiting implementation authorization.
