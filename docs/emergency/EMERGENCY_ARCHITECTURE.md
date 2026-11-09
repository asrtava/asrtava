# ASRTAVA Emergency Department & Trauma Architecture

## 1. Architectural Layers & System Boundaries

```
                      ┌─────────────────────────────────────────┐
                      │   Emergency Web Portal & Ambulance Hub  │
                      │       (React 19 + TypeScript + Vite)    │
                      └────────────────────┬────────────────────┘
                                           │ REST / JSON
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │    Express Modular Monolith Router      │
                      │     (/api/v1/emergency/advanced)        │
                      └────────────────────┬────────────────────┘
                                           │
      ┌────────────────────┬───────────────┴───────────────┬────────────────────┐
      │                    │                               │                    │
      ▼                    ▼                               ▼                    ▼
┌─────────────┐     ┌──────────────┐               ┌──────────────┐      ┌─────────────┐
│  Emergency  │     │ ESI 5-Level  │               │ Trauma / ATLS│      │ Ambulance   │
│ Registration│     │ Triage Engine│               │ Resuscitation│      │ & Mobile PCR│
└─────────────┘     └──────────────┘               └──────────────┘      └─────────────┘
      │                    │                               │                    │
      └────────────────────┼───────────────────────────────┴────────────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │   PostgreSQL RLS Database   │
            │   (11 Relational Tables)    │
            └─────────────────────────────┘
```

## 2. Core Relational Entities
1. `ed_encounters`: Emergency visit record with arrival mode (WALK_IN, AMBULANCE, POLICE_BRING_IN), temporary UHID generation.
2. `ed_triage_records`: ESI Level (1 to 5), vital signs (HR, BP, SpO2, RR, Temp, GCS, Pain 0-10), assigned ED zone (Red Resus, Yellow Acute, Green Fast-Track).
3. `ed_trauma_activations`: Code Red / Code Blue / Trauma Team activation, team roles, response time.
4. `ed_resuscitation_checklists`: ATLS Primary Survey (Airway with C-spine, Breathing, Circulation, Disability, Exposure), secondary survey.
5. `ed_stat_orders`: Emergency clinical overrides for imaging, laboratory, and pharmacy bypassing billing clearance.
6. `ed_medico_legal_cases`: MLC registration, injury description, police intimation number, constable identification.
7. `ambulance_fleet`: Ambulance vehicles (ALS, BLS, Neonatal, ICU), vehicle registration, equipment status.
8. `ambulance_trips`: Dispatch calls, caller details, pickup location, GPS telemetry, response timestamps.
9. `ambulance_pcr_records`: Pre-hospital Patient Care Reports (PCR) with on-scene vitals, medications, and receiving ED handover.
10. `ed_observation_beds`: ED holding beds, maximum observation time monitor.
11. `ed_dispositions`: Final emergency disposition (ICU_ADMISSION, EMERGENCY_OT, IPD_WARD, DISCHARGED, LAMA, MORTUARY).

