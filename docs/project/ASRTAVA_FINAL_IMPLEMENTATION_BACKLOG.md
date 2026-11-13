# ASRTAVA Prioritized Final Implementation Backlog

**Document Reference:** `docs/project/ASRTAVA_FINAL_IMPLEMENTATION_BACKLOG.md`  
**Audit Date:** 2026-11-13  
**Status:** **PROPOSED BACKLOG ITEMS FOR FORMAL HUMAN REVIEW & APPROVAL**  
**Execution Boundary:** DO NOT IMPLEMENT CODE CHANGES DURING AUDIT; AWAIT EXPLICIT APPROVAL.

---

## 1. Backlog Prioritization Schema

- **P0 (Blocker / Safety Critical):** Direct patient safety risk, potential clinical lockout, or critical security vulnerability. Must be resolved prior to any live clinical pilot.
- **P1 (High Priority / Clinical Continuity):** Departmental workflow friction, external integration credentialing, or operational fail-safe hardening.
- **P2 (Medium Priority / Production Polish):** Performance optimizations, additional reporting formats, and user interface enhancements.
- **P3 (Low Priority / Innovation):** Advanced future capabilities (e.g. AI-assisted discharge summaries, regional Indian language localization packs).

---

## 2. Comprehensive Backlog Items

### Item BACKLOG-01: Explicit Inpatient Encounter Context in Licensing Route Middleware
- **Priority:** **P0 (Safety Critical)**
- **Affected Service:** `backend/src/middleware/licensing.middleware.ts` & `backend/src/modules/licensing/license.service.ts`
- **Affected Endpoint:** All `/api/v1/nursing/*`, `/api/v1/ipd/*`, and `/api/v1/emr/*` mutation endpoints.
- **Clinical Risk:** If an HTTP request does not explicitly pass `encounter_id` in headers or URL parameters, the middleware falls back to standard commercial entitlement checking, creating a risk that active inpatient nursing care could be blocked during an administrative license lapse.
- **Security Risk:** Bypassing license checks without authenticating the encounter context could allow unauthorized module access.
- **Recommended Design:**
  1. Update `licensing.middleware.ts` to inspect `req.params.encounterId`, `req.body.encounter_id`, or `req.headers['x-encounter-id']`.
  2. If present, query the database or cache to verify the encounter is in `ADMITTED` or `ACTIVE` state.
  3. If active, automatically supply `hasActiveEncounter: true` into `LicenseService.checkModuleEntitlement()`, granting unconditional clinical continuity.
- **Acceptance Criteria:** Any inpatient mutation request with a valid active encounter succeeds with HTTP 200/201 even when the hospital's commercial license is marked `suspended` or `lapsed`.
- **Required Automated Tests:** New integration test in `backend/tests/licensing_management.test.ts` asserting that an active inpatient encounter can chart vitals and eMAR while general OPD is blocked.
- **Human Approval Required:** Chief Medical Informatics Officer (CMIO) & Lead Architect.

---

### Item BACKLOG-02: Surgical Suite "SURGICAL_CONTINUITY_ACTIVE" Session Lock
- **Priority:** **P0 (Safety Critical)**
- **Affected Service:** `backend/src/modules/ot/ot.service.ts` & `backend/src/modules/ot/ot.routes.ts`
- **Affected Endpoint:** `/api/v1/ot/surgeries/:id/checklist`, `/api/v1/ot/surgeries/:id/telemetry`
- **Clinical Risk:** Any administrative interruption, license check, or network timeout during an open surgical procedure could compromise hemodynamic monitoring or surgical count reconciliation.
- **Security Risk:** Unrestricted surgical bypass must not grant administrative or billing privileges.
- **Recommended Design:**
  1. When a surgical case transitions to `IN_PROGRESS`, set an immutable flag `surgical_continuity_active = true`.
  2. All intraoperative telemetry, narcotic charting, WHO checklist sign-outs, and PACU transfers are immunized against all licensing and administrative restrictions.
  3. Flag automatically clears only upon formal PACU discharge and ward transfer sign-off.
- **Acceptance Criteria:** Active surgical cases cannot be blocked, paused, or suspended by any platform administrator or licensing event until post-operative Aldrete release.
- **Required Automated Tests:** Test case simulating license revocation mid-surgery asserting intraoperative charting succeeds without error.
- **Human Approval Required:** Head of Surgery & Lead Anaesthesiologist.

---

### Item BACKLOG-03: eMAR Medication Administration Fail-Safe Exception Tagging
- **Priority:** **P0 (Safety Critical)**
- **Affected Service:** `backend/src/modules/nursing/nursing.service.ts` (`recordMedicationAdministration`)
- **Affected Endpoint:** `/api/v1/nursing/emar/administer`
- **Clinical Risk:** Failure to chart scheduled medication doses (e.g. antibiotics, anticoagulants, antiarrhythmics) due to an entitlement failure, resulting in missed doses or fatal double dosing.
- **Security Risk:** Must require valid clinician credentials and dual-nurse cosign for high-alert drugs.
- **Recommended Design:**
  1. Add an explicit `@ClinicalContinuity` decorator to `recordMedicationAdministration()`.
  2. Permit dual-nurse administration charting for any existing, verified prescription order regardless of commercial module entitlement.
- **Acceptance Criteria:** Dual-nurse cosigned eMAR charting requests return HTTP 200 under all licensing conditions.
- **Required Automated Tests:** Unit test asserting eMAR charting executes with status `ALLOWED_CLINICAL_CONTINUITY`.
- **Human Approval Required:** Director of Nursing & Clinical Pharmacology Lead.

