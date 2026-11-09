# ASRTAVA Integration Security and Privacy Assessment

## 1. Compliance Framework Alignment
This assessment evaluates ASRTAVA's external integration ecosystem against the Indian **Digital Personal Data Protection (DPDP) Act 2023**, **HIPAA Security Rule (45 CFR Part 164)**, and **PCI-DSS v4.0**.

| Control Category | Requirement | ASRTAVA Implementation | Compliance Status |
|---|---|---|---|
| **Data in Transit** | Encrypt all external communications over public networks | TLS 1.3 enforced for all external HTTPS, DICOMweb, and MLLP channels | **PASSED** |
| **Data at Rest** | Cryptographic protection of stored credentials & health data | AES-256-GCM authenticated encryption in `CredentialVault`; AES-256 S3 bucket encryption | **PASSED** |
| **Payment Security** | Zero storage of sensitive cardholder authentication data | ASRTAVA never captures or stores CVV or PAN; uses Razorpay/Stripe tokenized checkout | **PASSED (PCI-DSS)** |
| **Notification Privacy** | Lock screens must not reveal protected health information | Push notifications and SMS messages omit sensitive diagnoses; deliver secure portal links | **PASSED (DPDP)** |
| **Webhook Security** | Replay and forgery protection for financial/clinical callbacks | Constant-time HMAC-SHA256 signature verification & SHA-256 idempotency hash cache | **PASSED** |
| **Clinical Integrity** | Automated instruments cannot alter patient records without verification | Mandatory pathologist verification gate before publishing external LIS results | **PASSED** |
| **Tenant Isolation** | Third-party credentials must not cross tenant boundaries | Strict PostgreSQL RLS on `tenant_integrations` and `integration_credentials` | **PASSED** |
| **Least Privilege** | Zero permanent standing super-admin access to patient charts | Super Admins only view integration catalog; tenant credentials accessible only to hospital admin | **PASSED** |

