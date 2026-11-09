# ASRTAVA WhatsApp Business Integration Guide

## 1. Overview
ASRTAVA integrates with the official **Meta WhatsApp Business Cloud API** and authorized Business Solution Providers (BSPs) to deliver secure appointment confirmations, payment receipts, optical check-in passes, and diagnostic report notifications.

## 2. Privacy & Clinical Safety Policy
- **Zero Raw PII / Sensitive Clinical Data**: WhatsApp messages **never** include sensitive diagnostic results (e.g. HIV status, biopsy findings, psychiatric assessments).
- **Secure Portal Links**: When a lab report or prescription is finalized, WhatsApp delivers an encrypted, time-limited link redirecting to the authenticated patient web portal or native mobile app.
- **DPDP 2023 Consent**: WhatsApp messaging respects the `allow_whatsapp` patient preference stored in `notification_preferences`. Patients can opt out at any time.

## 3. Approved Message Templates
| Template Code | Meta Template Name | Category | Purpose |
|---|---|---|---|
| `APPOINTMENT_BOOKED` | `asrtava_appointment_confirmed` | UTILITY | Sent immediately upon booking with doctor name and time slot |
| `APPOINTMENT_REMINDER` | `asrtava_appointment_reminder` | UTILITY | Sent 24h and 2h prior to consultation |
| `LAB_REPORT_READY` | `asrtava_lab_report_available` | UTILITY | Informs patient that pathologist approved their diagnostic test |
| `INVOICE_GENERATED` | `asrtava_invoice_ready` | UTILITY | Itemized total payable and secure UPI checkout link |
| `OTP_VERIFICATION` | `asrtava_secure_otp` | AUTHENTICATION | 6-digit numeric login code with 5-minute TTL |
| `ADMISSION_CONFIRMATION` | `asrtava_ipd_admitted` | UTILITY | Ward, bed number, and attending physician details |
| `DISCHARGE_NOTIFICATION` | `asrtava_ipd_discharged` | UTILITY | Discharge summary release notification |

## 4. Tenant Configuration
In Hospital Admin Portal -> **Third-Party Integrations**:
- **Meta Phone Number ID**: `104819283748`
- **WABA ID (WhatsApp Business Account ID)**: `394819201948`
- **System User Permanent Access Token**: Stored in AES-256-GCM vault
- **Webhook Verify Token**: Stored in `webhook_endpoints`
- **Webhook Callback URL**: `https://api.asrtava.com/api/v1/integrations/webhooks/whatsapp_meta`