---

### Item BACKLOG-04: Laboratory Specimen Accessioning for Admitted Patients
- **Priority:** **P1 (High Clinical Impact)**
- **Affected Service:** `backend/src/modules/laboratory/laboratory.service.ts`
- **Affected Endpoint:** `/api/v1/laboratory/specimens/accession`, `/api/v1/laboratory/results`
- **Clinical Risk:** Pre-drawn patient blood and tissue specimens coagulate or degrade if LIS rejects accessioning due to commercial dispute, requiring painful re-bleeding of critical patients.
- **Security Risk:** Commercial OPD test catalog ordering must remain blocked if LIS is unlicensed.
- **Recommended Design:** Distinguish inpatient/ED laboratory orders from routine walk-in OPD orders. Inpatient/ED specimen orders are granted automatic processing entitlement under clinical continuity.
- **Acceptance Criteria:** Pre-existing lab orders transition through accessioning, analyzer run, and results verification without licensing interruption.
- **Required Automated Tests:** Test case confirming accessioning and result entry for an admitted patient while walk-in lab booking is rejected.
- **Human Approval Required:** Laboratory Director & Chief Pathologist.

---

### Item BACKLOG-05: Live ABDM Sandbox Empanelment & Production Credential Provisioning
- **Priority:** **P1 (Regulatory & Ecosystem Integration)**
- **Affected Service:** `backend/src/modules/integrations/abdm.service.ts`
- **Affected Endpoint:** `/api/v1/abdm/v3/*`
- **Clinical Risk:** Inability to link ABHA ID or exchange longitudinal health records via ABDM Unified Health Interface (UHI).
- **Security Risk:** ABDM client secrets and private keys must be stored in AWS Secrets Manager or HashiCorp Vault.
- **Recommended Design:**
  1. Submit ASRTAVA software verification artifacts to the National Health Authority (NHA) Sandbox.
  2. Complete M1 (ABHA Creation), M2 (HIP Record Push), and M3 (HIU Record Pull) compliance test cases.
  3. Obtain official Bridge ID and Client Credentials; inject into production environment variables.
- **Acceptance Criteria:** Live ABHA verification and consent-based health record sharing verified against official NHA endpoints.
- **Required Automated Tests:** Integration test against live NHA Sandbox gateway.
- **Human Approval Required:** Hospital Owner & Platform Security Lead.

---

### Item BACKLOG-06: Production SMS DLT Headers & Meta WhatsApp Business Cloud API Activation
- **Priority:** **P1 (Patient Communication & OTP Delivery)**
- **Affected Service:** `backend/src/modules/notifications/sms.service.ts` & `whatsapp.service.ts`
- **Affected Endpoint:** `/api/v1/notifications/dispatch`
- **Clinical Risk:** Delayed delivery of critical appointment reminders, patient portal login OTPs, and prescription links.
- **Security Risk:** Compliance with Telecom Regulatory Authority of India (TRAI) DLT mandate to prevent phishing and spam.
- **Recommended Design:**
  1. Register ASRTAVA Principal Entity ID (`DLT_PE_ID`) on telecom DLT portal (e.g. Jio, Airtel, or Vilpower).
  2. Register transactional SMS templates and map assigned Template IDs (`DLT_TE_ID`).
  3. Configure Meta WhatsApp Cloud API credentials (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`).
- **Acceptance Criteria:** Test SMS and WhatsApp messages delivered to verified test phone numbers with valid headers.
- **Required Automated Tests:** Live provider ping tests with sandbox credentials.
- **Human Approval Required:** Platform Operations Manager.

---

### Item BACKLOG-07: WebRTC TURN Server Cluster Provisioning for Enterprise NAT Traversal
- **Priority:** **P1 (Telehealth Network Reliability)**
- **Affected Service:** `backend/src/modules/telemedicine/webrtc.service.ts`
- **Affected Endpoint:** `/api/v1/telemedicine/sessions/:id/ice-servers`
- **Clinical Risk:** Video and audio consultation dropped or failing to connect when patient or clinician is behind symmetric hospital firewall.
- **Security Risk:** TURN authentication credentials must use ephemeral, time-limited HMAC tokens.
- **Recommended Design:**
  1. Deploy high-availability coturn server cluster on AWS EC2 or on-premises DMZ with public IP addresses.
  2. Configure REST API ephemeral credential generation (`turn:turn.asrtava.com:3478`).
- **Acceptance Criteria:** Peer-to-peer video streams reliably establish connections across restrictive 4G/5G mobile carriers and enterprise hospital subnets.
- **Required Automated Tests:** Automated WebRTC media loopback test across simulated symmetric NAT.
- **Human Approval Required:** Network Engineering Lead.

---

### Item BACKLOG-08: Multi-Lingual Indian Regional Language Packs (i18n)
- **Priority:** **P2 (Operational Usability & Patient Engagement)**
- **Affected Service:** `apps/web-portal/src/` & `apps/patient-mobile/`
- **Affected Endpoint:** Patient Portal & Mobile Client UI
- **Clinical Risk:** Patient misunderstanding of medication instructions or discharge summaries due to language barrier.
- **Security Risk:** Zero security impact.
- **Recommended Design:** Integrate `react-i18next` with structured localization dictionaries for Hindi, Kannada, Tamil, Telugu, and Marathi.
- **Acceptance Criteria:** Patient can toggle language in Patient Portal; prescriptions render dual-language drug dosage instructions.
- **Required Automated Tests:** Visual regression tests for multi-language string rendering.
- **Human Approval Required:** Chief Medical Officer & Patient Experience Director.

