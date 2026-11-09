# ASRTAVA Integration API Security & Access Governance

**Document Reference:** `docs/integrations/API_SECURITY.md`  
**Security Standards:** OWASP API Security Top 10 (2023), OAuth 2.0 / OIDC, AES-256-GCM, TLS 1.3  
**Last Verified:** 2026-11-09

---

## 1. Authentication & Scoped Authorization

- **Internal Staff Workspaces**: JWT tokens (15-minute expiration) signed via HMAC-SHA256, strictly bound to `hospital_id` and authorized tenant workspaces.
- **External Partner APIs / LIS / PACS**: Mutual TLS (mTLS) or OAuth 2.0 Bearer tokens with fine-grained scopes:
  - `interop:hl7:ingest`: Permission to push HL7 messages to MLLP/HTTP endpoints.
  - `interop:fhir:read`: Read-only access to consent-authorized FHIR resources.
  - `interop:fhir:write`: Permission to post diagnostic observations or encounters.
  - `interop:devices:telemetry`: Medical device telemetry ingestion.

---

## 2. Webhook Integrity & Signature Verification

Inbound webhooks (Razorpay, Stripe, WhatsApp Cloud API, LIS Result Feeds) mandate cryptographic signature verification:

$$\text{Signature} = \text{HMAC-SHA256}(\text{RawBody}, \text{SharedSecret})$$

- Missing or invalid signatures trigger immediate **HTTP 401 Unauthorized** before JSON parsing.
- Raw payload bytes are verified prior to any database mutation.

---

## 3. Data Protection & Sensitive PII Redaction

- **DPDP Act 2023 Compliance**: Patient Aadhaar, ABHA, phone numbers, and addresses are dynamically masked in standard operational logs and developer sandbox responses.
- **Encrypted Credential Vault**: Third-party API keys and passwords in `integration_credentials` are encrypted at rest using **AES-256-GCM** with per-record Initialization Vectors (IV) and Authentication Tags.
- **Rate Limiting**: Integration gateways enforce sliding window rate limiting (500 requests per 15 minutes per IP) to defend against brute force and denial of service.

