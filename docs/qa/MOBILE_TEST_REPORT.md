# ASRTAVA Patient Mobile Application Test Report (Android & iOS)

## 1. Scope & Execution

The patient mobile application suite (`apps/patient-mobile/tests/patient_mobile.test.ts`) tests the architecture, security, and integration logic powering the React Native patient application across iOS and Android.

---

## 2. Test Execution Log

| Test Domain | Specific Test Assertion | Verification Logic | Result |
| :--- | :--- | :--- | :---: |
| **Phone Validation** | E.164 and 10-digit Indian mobile numbers | Rejects malformed strings (`12345`), accepts valid (`+919876543210`, `9123456789`). | **PASSED** |
| **Mobile Sessions** | High-entropy session token generation | Refresh token rotation with cryptographic SHA-256 device binding. | **PASSED** |
| **Multi-Hospital Context**| Hospital switching context | Sets `x-hospital-id` header correctly without cross-tenant bleed. | **PASSED** |
| **QR Check-in Pass** | High-entropy contactless check-in pass | Generates QR reference string without exposing unmasked PII. | **PASSED** |
| **Lab Bio-Reference** | Out-of-range indicator evaluation | Accurately identifies `abnormal_high` vs `normal` lab results. | **PASSED** |
| **Billing & Payments** | Invoice balance arithmetic | Computes paid vs outstanding balance accurately. | **PASSED** |
| **Deep Link Security** | `asrtava://` URL scheme sanitization | Whitelist router rejects unknown or malicious host schemes (`asrtava://evil.com`). | **PASSED** |

---

## 3. Mobile Security & Storage Standards

- **Secure Storage**: Tokens and biometrics stored using `react-native-keychain` (iOS Keychain with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` and Android KeyStore with hardware-backed AES-256).
- **Safe Cache Policy**: PHI (medical records, lab PDFs) is kept in volatile memory or encrypted storage cleared upon user signout.
- **Deep Link Whitelist**: Supported schemes restricted to:
  - `asrtava://appointments/:id`
  - `asrtava://records/:id`
  - `asrtava://invoices/:id`

