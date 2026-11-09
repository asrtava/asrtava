# ASRTAVA — Telemedicine & Digital Healthcare API Reference

All routes are mounted at `/api/v1/telemedicine` and protected by authentication and tenant context middleware.

---

## 1. Services & Doctor Discovery
- `POST /api/v1/telemedicine/services`: Configure a telemedicine service with fees, duration, and GST rates.
- `GET /api/v1/telemedicine/services`: List active telemedicine services for the hospital.
- `POST /api/v1/telemedicine/doctors/profile`: Register doctor's teleconsult profile, languages, and fees.
- `GET /api/v1/telemedicine/doctors/discovery`: Search available doctors by specialty, language, or consultation mode.

---

## 2. Appointments & Payments
- `POST /api/v1/telemedicine/appointments/book`: Book teleconsultation with schedule anti-collision locks.
- `POST /api/v1/telemedicine/appointments/:id/pay`: Verify backend payment gateway reference and confirm appointment.
- `POST /api/v1/telemedicine/consent`: Submit signed informed consent with cryptographic SHA-256 hash.

---

## 3. Waiting Room & WebRTC Video Sessions
- `POST /api/v1/telemedicine/waiting-room/join`: Patient enters virtual waiting room with pre-flight media check.
- `GET /api/v1/telemedicine/waiting-room/:appointmentId`: Retrieve live waiting room status and queue position.
- `POST /api/v1/telemedicine/sessions/start`: Doctor admits patient and generates short-lived HMAC-SHA256 session tokens.
- `POST /api/v1/telemedicine/sessions/end`: Close consultation session and record call duration.

---

## 4. Messaging & EMR Clinical Documentation
- `POST /api/v1/telemedicine/messages`: Send in-call secure message or medical file attachment.
- `GET /api/v1/telemedicine/messages/:appointmentId`: Retrieve consultation message history.
- `POST /api/v1/telemedicine/clinical/encounter`: Record SOAP notes, ICD-10 diagnosis, eRx, and in-person hospital referral.

---

## 5. Remote Patient Monitoring (RPM) & Education
- `POST /api/v1/telemedicine/rpm/care-plans`: Enroll patient in chronic disease / post-op monitoring plan.
- `POST /api/v1/telemedicine/rpm/measurements`: Record vital sign measurement with automated threshold evaluation.
- `POST /api/v1/telemedicine/rpm/alerts/:id/acknowledge`: Clinician reviews and acknowledges/escalates critical alert.
- `POST /api/v1/telemedicine/education/articles`: Publish peer-reviewed patient health guide.
- `GET /api/v1/telemedicine/education/articles`: Browse approved educational articles.

