# ASRTAVA — Teleconsultation & Remote Care Workflow

## 1. End-to-End Teleconsultation Lifecycle
```
[1. Doctor Discovery & Booking]
       │
       ▼
[2. Online Payment & Invoicing] ─── (Pre-paid consultation charge verified by backend)
       │
       ▼
[3. Teleconsultation Consent]   ─── (Explicit digital consent recorded with timestamp)
       │
       ▼
[4. Virtual Waiting Room]       ─── (Patient arrives, connection tested, waiting queue)
       │
       ▼
[5. Doctor Notification]        ─── ("Patient is waiting in virtual room")
       │
       ▼
[6. Video/Audio Consultation]   ─── (Ephemeral token exchange, WebRTC media session)
       │
       ▼
[7. Clinical Documentation]     ─── (SOAP note, ICD-10 diagnosis, eRx, Lab/Radiology orders)
       │
       ▼
[8. Consultation Conclusion]    ─── (Session closed, eRx dispatched to patient app & pharmacy)
       │
       ├──────────────────────────────┐
       ▼                              ▼
[9. In-Person Referral]       [10. Remote Patient Monitoring]
 (OPD / Emergency / Inpatient) (Vitals logging & chronic care follow-up)
```

---

## 2. Phase-by-Phase Operational Sequence

### Step 1: Doctor Discovery & Availability
1. Patient logs into Web Portal or Mobile App.
2. Patient filters doctors by specialty, language, or branch.
3. System displays verified credentials, consultation fee, and available slots.
4. Patient selects time slot. System acquires pessimistic lock to prevent concurrent booking collision.

### Step 2: Payment & Financial Authorization
1. Patient proceeds to checkout.
2. System computes consultation fee + applicable GST.
3. Payment collected via integrated payment gateway (Razorpay / Stripe / Corporate Credit).
4. System verifies backend webhook/signature; marks appointment as `CONFIRMED`.

### Step 3: Digital Telehealth Consent
1. Before entering the consultation, patient is presented with the Telemedicine Consent Agreement.
2. Covers telehealth limitations, emergency contact instructions, and audio/video transmission privacy.
3. Patient signs electronically; record persisted in `tele_consents` with version and timestamp.

### Step 4: Virtual Waiting Room
1. 15 minutes before the appointment, patient enters the Virtual Waiting Room.
2. Browser/App verifies camera, microphone, and network bandwidth.
3. Status changes to `WAITING`. Doctor's queue reflects patient arrival.

### Step 5 & 6: Consultation In-Progress
1. Doctor clicks "Start Consultation". Doctor status transitions to `DOCTOR_READY`.
2. Both parties exchange short-lived JWT access tokens and establish WebRTC audio/video streams.
3. Real-time network health metrics (bitrate, packet loss, latency) displayed to both participants.
4. Secure in-session text chat and file attachment available for sharing medical documents.

### Step 7: Clinical EMR Documentation & Ordering
1. Doctor records presenting complaints, history, and examination findings in the EMR workspace.
2. Doctor issues e-Prescription (integrated with ASRTAVA Pharmacy for home delivery or store pickup).
3. Doctor orders diagnostic investigations (LIS lab tests, RIS radiology imaging).

### Step 8: Encounter Closure & Next Steps
1. Doctor signs off the clinical encounter.
2. Consultation status transitions to `COMPLETED`.
3. In-person referral or hospital admission evaluation initiated if physical care is required.
4. Patient enrolled in Remote Patient Monitoring (RPM) plan if chronic condition is diagnosed.
