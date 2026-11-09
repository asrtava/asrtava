# Module 15: Emergency Department (ED) Management Specification

## 1. Overview
The Emergency Department (ED) Management module coordinates rapid intake, clinical triage prioritization, urgent vital signs tracking, emergency physician assignment, fast-track diagnostics, and patient disposition (transfer to ICU, OT, IPD Ward, or discharge).

---

## 2. Core Functional Capabilities

### 1. Standardized Emergency Triage Scale (Levels 1 - 5)
Every arriving emergency patient is triaged immediately by an emergency nurse:
- **Level 1 (Resuscitation - Immediate)**: Cardiac arrest, respiratory failure, severe polytrauma, anaphylaxis.
- **Level 2 (Emergent - < 15 mins)**: Suspected Acute Coronary Syndrome (STEMI), acute stroke, altered mental state, severe dyspnea.
- **Level 3 (Urgent - < 30 mins)**: Moderate asthma exacerbation, severe abdominal pain, high fever with lethargy.
- **Level 4 (Less Urgent - < 60 mins)**: Minor fractures, simple lacerations requiring sutures, mild dehydration.
- **Level 5 (Non-Urgent - < 120 mins)**: Suture removal, medication refills, chronic mild aches.

### 2. Emergency Patient Disposition
Once stabilized, emergency physicians assign a formal disposition:
- `admitted_ipd`: Patient transferred to General Ward.
- `transferred_icu`: Critical escalation to ICU / CCU.
- `transferred_ot`: Emergency surgical intervention required.
- `discharged`: Stable with home prescriptions.
- `lama`: Left Against Medical Advice (with signed consent).

---

## 3. API Endpoints
- `GET /api/v1/emergency/queue`: Real-time emergency queue sorted by triage priority (Level 1 first) and arrival time.
- `POST /api/v1/emergency/triage`: Emergency intake and triage categorization.
- `PATCH /api/v1/emergency/:id/disposition`: Finalize emergency disposition and transfer notes.

