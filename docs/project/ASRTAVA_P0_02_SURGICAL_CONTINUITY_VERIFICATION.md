# ASRTAVA P0-02 — Intraoperative Surgical Continuity State Management & Verification

**Document Version:** 1.0.0  
**Status:** Implemented & Verified Passing  
**Standard:** WHO Surgical Safety Guidelines, NABH Hospital Accreditation, ISO 27799  
**Feature Branch:** `feature/phase-2-2-p0-clinical-safety`  
**Target File:** `backend/src/modules/ot/surgical-continuity.service.ts`

---

## 1. Objective & Clinical Safety Rationale

Intraoperative surgical procedures represent an acute, life-critical environment. Under no circumstances may a software licensing event (such as license key expiration, AMC lapse, or periodic validation service downtime) lock out, interrupt, or degrade a surgeon's or anaesthetist's ability to record intraoperative vitals, administer emergency medications, document surgical counts, or manage PACU recovery.

At the same time, this safety guarantee must not create an indefinite, permanent lock that bypasses commercial licensing after the patient has safely left the surgical suite.

**P0-02 Remedy:** Implemented `SurgicalContinuityService` with a rigorous 9-state finite state machine (FSM), server-side state enforcement, timeout windows, dual-attestation handovers, and supervised stale session recovery.

---

## 2. Surgical Continuity Finite State Machine (FSM)

```
+-----------------------------------------------------------------------------------------+
|                    SURGICAL CONTINUITY FINITE STATE MACHINE (FSM)                       |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   [SCHEDULED]                                                                           |
|        |                                                                                |
|        v (Patient in OT Holding Area)                                                   |
|   [CHECKED_IN]                                                                          |
|        |                                                                                |
|        v (WHO Time-Out Verified -> Continuity Lock Activated)                          |
|   [INTRAOPERATIVE_ACTIVE] <=======================> [HANDOVER_IN_PROGRESS]              |
|        |                   (Dual-Surgeon Handover)                                      |
|        |                                                                                |
|        +-----------------------------> [EMERGENCY_OVERRIDE]                             |
|        |                                (Crash Transfer/Code Blue)                      |
|        v (WHO Sign-Out Verified)                                                        |
|   [TRANSFER_TO_PACU]                                                                    |
|        |                                                                                |
|        v (Patient in PACU)                                                              |
|   [PACU_RECOVERY]                                                                       |
|        |                                                                                |
|        v (Aldrete Score >= 9/10 -> Continuity Lock Released)                            |
|   [PROCEDURE_CLOSED]                                                                    |
|                                                                                         |
|   * Stale Recovery Path:                                                                |
|   [INTRAOPERATIVE_ACTIVE / PACU_RECOVERY] (Timeout > 12h without Heartbeat)              |
|        |                                                                                |
|        v (Supervised by Chief of Surgery / Medical Director)                            |
|   [STALE_RECOVERED] (Continuity Lock Released with Justification)                       |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

---

## 3. State Definitions & Safety Invariants

| State | Continuity Lock Status | Preconditions & Requirements | Safety Invariant |
| :--- | :---: | :--- | :--- |
| `SCHEDULED` | **Inactive** | Surgery booked with primary surgeon, anaesthetist, theatre | Normal licensing checks apply. |
| `CHECKED_IN` | **Inactive** | Patient admitted to holding bay; Sign-In phase pending | Pre-induction verification. |
| `INTRAOPERATIVE_ACTIVE` | **ACTIVE** | **WHO Time-Out verified** by surgical team | **Zero licensing interruption.** Heartbeat tracks activity. |
| `HANDOVER_IN_PROGRESS` | **ACTIVE** | Outgoing surgeon verified; distinct incoming surgeon | Handover history appended; surgeon ID updated. |
| `TRANSFER_TO_PACU` | **ACTIVE** | **WHO Sign-Out verified** (sponge/needle count reconciled) | Continuity lock transitions with patient. |
| `PACU_RECOVERY` | **ACTIVE** | Patient admitted to PACU recovery bed | Vital monitoring and Aldrete scoring active. |
| `PROCEDURE_CLOSED` | **Released** | **Modified Aldrete Score >= 9/10 strictly verified** | Lock released; commercial licensing resumes. |
| `EMERGENCY_OVERRIDE` | **ACTIVE** | Clinician ID + clinical reason + action taken documented | Life-saving override maintained. |
| `STALE_RECOVERED` | **Released** | Authorized supervisor role + clinical justification >= 15 chars | Prevents permanent unauthorized lockouts. |

---

## 4. Key Methods in `SurgicalContinuityService`

1. `initiateIntraoperativeSession(params)`:
   - Validates `timeOutVerified === true`.
   - Transitions to `INTRAOPERATIVE_ACTIVE`. Sets `continuityLockActive = true`.
   - Computes timeout (default 12 hours). Emits `SURGICAL_CONTINUITY_LOCK_ACTIVATED`.
2. `performHandover(params)`:
   - Verifies session is in `INTRAOPERATIVE_ACTIVE`.
   - Rejects identical outgoing/incoming surgeons (`HANDOVER_IDENTITY_ERROR`).
   - Rejects unassigned outgoing surgeons (`HANDOVER_AUTH_FAILED`).
   - Appends audit trail and updates primary surgeon.
3. `transferToPacu(params)`:
   - Verifies `signOutVerified === true`. Rejects transfer if counts/sign-out are incomplete.
   - Transitions to `PACU_RECOVERY`. Maintains lock.
4. `closeProcedure(params)`:
   - Rejects closure if `aldreteScore < 9` (`ALDRETE_SCORE_INSUFFICIENT`).
   - Transitions to `PROCEDURE_CLOSED`. Releases `continuityLockActive = false`.
5. `recoverStaleSession(params)`:
   - Rejects unauthorized roles (requires `chief_of_surgery`, `ot_director`, `medical_director`, `hospital_admin`, or `super_admin`).
   - Rejects missing justification (`JUSTIFICATION_REQUIRED`).
   - Transitions to `STALE_RECOVERED` and safely releases the lock.
6. `isSessionProtected(scheduleId, hospitalId)`:
   - Queried directly by `licensing.middleware.ts`.
   - Returns `true` if `continuityLockActive === true`.

---

## 5. Test Evidence & Results

### Test Suite: `backend/tests/clinical_safety_p0.test.ts`

- **P0-02.1**: Reject procedure initiation without WHO Time-Out (`timeOutVerified: false`) -> **PASS** (1.2ms)
- **P0-02.2**: Intraoperative session locks surgical continuity server-side -> **PASS** (14.1ms)
- **P0-02.3**: Authorized intraoperative handover between distinct surgeons with audit -> **PASS** (1.7ms)
- **P0-02.4**: Transfer to PACU requires WHO Sign-Out and maintains lock -> **PASS** (1.3ms)
- **P0-02.5**: Procedure closure strictly blocks discharge if Aldrete score < 9 -> **PASS** (1.4ms)
- **P0-02.6**: Controlled stale surgical session recovery with supervisor authorization -> **PASS** (1.6ms)

---

## 6. Outstanding Operational Considerations

1. **Hardware Telemetry Integration**: Future IoT integrations (HL7 / IEEE 11073 anaesthesia workstation monitors) will automatically pulse `heartbeatIntraoperativeSession()` every 60 seconds to detect active surgeries without manual user intervention.
2. **Post-PACU Transition**: Once closed, any subsequent surgical re-exploration (e.g. return to OT for bleeding) must initiate a new, authenticated schedule with fresh WHO Time-Out verification.

