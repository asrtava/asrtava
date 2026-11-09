# ASRTAVA — Patient Mobile Application Telemedicine & Synchronization Validation

## 1. Overview
The Patient Mobile Application (`apps/patient-mobile`) synchronizes with the ASRTAVA centralized backend to provide patients with an integrated native mobile experience across Android and iOS.

---

## 2. Mobile Teleconsultation Capabilities
1. **Unified Identity**: Mobile users authenticate using mobile phone OTP / JWT authentication, referencing the same single source of truth `patients.id` in PostgreSQL.
2. **Doctor Discovery & Booking**: Filter by department and book virtual time slots with Razorpay / UPI in-app payments.
3. **Pre-Call Push Notification**: Push alerts delivered 15 minutes before the scheduled consultation and when the doctor enters the virtual room.
4. **Mobile Video Consultation**: Native camera and microphone permissions handled gracefully with connection recovery on cellular/Wi-Fi handover.
5. **Mobile e-Prescription & Lab Access**: Immediate viewing of newly signed digital prescriptions with pharmacy pickup or home delivery options.

