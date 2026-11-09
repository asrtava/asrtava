# ASRTAVA — Biometric Device Integration Validation

## 1. Overview
ASRTAVA interfaces with hospital biometric access control devices (e.g. ZKTeco, Suprema, Anviz, Hikvision facial terminals) using an abstraction adapter architecture that decouples physical hardware quirks from the core clinical workforce platform.

## 2. Integration Modes Supported
1. **Network Push / Webhook**: Biometric hardware sends HTTP POST requests to `/api/v1/hr/advanced/attendance/punch` upon employee verification.
2. **Scheduled Sync Daemon**: On-premises background agent polls local device buffers over TCP port 4370 and synchronizes batches to the local edge database.
3. **Manual / Web Portal Clock-in**: For remote or field staff, web portal check-in with MFA and audit logging.

## 3. Privacy & Statutory Guardrails
- **No Raw Biometric Storage**: Antigravity/ASRTAVA **never** stores raw biometric templates (fingerprint minutiae, 3D facial mesh) in the relational database. Only device reference IDs, employee IDs, verification results (`FINGERPRINT_VERIFIED`, `FACE_VERIFIED`), and timestamps are recorded.

