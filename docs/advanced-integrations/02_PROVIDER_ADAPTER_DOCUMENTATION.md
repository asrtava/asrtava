# ASRTAVA Provider Adapter Documentation

## 1. Supported Provider Catalog
ASRTAVA provides production-oriented adapters across 7 functional categories:

| Provider Code | Name | Category | Primary Interface | Authentication |
|---|---|---|---|---|
| `whatsapp_meta` | Meta WhatsApp Business Cloud API | Communication | REST / Graph API v19.0 | Bearer Token / OAuth 2.0 |
| `sms_gupshup` | Gupshup Enterprise Telecom | Communication | REST API / DLT Header | API Key / Basic Auth |
| `sms_twilio` | Twilio Global SMS | Communication | REST API | Account SID & Auth Token |
| `email_ses` | Amazon Simple Email Service (SES) | Communication | AWS SDK v3 / SMTP | IAM Secret Access Key / DKIM |
| `email_sendgrid` | Twilio SendGrid | Communication | REST API v3 | Bearer API Key |
| `push_fcm` | Firebase Cloud Messaging (FCM) | Push Notifications | HTTP v1 API | Google Service Account JWT |
| `payment_razorpay` | Razorpay Payments | Financial Gateway | Orders & Payments API | Key ID + Key Secret (HMAC) |
| `payment_stripe` | Stripe International Gateway | Financial Gateway | Payment Intents & Subscriptions | Publishable & Secret API Keys |
| `lis_hl7` | Automated LIS / Instrument Gateway | Pathology & Lab | HL7 MLLP / REST / ASTM | mTLS / API Token |
| `pacs_orthanc` | Orthanc / dcm4chee PACS | Radiology RIS/PACS | DICOMweb (QIDO/WADO/STOW) | HTTP Basic / Ephemeral Tokens |
| `interop_fhir` | HL7 FHIR R4 & ABDM Gateway | Health Informatics | REST FHIR R4 JSON Bundles | OAuth 2.0 Client Credentials |
| `storage_s3` | AWS S3 Object Storage | Document Archival | AWS S3 REST / Presigned URLs | AWS Signature v4 |
| `accounting_erp`| Tally Prime & ERP Connector | Financial ERP | XML / JSON Journal Vouchers | Dedicated Port / Token |
| `maps_google` | Google Maps Platform | Geolocation & Maps | Geocoding & Distance Matrix API | API Key / Restrictions |

## 2. Implementing New Custom Adapters
To add a new provider (e.g. `sms_msg91` or `payment_cashfree`):
1. Implement the corresponding interface from `src/modules/integrations/providers/interfaces.ts`.
2. Implement `testConnection(credentials, config)` returning latency and health status.
3. Register the adapter instance in `IntegrationRegistryService.adapters`.
4. Add the provider record to database migration `016_integrations_ecosystem.sql`.

