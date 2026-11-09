# ASRTAVA Ward & Bed Management Architecture

## 1. Domain Structure & System Layers

```
                     ┌───────────────────────────────────────────┐
                     │    ASRTAVA Inpatient & Ward Control Hub   │
                     │       (React 19 + TypeScript + Vite)      │
                     └─────────────────────┬─────────────────────┘
                                           │ REST / JSON
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │    Express Modular Monolith Router        │
                     │    (/api/v1/inpatient/ward/advanced)      │
                     └─────────────────────┬─────────────────────┘
                                           │
      ┌────────────────────┬───────────────┴───────────────┬────────────────────┐
      │                    │                               │                    │
      ▼                    ▼                               ▼                    ▼
┌─────────────┐     ┌──────────────┐               ┌──────────────┐      ┌─────────────┐
│Infrastructure│    │ Bed Lifecycle│               │ Patient Flow │      │Housekeeping │
│ & Hierarchy │     │ & Allocation │               │& Transfers   │      │& Turnover   │
└─────────────┘     └──────────────┘               └──────────────┘      └─────────────┘
      │                    │                               │                    │
      └────────────────────┼───────────────────────────────┴────────────────────┘
                           │
                           ▼
            ┌─────────────────────────────┐
            │   PostgreSQL RLS Database   │
            │  (14 Core Relational Tables)│
            └─────────────────────────────┘
```

## 2. Infrastructure Hierarchy
```
Organization (Healthcare Chain)
 └── Hospital Tenant
      └── Building (e.g. Main Tower, Surgical Block, Mother & Child)
           └── Floor (e.g. Ground, Floor 1, Floor 2, Terrace ICU)
                └── Department (e.g. Medicine, General Surgery, Paediatrics)
                     └── Ward (e.g. Male Medical Ward, Post-Op Surgical Ward)
                          └── Room (e.g. Semi-Private 204, Deluxe Suite 301)
                               └── Bed (e.g. Bed 204-A, Bed 204-B)
```

## 3. Core Relational Entities
1. `ward_buildings`: Physical hospital blocks/towers.
2. `ward_floors`: Building floor assignments.
3. `ward_departments`: Medical/surgical clinical departments.
4. `ward_units`: Configurable wards (General, ICU, HDU, Isolation, Day-Care, Pediatric, etc.).
5. `ward_rooms`: Patient rooms with daily rate, AC/non-AC, private/semi-private categorization.
6. `ward_beds`: Physical beds with equipment support, gender restriction, isolation capability, and operational status.
7. `ward_bed_reservations`: Time-bound holding reservations preventing concurrent collision.
8. `ward_admission_requests`: Doctor requests from OPD/Emergency with urgency and diagnosis.
9. `ward_ipd_admissions`: Formal inpatient encounters with unique admission identifiers (`IPD-2026-XXXXX`).
10. `ward_patient_transfers`: Inter-bed, inter-ward, and ICU step-up/step-down handover records.
11. `ward_housekeeping_tasks`: Cleaning requests (Routine, Terminal, Isolation) with staff assignment.
12. `ward_cleaning_inspections`: Supervisor inspection and quality sign-off before bed status flips to `available`.
13. `ward_discharge_plans`: Proactive discharge readiness tracking (barriers, meds reconciliation, follow-up).
14. `ward_visitor_passes`: Visitor security passes with allowed entry/exit windows and patient identification.

