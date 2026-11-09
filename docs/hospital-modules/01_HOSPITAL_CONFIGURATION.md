# Module 01: Core Hospital Configuration Specification

## 1. Overview
The Core Hospital Configuration module establishes the foundational master data, multi-branch organizational hierarchy, physical infrastructure (buildings, floors, wards, rooms, beds), operational working hours, clinical alert thresholds, and localization parameters.

---

## 2. Multi-Branch Architecture
ASRTAVA supports multiple physical branches operating under a single parent hospital tenant organization:
- **Parent Hospital Entity (`hospitals`)**: Holds global tenant metadata, legal entity name, subscription tier, and primary license.
- **Hospital Branches (`hospital_branches`)**: Independent operational campuses sharing the tenant license with localized physical addresses, contact numbers, and specific department allocations.

```
                          ┌───────────────────────────┐
                          │   Hospital Organization   │
                          │   (Tenant: APEX-CARE-01)  │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
┌───────────────────────┐                                 ┌───────────────────────┐
│     Main Hospital     │                                 │     City Branch       │
│      Campus (BLR)     │                                 │      Clinic (KML)     │
└──────────┬────────────┘                                 └──────────┬────────────┘
           │                                                         │
   ┌───────┴───────┐                                         ┌───────┴───────┐
   ▼               ▼                                         ▼               ▼
Wards & Beds   Operation Theatres                         OPD Clinics    Day Care Beds
```

---

## 3. Physical Infrastructure Hierarchy
1. **Wards (`wards`)**: Dedicated nursing units categorized by acuity: `general`, `semi_private`, `private`, `icu`, `nicu`, `picu`, `isolation`, `emergency`, `maternity`, `post_op`.
2. **Rooms (`rooms`)**: Physical enclosures mapped to wards with specific room configurations (`single`, `double`, `triple`, `multi`, `deluxe`, `icu_suite`), oxygen ports, AC, and daily room rates.
3. **Beds (`beds`)**: Individual care stations (`standard`, `fowler`, `icu`, `pediatric`, `bariatric`) tracked with strict atomic statuses: `available`, `occupied`, `reserved`, `maintenance`, `cleaning`.

---

## 4. API Endpoints
- `GET /api/v1/hospitals/profile`: Retrieve hospital profile, settings, and branches.
- `PUT /api/v1/hospitals/settings`: Update working hours, timezone, appointment durations, and GST tax rates.
- `GET /api/v1/hospitals/branches`: List all active hospital branches.
- `POST /api/v1/hospitals/branches`: Onboard a new branch under current tenant.
- `GET /api/v1/hospitals/departments`: List clinical and non-clinical departments.
- `POST /api/v1/hospitals/departments`: Register department with code and display order.
- `GET /api/v1/hospitals/wards`: List wards and linked branches.
- `POST /api/v1/hospitals/wards`: Provision new inpatient ward.
- `POST /api/v1/hospitals/rooms`: Configure room inside a ward.
- `POST /api/v1/hospitals/beds`: Register bed with unique bed number and status.

