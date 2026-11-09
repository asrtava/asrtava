# ASRTAVA — Bed Allocation & Capacity Validation

## 1. Overview
The Bed Allocation and Capacity engine guarantees real-time visibility into bed inventory, prevents double-booking across concurrent admissions and transfers, and enforces clinical suitability matching (e.g. ICU vs Ward, oxygen, ventilator support).

## 2. Bed State Machine
A bed in ASRTAVA exists in exactly one of eight mutually exclusive operational states:

```
[AVAILABLE] <---------------------------------------------+
     |                                                    |
 (Reserve)                                                |
     v                                                    |
[RESERVED]                                                |
     |                                                    |
 (Admit)                                                  |
     v                                                    |
[OCCUPIED] ---> (Discharge or Transfer)                   |
                     v                                    |
            [CLEANING_REQUIRED]                           |
                     |                                    |
                 (Assign)                                 |
                     v                                    |
            [CLEANING_IN_PROGRESS]                        |
                     |                                    |
                 (Finish)                                 |
                     v                                    |
            [INSPECTION_PENDING]                          |
                     |                                    |
      +--------------+--------------+                     |
      | (Fail)                      | (Approve)           |
      v                             v                     |
[CLEANING_REQUIRED]            [AVAILABLE] ---------------+
```

Additionally, beds may be taken offline for maintenance (`MAINTENANCE`), quarantined (`BLOCKED`), or permanently deactivated (`OUT_OF_SERVICE`).

## 3. Concurrency Protection & Invariants
1. **Pessimistic State Checking**: Before confirming an admission or reservation, `WardAdvancedService` checks the current state of the bed within an atomic transaction.
2. **Double-Reservation Prevention**: If Bed X is in `RESERVED` or `OCCUPIED` status, any incoming reservation throws `409 Conflict: Bed is not available for reservation`.
3. **Double-Admission Prevention**: Any direct admission request targeting an already occupied or reserved bed throws `409 Conflict: Bed is not available for admission`.
4. **Time-Bound Reservations**: Bed holding reservations include an `expires_at` timestamp (default 45 to 120 minutes). If unfulfilled within the window, the bed reservation expires.

## 4. Hierarchy Resolution
Beds belong to a strict multi-tier hierarchy:
```
Organization -> Hospital Branch -> Building -> Floor -> Department -> Ward Unit -> Room -> Bed
```
This ensures clear departmental attribution (e.g. Medicine vs Surgery vs Cardiology) and granular billing rate association based on Room Type (General, Semi-Private, Private, ICU, Isolation).

