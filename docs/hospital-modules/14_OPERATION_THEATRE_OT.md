# Module 14: Operation Theatre (OT) & Surgical Procedures Specification

## 1. Overview
The Operation Theatre (OT) module coordinates surgical suite scheduling, surgical team allocations (lead surgeon, assistant surgeon, anesthesiologist, scrub nurse), preoperative WHO safety checklists, operative findings documentation, and postoperative recovery tracking.

---

## 2. Core Functional Capabilities

### 1. Surgical Scheduling Engine
- OT Room allocation with strict overlap prevention.
- Validates surgeon and anesthesiologist availability for the scheduled procedure window.
- Captures procedure name, ICD-9/10-PCS code, and planned duration.

### 2. WHO Surgical Safety Checklist Integration
Mandatory verification stages before surgical incision:
- **Sign In** (Before induction of anesthesia): Patient identity, surgical site marking, consent, pulse oximeter functioning, anesthesia safety check, known drug allergies, airway risk evaluated.
- **Time Out** (Before skin incision): Entire surgical team introduces themselves by name and role; surgeon, anesthesiologist and nurse confirm patient name, procedure, and incision site.
- **Sign Out** (Before patient leaves operating room): Instrument, sponge and needle counts verified; specimen labeling confirmed.

### 3. Operative Findings & Post-Op Orders
- Detailed operative findings (e.g. anatomy visualized, pathology excised, implants placed, estimated blood loss).
- Immediate postoperative recovery instructions (vital sign frequency, analgesia, IV fluids, wound care).

---

## 3. API Endpoints
- `GET /api/v1/ot/theatres`: List operation theatres and operational status.
- `POST /api/v1/ot/theatres`: Register new operation theatre suite.
- `POST /api/v1/ot/schedules`: Schedule surgical procedure with double-booking prevention.
- `PATCH /api/v1/ot/schedules/:id/operative-notes`: Finalize surgical notes and recovery orders.

