# ASRTAVA Integration Ecosystem API Documentation

## 1. OpenAPI 3.0.3 Endpoints
Base URL: `http://localhost:5000/api/v1/integrations`

### 1.1 Provider Catalog & Tenant Settings
- `GET /catalog`: Lists all platform-approved providers (Meta WhatsApp, Gupshup, Razorpay, Orthanc PACS, LIS HL7, AWS S3, Google Maps).
- `GET /tenants/configs`: Returns configured integrations and health statuses for the calling hospital tenant.
- `POST /tenants/configs/:providerCode`: Saves tenant API credentials encrypted with AES-256-GCM.
- `POST /tenants/test-connection/:providerCode`: Performs a live ping test measuring round-trip latency and credential validity.

### 1.2 Notifications & Communication
- `POST /notifications/dispatch`: Dispatches multi-channel notification (WhatsApp, SMS, Email, Push) with automatic fallback.
  ```json
  {
    "recipientPhone": "919876543210",
    "templateCode": "APPOINTMENT_BOOKED",
    "preferredChannel": "whatsapp",
    "fallbackChannels": ["sms", "in_app"],
    "variables": { "patient_name": "Aditi Rao", "doctor_name": "Dr. Sharma", "slot_time": "10:30 AM" }
  }
  ```
- `GET /notifications/logs`: Retrieves unified multi-channel delivery audit logs.

### 1.3 Payment Gateways
- `POST /payments/create-order`: Initializes gateway checkout session (`patient_billing` or `saas_subscription`).
- `POST /payments/verify`: Verifies gateway payment signature and updates invoice status.
- `POST /payments/refund`: Initiates partial/full refund with idempotency protection.

### 1.4 Laboratory & Diagnostics
- `POST /laboratory/orders/transmit`: Transmits diagnostic lab order to external analyzer.
- `POST /laboratory/results/receive`: Ingests raw analyzer results into unapproved staging.
- `POST /laboratory/results/:id/approve`: Pathologist approval gate to publish results to patient EMR.

### 1.5 Healthcare Interoperability
- `POST /interop/hl7/parse`: Parses raw HL7 v2 pipe-delimited text and returns JSON + ACK message.
- `POST /interop/hl7/generate-oru`: Generates outbound `ORU^R01` observation message.
- `GET /interop/fhir/Patient/:id`: Retrieves ABDM-aligned FHIR R4 `Patient` resource.

### 1.6 Radiology PACS & Cloud Storage
- `GET /pacs/studies/:uid/viewer-url`: Generates signed 30-minute ephemeral DICOM viewer URL.
- `POST /storage/presigned-url`: Generates S3 presigned upload/download URLs with mandatory server-side encryption headers.

### 1.7 Webhooks & Asynchronous Jobs
- `POST /webhooks/:provider`: Public endpoint for incoming third-party callbacks with HMAC validation.
- `GET /jobs`: Lists outbox background queue jobs.
- `POST /jobs/:id/replay`: Replays failed job from Dead-Letter Queue (DLQ).

