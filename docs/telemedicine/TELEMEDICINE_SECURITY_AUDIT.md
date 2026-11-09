# ASRTAVA — Telemedicine & Remote Care Security & Privacy Audit

## 1. Security Architecture & Threat Model
The Telemedicine and Digital Health subsystem adheres to strict healthcare security and privacy regulations, including the Digital Personal Data Protection (DPDP) Act, HIPAA security principles, and the Indian Telemedicine Practice Guidelines.

### Core Security Controls:
1. **Multi-Tenant Row-Level Security (RLS)**:
   - All 13 telemedicine database tables enforce PostgreSQL RLS policies where `organization_id = CURRENT_ORGANIZATION_ID()` and `hospital_id = CURRENT_HOSPITAL_ID()`.
   - Cross-tenant access to video sessions, messages, consents, or RPM vitals is prevented at the database kernel level.
2. **Ephemeral WebRTC Session Tokens**:
   - Access tokens generated for video sessions use HMAC-SHA256 signatures with 60-minute expiration windows.
   - Permanent meeting links and reusable room credentials are explicitly prohibited.
3. **Data Minimization & Video Recording Policies**:
   - Audio and video consultations are strictly **not recorded by default**.
   - Recording requires explicit double consent (patient + doctor), justification, and encrypted storage.
4. **Role-Based & Individual Negative Permissions**:
   - Role-based permissions (`telemedicine.sessions.join`, `telemedicine.prescriptions.create`, `telemedicine.alerts.acknowledge`) enforced with individual DENY overrides.

