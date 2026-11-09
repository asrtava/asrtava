# ASRTAVA Third-Party & Integration Security Policy

## 1. Scope & Ecosystem

ASRTAVA integrates with critical external platforms:
- **Communication**: Meta WhatsApp Cloud API, Gupshup DLT SMS, Amazon SES
- **Payment Gateways**: Razorpay, Stripe
- **Clinical Systems**: Orthanc PACS (DICOMweb), LIS Analyzers (HL7 v2.5.1 / MLLP), ABDM ABHA Gateway
- **Storage**: Amazon S3 / Cloud Storage

---

## 2. Inbound Webhook Security Standards

All external webhook ingress endpoints (`/api/v1/integrations/webhooks/*`) enforce:
1. **Timing-Safe HMAC Verification**: Computes expected SHA-256 HMAC and verifies using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
2. **Payload Idempotency**: Extracts unique provider event IDs (e.g. `event_id`, `payment_id`). Events are checked against `integration_outbox_queue` to reject duplicate or replayed payloads.
3. **Short Payload Lifetime**: Webhook payloads older than 300 seconds (5 minutes) based on timestamp headers are rejected to mitigate replay attacks.
4. **Buffer Decoupling**: Ingress routes validate signatures, return immediate `200 OK`, and queue work into the asynchronous Outbox queue.

---

## 3. Outbound API Call Security

1. **Ephemeral Tokens**: Storage uploads and downloads use pre-signed URLs with strict 15-minute expiration windows.
2. **Credential Vault**: Vendor API keys and secret tokens are encrypted with AES-256-GCM in the database.
3. **mTLS (Mutual TLS)**: Lab analyzer connectivity (LIS) enforces mutual client-certificate authentication over TLS 1.3.

