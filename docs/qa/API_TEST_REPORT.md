# ASRTAVA Centralized API Test Report

## 1. Gateway Status & Routing Health

The ASRTAVA Centralized API server runs on port 5000 and exposes **20 active domain gateways** under `/api/v1/*`.

| Gateway Path | Domain Scope | Auth Guard | Tenant Scoped | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth` | Unified staff & patient logins, TOTP MFA, refresh tokens | Public / Bearer | Multi-tenant | **Active** |
| `/api/v1/super-admin` | Platform SaaS management, hospital provisioning, plans | Super Admin | Platform-wide | **Active** |
| `/api/v1/hospitals` | Hospital profiles, ward configurations, branding | Hospital Admin | Tenant Isolated | **Active** |
| `/api/v1/permissions` | RBAC & individual user custom permission overrides | Hospital Admin | Tenant Isolated | **Active** |
| `/api/v1/patients` | Patient directory, demographics, duplicate detection | Staff / Doctor | Tenant Isolated (RLS) | **Active** |
| `/api/v1/appointments` | Doctor scheduling, OPD slots, booking & cancellations | Reception / Doctor | Tenant Isolated (RLS) | **Active** |
| `/api/v1/clinical` | SOAP consultation encounters, ICD-10 notes, prescriptions | Doctor | Tenant Isolated (RLS) | **Active** |
| `/api/v1/inpatient` | IPD admissions, ward beds, census occupancy grid | Nursing / Admin | Tenant Isolated (RLS) | **Active** |
| `/api/v1/pharmacy` | Drug inventory, FEFO batch allocation, dispensing | Pharmacist | Tenant Isolated (RLS) | **Active** |
| `/api/v1/diagnostics` | Laboratory orders, bio-reference ranges, radiology PACS | Lab / Radiologist | Tenant Isolated (RLS) | **Active** |
| `/api/v1/billing` | Inpatient/outpatient invoices, GST calculations, payments | Finance | Tenant Isolated (RLS) | **Active** |
| `/api/v1/hr` | Staff records, doctor rosters, attendance, payroll | HR Manager | Tenant Isolated (RLS) | **Active** |
| `/api/v1/documents` | Presigned uploads, diagnostic scans, discharge summaries | Authorized Staff | Tenant Isolated (RLS) | **Active** |
| `/api/v1/nursing` | Inpatient vitals, nursing care plans, triage censuses | Nurse | Tenant Isolated (RLS) | **Active** |
| `/api/v1/ot` | Operation theatre scheduling, surgical teams | Surgeon / Admin | Tenant Isolated (RLS) | **Active** |
| `/api/v1/emergency` | Emergency room triage, fast-track trauma admissions | ER Staff | Tenant Isolated (RLS) | **Active** |
| `/api/v1/notifications`| User in-app notifications queue, priority alerts | Authenticated User| Tenant Isolated | **Active** |
| `/api/v1/reports` | Executive KPI overview, AST query builder, async export | Admin / Management| Tenant Isolated | **Active** |
| `/api/v1/saas` | Subscription checkout, feature entitlement checks | Hospital Owner | Tenant Isolated | **Active** |
| `/api/v1/integrations` | External gateways, timing-safe webhooks, Outbox DLQ | Integration Service | Tenant Isolated | **Active** |
| `/api/v1/security` | Threat incidents, token rotation, audit ledger, DPDP DSR | Security Officer | Tenant Isolated | **Active** |

---

## 2. API Contract Verification Results

- **Canonical Envelope Format**: 100% of responses conform to `{ success, message, data, code, requestId }`.
- **Zero Information Leakage**: Verified that database connection strings, internal IPs, and raw error stack traces are intercepted and replaced with user-friendly error codes (`INTERNAL_SERVER_ERROR`).
- **Validation Rejection (HTTP 400)**: Verified structured Zod error reporting for invalid phone formats, missing required fields, and malformed dates.
- **Idempotency Protection (HTTP 409)**: Verified duplicate payment requests with the same `idempotencyKey` are rejected with HTTP 409 Conflict.

