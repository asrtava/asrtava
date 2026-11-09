# ASRTAVA Cross-Hospital Clinical Workflows & Patient Transfers

## 1. Overview

ASRTAVA coordinates complex clinical care transitions across facilities, including emergency inter-hospital ICU transfers, outpatient super-specialty referrals, and tele-radiology diagnostic reviews.

Every cross-hospital workflow enforces rigorous clinical governance, sender-receiver traceability, and patient consent.

---

## 2. Cross-Hospital Patient Transfers

When a patient requires advanced clinical interventions unavailable at their primary facility (e.g., emergent cardiac catheterization, ECMO, or organ transplant), an inter-hospital transfer is initiated:

```
[ Sending Hospital ] ─────► [ Telemetry Transport ] ─────► [ Receiving Hospital ]
 (Initiates Transfer)         (ACLS Ambulance Sync)         (Accepts & Pre-Allocates Bed)
```

### Transfer State Machine
1. `initiated`: Sending physician compiles clinical summary, provisional diagnoses, active IV infusions, and emergency transfer justification.
2. `accepted`: Receiving hospital's emergency physician or bed manager reviews clinical parameters, pre-allocates an ICU/OT bed, and authorizes dispatch.
3. `dispatched`: Patient departs sending facility in an ACLS ambulance. Transport telemetry updates live in the Group Admin portal.
4. `received`: Receiving emergency team confirms patient arrival (`arrival_timestamp`) and executes handover protocols.
5. `rejected` / `cancelled`: Permissible if patient condition stabilizes or destination facility encounters critical bed capacity constraints with mandatory audit notes.

---

## 3. Cross-Hospital Specialist Referrals

Enables primary healthcare centers and community clinics to schedule specialist consultations at tertiary teaching hospitals:
- **Referral Documentation**: Structured referral letters with clinical attachments, lab results, and radiologic imaging references.
- **Priority Triage**: Classified as `routine` (within 7 days), `urgent` (within 24 hours), or `stat` (immediate emergency consult).
- **Consultation Loop Closing**: When the specialist completes the referral consultation, an encrypted copy of the counter-referral note is routed back to the primary referring doctor.

---

## 4. Multi-Branch Doctor Scheduling & Schedule Anti-Collision

Doctors practicing at multiple facilities must never be scheduled for overlapping patient appointments at different locations.

The anti-collision engine in `GroupManagementService.createDoctorSchedule()` verifies time windows across all active schedules for the doctor on the target `day_of_week`. Any overlapping time window at another hospital or branch throws an immediate `Schedule collision` rejection.

