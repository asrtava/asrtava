# QR Check-In Pass & Hospital Directions

## 1. Digital Consultation Pass (`AppointmentDetailsScreen.tsx`)
- Displays live status: `Confirmed`, `Checked In`, `In Consultation`, or `Completed`.
- Token Number & Queue Estimate: Real-time queue status (e.g. *Approx 15 mins wait*).
- **Self-Check-In QR Code**:
  - Encodes a secure, high-entropy ephemeral token (e.g. `ASR-CHK-9f821a8d...`).
  - Contains **zero plain-text PII** (no names, phone numbers, or diagnosis details embedded in the QR payload).
  - Designed for 1-second optical scanning at the hospital reception kiosk or nurse station.
- **Facility Guidance**: Outpatient Wing, Floor, Room number (e.g. *OPD Wing B · 2nd Floor · Room #204*).
- **GPS Navigation**: Direct link to open native Google Maps / Apple Maps routing to the hospital entrance.
- **Reschedule & Cancellation Controls**: Safe cancellation workflow that confirms with the patient and frees up the doctor slot in the central scheduling engine.

