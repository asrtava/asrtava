# Module 04: Appointment Scheduling Engine Specification

## 1. Overview
The Appointment Scheduling Engine powers multi-channel booking (reception walk-in, doctor-assisted, patient web portal, and patient mobile app) with automated double-booking prevention, doctor availability calculations, daily queue token generation, and real-time lifecycle transitions.

---

## 2. Core Functional Capabilities

### 1. Appointment Lifecycle State Machine
Appointments progress through controlled explicit transitions:
```
  [requested] ──────────► [confirmed] ──────────► [checked_in] ──────────► [waiting]
                               │                        │                      │
                               ▼                        ▼                      ▼
                         [cancelled]              [no_show]            [in_consultation]
                                                                               │
                                                                               ▼
                                                                          [completed]
```

### 2. Concurrency-Safe Double-Booking Prevention
When an appointment is scheduled:
1. Opens a PostgreSQL transaction with pessimistic row-locking (`FOR UPDATE`) on the doctor's calendar.
2. Checks for overlapping intervals where:
   $$(T_{\text{start}} \ge \text{appt.start} \land T_{\text{start}} < \text{appt.end}) \lor (T_{\text{end}} > \text{appt.start} \land T_{\text{end}} \le \text{appt.end})$$
   excluding `cancelled` and `no_show` records.
3. Automatically increments the daily sequential OPD queue token (`queue_token_number`).

### 3. Rescheduling & Cancellations
- Rescheduling validates target slot availability before updating the record, appending previous appointment history to the audit notes.
- Cancellations record the cancelling actor and reason, freeing the slot immediately for other patients.

---

## 3. API Endpoints
- `GET /api/v1/appointments`: Filter appointments by doctor, date, status, or branch.
- `POST /api/v1/appointments`: Book appointment with concurrency overlap prevention.
- `PATCH /api/v1/appointments/:id/status`: Update lifecycle status (`checked_in`, `in_consultation`, `completed`, `cancelled`).
- `POST /api/v1/appointments/:id/reschedule`: Reschedule to new date and time slot.

