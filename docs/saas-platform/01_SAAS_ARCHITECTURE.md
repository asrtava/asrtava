# ASRTAVA SaaS Platform Architecture

## 1. System Vision & Multi-Tenant Topology
ASRTAVA is designed as a centralized multi-tenant Healthcare SaaS operating model. One single deployment of the core backend engine powers multiple independent hospital networks, specialized clinics, and trauma centers.

```
+------------------------------------------------------------------------+
|                      ASRTAVA Cloud Platform Gateway                    |
|       (Cloudflare Edge WAF, Rate Limiting, SSL Termination, DNS)       |
+------------------------------------+-----------------------------------+
                                     |
+------------------------------------+-----------------------------------+
|               ASRTAVA Centralized Node.js API Monolith                 |
|  - Public SaaS Registration & Onboarding Engine                        |
|  - Platform Super Admin SaaS Console                                   |
|  - Centralized Feature Entitlement & Plan Restrictions                 |
|  - Usage Metering, Quota Alerts & Soft/Hard Limits                     |
|  - SaaS Subscription Billing Engine (Strictly Separate from Patients) |
|  - Zero-Standing-Privilege Just-In-Time (JIT) Support Access Engine    |
|  - Payment Gateway Webhook Deduplication & Idempotency Filter          |
+------------------------------------+-----------------------------------+
                                     |
+------------------------------------+-----------------------------------+
|               PostgreSQL 15+ Multi-Tenant Cluster                     |
|  - Tenant Partitioning: app.current_tenant_id + Row-Level Security     |
|  - Platform vs Tenant Authorization Separation                         |
|  - Immutable Audit Ledgers & Asynchronous Data Portability Archives    |
+------------------------------------------------------------------------+
```

## 2. Core Separation Principles
1. **Separation of Platform Authorization vs Hospital Roles**:
   - Platform roles (`PLATFORM_SUPER_ADMIN`, `PLATFORM_SUPPORT_AGENT`, `PLATFORM_BILLING_ADMIN`) live in dedicated platform tables (`platform_users`, `platform_roles`, `platform_permissions`).
   - Platform roles CANNOT be used to log in as hospital doctors, nurses, or receptionists.
2. **Financial Isolation**:
   - SaaS Subscription Invoices (`subscription_invoices`) bill hospitals for platform licenses, bed tiers, and cloud storage.
   - Hospital Patient Bills (`invoices`, `patient_bills`) bill patients for OPD consultations, IPD ward stays, pharmacy drugs, and laboratory tests.
   - Financial ledgers, tax compliance accounts, and receipt numbers never intersect.
3. **Clinical Non-Repudiation**:
   - Hospital patients, medical records, e-prescriptions, and laboratory reports are encrypted and strictly isolated under PostgreSQL Row-Level Security (RLS).
   - Super Admins have zero automatic standing read access to patient clinical records. Support access requires explicit, time-bounded Hospital Administrator approval.

