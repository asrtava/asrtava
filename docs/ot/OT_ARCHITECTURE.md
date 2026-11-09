# ASRTAVA Operation Theatre & Perioperative System Architecture

## 1. Domain Structure & Architectural Layers

```
                          ┌─────────────────────────────────────┐
                          │     ASRTAVA Web & Theatre Hub       │
                          │   (React 19 + TypeScript + Vite)    │
                          └──────────────────┬──────────────────┘
                                             │ REST / JSON
                                             ▼
                          ┌─────────────────────────────────────┐
                          │    Express Modular Monolith Router  │
                          │      (/api/v1/ot/advanced)          │
                          └──────────────────┬──────────────────┘
                                             │
      ┌──────────────────────┬───────────────┴──────────────┬──────────────────────┐
      │                      │                              │                      │
      ▼                      ▼                              ▼                      ▼
┌──────────────┐      ┌──────────────┐              ┌──────────────┐       ┌──────────────┐
│  Scheduling  │      │ Preoperative │              │ WHO Safety & │       │ PACU & Post- │
│  & Collision │      │ PAC / Consent│              │ Intra-op Log │       │ Op Aldrete   │
└──────────────┘      └──────────────┘              └──────────────┘       └──────────────┘
      │                      │                              │                      │
      └──────────────────────┼──────────────────────────────┴──────────────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     PostgreSQL RLS Engine   │
              │  (11 Normalized Tables)     │
              └─────────────────────────────┘
```

## 2. Core Relational Entities
1. `ot_theatres`: Physical operating rooms, HEPA positive-pressure laminar airflow status, surgical specialty designation.
2. `ot_surgery_requests`: Surgeon bookings with preoperative diagnosis, planned procedure, proposed duration, urgency level.
3. `ot_schedules`: Confirmed bookings linked to OT room, primary surgeon, assistant surgeon, anaesthetist, scrub nurse.
4. `ot_preop_assessments`: Pre-Anaesthesia Checkup (PAC) records, ASA Physical Status (I-VI), Mallampati score, fasting hours.
5. `ot_surgical_consents`: Legally binding informed consent records with risk disclosure and signature timestamps.
6. `ot_who_checklists`: Three-phase digital checklist (Sign-In, Time-Out, Sign-Out) with mandatory team verification.
7. `ot_anaesthesia_records`: Anaesthetic technique, airway management, monitored intraoperative vitals, controlled drug ledger.
8. `ot_intraop_records`: Incision time, closure time, surgical approach, implants used, blood loss (mL), urine output.
9. `ot_surgical_counts`: Initial, intraoperative addition, and closing counts for sponges, sharps, and instruments.
10. `ot_pacu_records`: Recovery room admission, hemodynamic vitals, pain score, sedation score.
11. `ot_aldrete_scores`: 5-parameter recovery assessment (Activity, Respiration, Circulation, Consciousness, O2 Saturation).

