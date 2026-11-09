# ASRTAVA Provider Configuration Checklist

Before activating an external provider in **Production**, the authorized platform or hospital administrator must complete this verification checklist:

## 1. Meta WhatsApp Business Cloud API
- [ ] Registered Meta Business Manager organization with verified business identity.
- [ ] Dedicated phone number acquired and linked to WhatsApp Business Account (WABA).
- [ ] Permanent System User Access Token generated with `whatsapp_business_messaging` permissions.
- [ ] Standard message templates submitted and marked **Approved** by Meta (`APPOINTMENT_BOOKED`, `LAB_REPORT_READY`, etc.).
- [ ] Webhook callback registered with valid HTTPS endpoint and verify token.
- [ ] Live Test Ping latency under 100ms verified via Hospital Admin Integrations dashboard.

## 2. Indian Telecom DLT SMS Gateway
- [ ] Registered Principal Entity (PE) on telecom DLT portal (e.g. Jio / Airtel / Vodafone Idea DLT).
- [ ] 6-character alpha Header approved (e.g., `APEXCR`).
- [ ] Transactional & Service-Implicit Content Templates approved with designated variable placeholders (`{#var#}`).
- [ ] Provider API credentials configured in AES-256-GCM vault.
- [ ] Rate limiting confirmed (maximum 3 OTPs / 15 minutes).

## 3. Payment Gateway (Razorpay / Cashfree / Stripe)
- [ ] Merchant KYC verified and live API keys generated.
- [ ] Separate accounts/keys configured for Hospital Patient Billing vs SaaS Subscription Billing.
- [ ] Webhook endpoint configured with signed HMAC secret.
- [ ] End-to-end sandbox test transaction executed and refunded cleanly.
- [ ] Confirmed zero card CVV / full PAN storage in application database.

## 4. Laboratory (LIS) & Instruments
- [ ] LIS IP address and port (or REST endpoint) whitelisted on internal network.
- [ ] Cryogenic barcode labeling format calibrated to analyzer scanner specifications.
- [ ] Verified that raw incoming results enter unapproved staging (`is_pathologist_approved = false`).
- [ ] Pathologist digital approval workflow tested end-to-end before patient release.

## 5. Radiology PACS (Orthanc / DICOMweb)
- [ ] DICOMweb plugin enabled on PACS server (QIDO-RS / WADO-RS endpoints reachable).
- [ ] Local Application Entity Title (`ASRTAVA_HMS`) and Remote AETitle (`PACS_SERVER`) aligned.
- [ ] Ephemeral signed viewer URL expiration verified (30 minutes TTL).
- [ ] Modality worklist (MWL) query verified with synthetic study.

## 6. AWS S3 Cloud Storage
- [ ] Private S3 bucket created with `Block all public access` enabled.
- [ ] Default encryption set to `AES-256` or `aws:kms`.
- [ ] IAM policy scoped strictly to target bucket prefix: `arn:aws:s3:::bucket/tenants/{hospital_id}/*`.
- [ ] Presigned upload and download URLs verified with 15-minute expiration window.

