# ASRTAVA — Telemedicine & Remote Healthcare Test Plan

## 1. Test Strategy & Scope
This test plan provides comprehensive verification for Prompt 26: **Complete Telemedicine, Video Consultations, Remote Patient Monitoring (RPM), Patient Engagement & Digital Healthcare Services**.

The test coverage spans:
1. **Service Catalog & Fee Engine**: Consultation mode definitions, duration, baseline fees, follow-up tariff rules, GST rates, and cancellation policies.
2. **Doctor Discovery & Profile**: Verified qualifications, council registration, language coverage, and supported consultation modes.
3. **Appointment Booking & Concurrency**: Slot reservation, doctor calendar anti-collision, and unique room ID generation.
4. **Financial Authorization**: Payment verification, dual-charge prevention, and receipt generation.
5. **Informed Consent Lifecycle**: Digital signature, SHA-256 integrity hash, and legal disclaimer recording.
6. **Virtual Waiting Room**: Pre-flight camera/mic/network checks, real-time queue position tracking, and doctor readiness signaling.
7. **WebRTC Video Session Security**: Short-lived HMAC-SHA256 tokens, connection establishment, in-session encrypted messaging, and duration logging.
8. **Clinical EMR Integration**: In-call SOAP documentation, ICD-10 diagnosis tagging, e-prescribing, and in-person hospital referral conversion.
9. **Remote Patient Monitoring (RPM)**: Care plan enrollment, multi-source measurement logging (manual vs. verified devices), threshold evaluation, critical alert dispatch, and clinician emergency escalation.
10. **Patient Education**: Publication of verified medical guides with category and language indexing.

---

## 2. Test Execution Matrix
| # | Scenario ID | Description | Acceptance Criteria |
|---|---|---|---|
| 1 | `TELE-SVC-01` | Service Catalog Creation | Validates fee, duration, GST rate, and consultation mode |
| 2 | `TELE-SVC-02` | Duplicate Service Rejection | Strict error on duplicate service code within hospital |
| 3 | `TELE-DOC-01` | Doctor Teleconsult Profile | Captures languages, fee, and verified credentials |
| 4 | `TELE-DISC-01`| Clinician Discovery Filter | Filters doctors by specialty and consultation mode |
| 5 | `TELE-BK-01`  | Appointment & Room Generation| Generates `TCON-*` appointment and `room-*` virtual ID |
| 6 | `TELE-COL-01` | Double-Booking Anti-Collision | Prevents concurrent appointment booking for doctor |
| 7 | `TELE-PAY-01` | Payment Verification | Confirms payment and transitions status to `CONFIRMED` |
| 8 | `TELE-PAY-02` | Duplicate Charge Defense | Blocks double payment submissions on paid appointments |
| 9 | `TELE-CNS-01` | Digital Consent Signing | Persists consent with SHA-256 cryptographic signature |
| 10| `TELE-WRM-01` | Virtual Waiting Room | Verifies device pre-check and assigns queue position |
| 11| `TELE-RTC-01` | WebRTC Session Tokens | Issues short-lived HMAC-SHA256 session access tokens |
| 12| `TELE-MSG-01` | In-Session Secure Messaging | Encrypted message delivery and retrieval |
| 13| `TELE-EMR-01` | Clinical Encounter & Referral | Documents SOAP notes, eRx, and in-person OPD referral |
| 14| `TELE-END-01` | Call Duration Tracking | Logs exact consultation duration and termination reason |
| 15| `TELE-RPM-01` | RPM Vital & Critical Alert | Detects critical blood pressure ($190 \ge 180$) & alerts |
| 16| `TELE-RPM-02` | Clinician Alert Escalation | Formally acknowledges and escalates emergency action |

