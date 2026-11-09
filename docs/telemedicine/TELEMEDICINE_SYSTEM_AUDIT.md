# ASRTAVA — Telemedicine & Digital Health System Audit

## 1. Audit Overview
This system audit assesses ASRTAVA's existing architecture, data models, services, and client applications to establish the foundational baseline for Prompt 26: **Complete Telemedicine, Video Consultations, Remote Patient Monitoring (RPM), Patient Engagement & Digital Healthcare Services**.

---

## 2. Existing Component Inventory & Reusability Assessment

| Existing Module / Component | Current Capabilities | Reusable Functionality for Telemedicine | Gaps Addressed in Prompt 26 |
|---|---|---|---|
| **Identity & Authentication** (`modules/auth`) | Multi-tenant JWT auth, password policies, TOTP MFA, JIT sessions | Unified patient and doctor authentication tokens, tenant separation | Short-lived, role-scoped WebRTC session tokens with cryptographic signatures |
| **Patient Directory** (`modules/patients`, `patients` table) | UHID generation, demographics, emergency contacts, consent tracking | Single source of truth for patient identity across web & mobile | Remote patient consent history, representative/guardian consents |
| **Appointments** (`modules/appointments`, `appointments` table) | Scheduling, anti-collision slot locking, token generation | Core booking engine and time slot conflict prevention | Virtual consultation flags, waiting room state engine, room IDs |
| **Clinical EMR** (`modules/clinical`, `consultations`, `consultation_vitals`) | SOAP notes, ICD-10 diagnoses, vitals recording | Clinical record persistence, doctor consultation workspace | Teleconsultation session linking, audio/video duration metadata, in-person conversion |
| **Pharmacy & eRx** (`modules/pharmacy`, `prescriptions`, `prescription_items`) | e-Prescribing, FEFO stock dispensing, LASA safety | E-Prescription generation, patient viewing, pharmacy fulfillment | Digital prescription dispatch from virtual consultation with patient push alert |
| **Diagnostics (LIS & RIS)** (`modules/diagnostics`, `lab_orders`, `radiology_orders`) | HL7/ASTM lab ingest, DICOM PACS metadata, critical panic alerts | Ordering diagnostic tests directly during remote consultation | Direct linking of investigation orders to teleconsultation encounter |
| **Revenue Cycle Management** (`modules/billing`, `modules/rcm`) | Invoicing, payment collection (UPI/Cards), refund authorization, GL | Consultation fees billing, GST calculation, payment verification | Telemedicine prepaid consultation fee checkout, automated receipting |
| **Centralized Notifications** (`modules/notifications`, `modules/integrations`) | In-app alerts, MSG91 SMS, Meta WhatsApp Cloud API | Multi-channel delivery for teleconsultation reminders and alerts | Virtual waiting room "Doctor is Ready" push notification, RPM critical vitals escalation |
| **Web Portal** (`apps/web-portal`) | 13 role-specific dashboards (Patient, Doctor, Admin, etc.) | Patient and Doctor portal shells with Tailwind UI components | Dedicated Telemedicine Hub, Virtual Waiting Room, WebRTC Video Call view, RPM Dashboard |
| **Patient Mobile App** (`apps/patient-mobile`) | Doctor discovery, booking, lab reports, mobile bills, QR pass | React Native appointment booking and record browsing | Video consultation call screen, mobile vitals logging, secure chat |

---

## 3. Key Findings & Architectural Invariants
1. **Zero Duplicate Identity**: Telemedicine must reuse the core `patients.id` and `doctors.id` entities. No parallel "tele-patient" or "tele-doctor" registries.
2. **Clinical EMR Continuity**: Teleconsultation notes must be stored directly in the hospital's electronic medical records with clear origin tagging (`consultation_mode: 'video' | 'audio' | 'chat'`).
3. **Double-Booking Anti-Collision**: The appointment scheduling engine must treat physical OPD and virtual teleconsultations as mutually exclusive in the doctor's calendar.
4. **Verified Backend Payments**: Virtual appointment booking confirmation must strictly verify payment gateway transactions on the backend; frontend callbacks cannot be trusted.
5. **No Blind WebRTC Locks**: Video infrastructure must use an abstraction adapter interface (`IVideoSessionProvider`), enabling on-premises WebRTC SFU/MCU (e.g. Jitsi / LiveKit) or managed cloud providers (e.g. Daily.co / Twilio Video) without vendor lock-in.
