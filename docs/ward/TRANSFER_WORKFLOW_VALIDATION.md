# ASRTAVA — Patient Bed & Ward Transfer Workflow Validation

## 1. Overview
Patient transfers between beds, rooms, wards, or intensive care units are routine clinical events requiring strict concurrency control, clinical handoff, and immediate infection control triggering for the vacated bed.

## 2. Transfer Types Supported
1. **Intra-Ward Transfer**: Bed change within the same nursing unit (e.g. bed 201-A to 201-B due to patient preference or minor equipment needs).
2. **Inter-Ward Transfer**: Transfer between different ward units (e.g. Step-down Unit to General Medical Ward).
3. **Escalation / Step-up Transfer**: Transfer to intensive care (ICU / HDU / Isolation) due to acute clinical deterioration.
4. **De-escalation / Step-down Transfer**: ICU discharge to post-acute recovery or step-down ward.

## 3. Atomic Transfer Sequence
```
1. Request Transfer: Clinical rationale, target ward, target bed requested.
2. Target Bed Check: System validates destination bed is in AVAILABLE state.
3. Transactional Handshake:
   - Destination bed status set to OCCUPIED.
   - Inpatient admission record updated with new wardId, roomId, bedId.
   - Audit record created in ward_patient_transfers with reason and transferring staff.
   - Source bed status immediately flipped to CLEANING_REQUIRED.
   - Housekeeping terminal cleaning task generated automatically.
```

## 4. Safety Invariants
- **No Ghost Beds**: A patient cannot simultaneously occupy two beds.
- **Immediate Source Bed Quarantine**: Vacated bed is never left in an unverified state; it is locked from new admissions until terminal cleaning and supervisor inspection approve it.

