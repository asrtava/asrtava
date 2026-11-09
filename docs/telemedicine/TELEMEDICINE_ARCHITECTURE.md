# ASRTAVA — Telemedicine & Digital Healthcare Architecture

## 1. Architectural Overview
The ASRTAVA Telemedicine platform extends the hospital's clinical and operational perimeter into the patient's home through secure web and mobile interfaces. Built as part of ASRTAVA's modular monolith, it enforces strict multi-tenant isolation, real-time communication resilience, clinical governance, and perpetual licensing compatibility.

---

## 2. High-Level Architectural Diagram
```
                     ┌────────────────────────────────────────┐
                     │          Patient Client Layer          │
                     │  (Web Portal & Android/iOS Mobile App) │
                     └───────────────────┬────────────────────┘
                                         │ HTTPS / WSS
                                         ▼
                     ┌────────────────────────────────────────┐
                     │       ASRTAVA API Gateway Router       │
                     │  (/api/v1/telemedicine & /api/v1/rpm)  │
                     └───────────────────┬────────────────────┘
                                         │
     ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
     ▼                   ▼                               ▼                   ▼
┌──────────────┐  ┌──────────────┐                ┌──────────────┐    ┌──────────────┐
│ Consultation │  │   Virtual    │                │  Remote Pt   │    │ Patient      │
│  Management  │  │ Waiting Room │                │  Monitoring  │    │ Engagement & │
│  & Booking   │  │ State Engine │                │  (RPM Engine)│    │ Education    │
└──────┬───────┘  └──────┬───────┘                └──────┬───────┘    └──────┬───────┘
       │                 │                               │                   │
       ▼                 ▼                               ▼                   ▼
┌──────────────┐  ┌──────────────┐                ┌──────────────┐    ┌──────────────┐
│ Appointments │  │ WebRTC Video │                │ Connected    │    │ Centralized  │
│ & Collision  │  │ Session Svc  │                │ Devices &    │    │ Notification │
│ Prevention   │  │ (Signaling)  │                │ Thresholds   │    │ Delivery     │
└──────┬───────┘  └──────┬───────┘                └──────┬───────┘    └──────┬───────┘
       │                 │                               │                   │
       └─────────────────┼───────────────────────────────┴───────────────────┘
                         ▼
       ┌──────────────────────────────────────────────────┐
       │           PostgreSQL Core Persistence            │
       │   (RLS: organization_id, hospital_id, patient_id)│
       │                                                  │
       │  - tele_services      - tele_sessions            │
       │  - tele_appointments  - tele_consents            │
       │  - tele_messages      - tele_clinical_notes      │
       │  - rpm_plans          - rpm_measurements         │
       │  - rpm_alerts         - patient_education_docs   │
       └──────────────────────────────────────────────────┘
```

---

## 3. Core Architectural Subsystems

### 3.1. Telemedicine Service Catalog & Pricing Engine
- Configurable consultation types (Video, Audio, Follow-Up, Second Opinion, Chronic Care, Postoperative, Investigation Review).
- Hospital-configured pricing, duration (15, 30, 45, 60 minutes), and clinician eligibility.
- Built-in cancellation and refund policies.

### 3.2. Doctor Discovery & Credential Verification
- Professional profile surfacing: verified specialties, medical council registration, languages spoken, consultation fees, and available time slots.
- Anti-collision calendar integration ensuring no overlap between physical OPD and virtual appointments.

### 3.3. Virtual Waiting Room & WebRTC Video Engine
- 10-state lifecycle: `SCHEDULED` $\to$ `CONFIRMED` $\to$ `WAITING` $\to$ `DOCTOR_READY` $\to$ `PATIENT_CONNECTED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED` / `CANCELLED` / `NO_SHOW` / `FAILED`.
- Ephemeral, cryptographically signed session tokens (HMAC-SHA256, 1-hour expiration).
- Modular WebRTC adapter architecture supporting direct P2P mesh, on-prem SFU (Jitsi/LiveKit), or cloud providers (Daily.co/Twilio Video).
- Zero recording by default; explicit dual-party consent required if recording is enabled.

### 3.4. Clinical EMR, e-Prescribing & Investigation Ordering
- Doctor consultation workspace seamlessly integrated with patient historical medical records.
- In-call SOAP documentation, digital diagnosis coding (ICD-10), e-prescribing, and diagnostic test requisition (LIS/RIS).
- One-click referral and in-person OPD/Emergency conversion.

### 3.5. Remote Patient Monitoring (RPM) & Chronic Care
- Multi-parameter vital tracking: Blood Pressure, Blood Glucose, SpO2, Heart Rate, Temperature, Weight.
- Clear data-source provenance: `MANUAL_PATIENT` vs. `VERIFIED_DEVICE` vs. `MOBILE_BLUETOOTH`.
- Clinical threshold rules approved by hospital governance; multi-stage clinical acknowledgement and escalation protocols.

### 3.6. Patient Engagement & Multilingual Education
- Automated omnichannel reminders via in-app alerts, SMS, WhatsApp, and push notifications.
- Peer-reviewed patient education repository (articles, preparation guides, medication instructions) with formal editorial approval workflows.
