# Patient Identity & Mobile Authentication

## 1. Centralized Identity Sharing
A patient uses the **exact same identity** across the Patient Web Portal and Patient Mobile Application:
- No duplicate records or separate login credentials are created.
- Authentication endpoints:
  - `POST /api/v1/auth/patient-login`: Mobile number + Password or 6-digit SMS OTP.
  - `POST /api/v1/auth/patient-register`: Self-serve registration capturing legal name, DOB, gender, mobile, email, and consent.
  - `POST /api/v1/auth/logout`: Revokes current device token or all active web/mobile sessions.

## 2. Token Security & Storage Invariants
- Access Tokens: Short-lived (15 minutes) JWTs.
- Token Storage: Kept in memory during active lifecycle and backed by hardware-backed secure storage (iOS Keychain and Android Keystore). Tokens are **never** stored in plain AsyncStorage.
- Biometric Enrollment: After initial authenticated sign-in, the mobile app leverages native biometrics (FaceID / TouchID / Android Fingerprint) for quick unlock.
- Device Session Management: Every mobile login stamps device metadata (OS, model, IP, timestamp) in `user_sessions`.

