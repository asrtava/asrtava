# ASRTAVA Notification Security, Privacy & PII Redaction Audit

**Document Reference:** `docs/project/NOTIFICATION_SECURITY_AUDIT.md`  
**Audit Date:** 2026-11-09  
**Auditor:** ASRTAVA Security Officer & Data Protection Officer (DPO)

---

## 1. Security Safeguards & Privacy Defenses

| Security Domain | Defense Mechanism | Verified In Code | Status |
| :--- | :--- | :--- | :---: |
| **Credential Encryption** | AES-256-GCM hardware/software envelope encryption via `credential-vault.ts`. Zero plain text API keys stored in database or logs. | Verified in `CredentialVault.ts` | **ENFORCED** |
| **PII Data Masking** | Dynamic redaction of recipient phone numbers (`+919******210`) and email addresses (`r***l@asrtava.com`) across all public audit logs. | Verified in `NotificationEngineService` & `centralized_notifications.test.ts` | **ENFORCED** |
| **Lock-Screen Privacy** | Mobile push notifications to iOS (APNs) and Android (FCM) strip sensitive medical diagnoses and test values from lock-screen payloads. | Verified in `push.adapter.ts` | **ENFORCED** |
| **Tenant Isolation** | All notification queries filter strictly on `hospital_id`. Hospital Alpha users cannot query or intercept Hospital Beta alerts. | Verified in `centralized_notifications.test.ts` (Test 10) | **ENFORCED** |
| **Webhook Signature Verification** | Inbound delivery status webhooks from Meta Cloud API and Twilio mandate HMAC-SHA256 signature validation with replay defense. | Verified in `webhook-processing.service.ts` | **ENFORCED** |
| **Anti-Spam & Idempotency** | 10-minute sliding window deduplication prevents repetitive message flooding during network retries or user double clicks. | Verified in `centralized_notifications.test.ts` (Test 9) | **ENFORCED** |

---

## 2. Zero-Leakage Guarantee

1. **No OTP Logging**: One-Time Passwords (OTPs) and supervisor refund PINs are strictly excluded from logging statements.
2. **No Third-Party Secret Exposure**: API keys for Twilio, MSG91, Meta, and AWS SES are accessible solely by background workers inside the server process; they are never sent to browser clients.

