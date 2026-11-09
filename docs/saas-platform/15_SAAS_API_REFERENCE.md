# SaaS Platform REST API Reference

All SaaS endpoints are routed under `/api/v1/saas/*`.

## 1. Public Endpoints
- `POST /api/v1/saas/public/register-hospital`: Self-serve hospital registration.
  - Body: `{ name, legalName, code, email, phone, city, state, subscriptionPlan, adminName, adminEmail, adminPassword }`
  - Returns: `{ hospitalId, slug, adminEmail, resumptionToken, onboardingUrl }`
- `GET /api/v1/saas/public/plans`: Lists subscription plans and prices in INR.
- `GET /api/v1/saas/public/onboarding/:token`: Retrieves in-progress onboarding state.
- `POST /api/v1/saas/public/onboarding/:token/step`: Persists wizard step data.
- `POST /api/v1/saas/public/onboarding/:token/complete`: Finalizes onboarding and activates tenant.

## 2. Super Admin SaaS Platform Console
- `GET /api/v1/saas/super-admin/dashboard`: Platform KPIs (MRR, ARR, active, trial, suspended).
- `GET /api/v1/saas/super-admin/tenants`: Directory with `status`, `plan`, `search` filters.
- `GET /api/v1/saas/super-admin/tenants/:id`: Detailed tenant profile, branches, staff, usage.
- `PUT /api/v1/saas/super-admin/tenants/:id/status`: Suspend/reactivate tenant (requires `reason`).
- `GET /api/v1/saas/super-admin/plans`: Subscription plan catalog.
- `GET /api/v1/saas/super-admin/invoices`: SaaS subscription invoices (separate from patient bills).
- `POST /api/v1/saas/super-admin/jit-access/request`: Request temporary support access to tenant.
- `GET /api/v1/saas/super-admin/jit-access/requests`: List JIT support requests.
- `POST /api/v1/saas/super-admin/announcements`: Broadcast maintenance or feature notice.
- `GET /api/v1/saas/super-admin/announcements`: Active announcements list.

## 3. Hospital Admin SaaS Subscription & Billing
- `GET /api/v1/saas/tenant/subscription`: Current plan, renewal date, and license status.
- `GET /api/v1/saas/tenant/usage`: Live consumption vs limits (staff, patients, storage).
- `GET /api/v1/saas/tenant/invoices`: View and download platform subscription tax invoices.
- `POST /api/v1/saas/tenant/jit-access/:requestId/approve`: Approve time-limited platform support access.
- `POST /api/v1/saas/tenant/data-export`: Request self-service encrypted tenant archive (JSON/CSV).

## 4. Payment Gateway Webhook
- `POST /api/v1/saas/webhooks/payment`: Signed webhook handler with idempotency deduplication.

