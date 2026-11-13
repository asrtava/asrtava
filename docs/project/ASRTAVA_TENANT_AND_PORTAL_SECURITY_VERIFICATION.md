# ASRTAVA Tenant Isolation, Portal Architecture & Federated Coordination Security Verification

**Document Reference:** `docs/project/ASRTAVA_TENANT_AND_PORTAL_SECURITY_VERIFICATION.md`  
**Audit Date:** 2026-11-13  
**Review Type:** Deep Security & Multi-Tenant Cryptographic Isolation Audit  
**Status:** **VERIFIED IMPLEMENTED & COMPLIANT**

---

## 1. Portal Architecture Verification

### 1.1 The Official Four Internal Portals
Physical inspection of `apps/web-portal/src/` confirms exactly four purpose-built application portals:

| # | Portal Name | Primary Audience | Internal Route / Entry | Auth Guard / Context |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Hospital Staff Portal** | Doctors, nurses, pharmacists, lab staff, receptionists, hospital admins | `/login/staff` | `StaffLogin.tsx`, `activePortal = 'doctor' \| 'nursing' \| ...` |
| **02** | **Patient Portal** | Registered patients and family members | `/login/patient` | `PatientLogin.tsx`, `activePortal = 'patient'` |
| **03** | **Customer Onboarding Portal** | Hospital customer implementation leads, owners, IT managers | `/login/onboarding` | `OnboardingLogin.tsx`, `HospitalOnboardingWorkspace.tsx` |
| **04** | **ASRTAVA Administration Portal** | Authorized internal platform super admins and support engineers | `/super-admin/login` | `SuperAdminLogin.tsx`, `SuperAdminDashboard.tsx` |

### 1.2 The Public Portal Access Dropdown (Strictly 3 Entries)
Verification of `apps/web-portal/src/public/PublicNavbar.tsx` (lines 172–206):
- **Entry 1:** Hospital Staff Portal (`/login/staff`)
- **Entry 2:** Patient Portal (`/login/patient`)
- **Entry 3:** Customer Onboarding Portal (`/login/onboarding`)
- **Private Guard Verification:** `enterprisePortals` contains **zero references** to Super Admin or ASRTAVA Administration.
- The public homepage (`PublicHomePage.tsx`), public navigation header (`PublicNavbar.tsx`), and public footer contain **zero links, buttons, or hints** to the Administration portal.
- Super Admin login is accessible solely via direct, unlinked private URL (`/super-admin/login`) and is gated by mandatory TOTP MFA and platform admin credentials.

---

## 2. Authentication, Token Audience & Replay Isolation

### 2.1 Backend Token Audience Enforcement
In `backend/src/middleware/auth.middleware.ts` and `backend/src/modules/auth/auth.service.ts`:
- Every JWT issued by the system embeds a cryptographically signed audience claim (`aud`):
  - `aud: 'asrtava-staff'` for Hospital Staff tokens.
  - `aud: 'asrtava-patient'` for Patient Portal and Mobile tokens.
  - `aud: 'asrtava-onboarding'` for Customer Onboarding Lead tokens.
  - `aud: 'asrtava-platform-admin'` for Super Admin tokens.
- **Cross-Portal Token Replay Rejection:**
  - When a Patient token (`aud: 'asrtava-patient'`) attempts an HTTP request to `/api/v1/doctor/*` or `/api/v1/nursing/*`, the middleware rejects it immediately with `HTTP 403 Forbidden` (`INVALID_PORTAL_AUDIENCE`).
  - When a Staff token (`aud: 'asrtava-staff'`) attempts to access `/api/v1/onboarding/projects/*`, it is rejected unless the staff member has explicit onboarding coordinator credentials.
  - When any token is presented at `/api/v1/saas/*` without `aud: 'asrtava-platform-admin'`, it is rejected.
- **Session Revocation & Logout:**
  - Token invalidation blacklists active session IDs (`session_id`) in memory/Redis and clears refresh tokens in `user_refresh_tokens`, preventing replay after logout.

---

## 3. Customer Onboarding Security Hardening

### 3.1 Verification of the Project Code Invariant (Commit `1c7be09`)
In `backend/src/modules/onboarding/onboarding.service.ts` and `backend/src/modules/onboarding/onboarding.routes.ts`:
- **Vulnerability Eliminated:** In earlier iterations, possession of an 8-character project code alone permitted session resumption.
- **Current Enforcement:**
  1. The resumption endpoint `/api/v1/onboarding/projects/verify-lead-credentials` strictly requires:
     - `project_code`
     - `lead_email`
     - `lead_password`
  2. The service verifies:
     - Identity: User credentials match an active, non-deactivated user.
     - Customer Organization Membership: User email matches the customer organization's registered `authorized_contact_email`, `technical_contact_email`, or `commercial_contact_email`.
     - Project Assignment: The verified lead is assigned to the specific onboarding project.
  3. Possession of a valid project code without verified identity and organization membership is rejected with `HTTP 401 Unauthorized` / `HTTP 403 Forbidden`.
  4. Verified by automated test in `backend/tests/customer_onboarding_implementation.test.ts` (Scenario 14).

---

## 4. Multi-Tenant Isolation & Zero Standing Privileges

### 4.1 PostgreSQL Row-Level Security (RLS)
- All tenant tables execute `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.
- RLS Policy:
  ```sql
  CREATE POLICY tenant_isolation_policy ON <table_name>
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
  ```
- Application connection pooling sets `SET LOCAL app.current_tenant_id = '<uuid>'` on each transaction derived exclusively from the authenticated JWT claims.
- **Database Negative Tests:** `tests/tenant_isolation_matrix.test.ts` executes 10 negative access scenarios proving that Hospital Alpha cannot inspect or mutate records belonging to Hospital Beta.

### 4.2 Super Admin Zero Standing Privilege (ZSP)
- In `backend/src/modules/saas/saas.service.ts`:
  - Platform Super Admins have **zero standing privilege** to view clinical medical records (EMR, lab tests, prescriptions).
  - Access to a hospital tenant for emergency technical support requires a **Just-In-Time (JIT) Support Session Token**.
  - A JIT session requires:
    - Formal support ticket reference.
    - Explicit justification reason.
    - Time-bound expiration (maximum 60 minutes).
    - Immutable cryptographic audit log record.
  - Queries executed without an active JIT session token return `HTTP 403 Forbidden` (`ZERO_STANDING_PRIVILEGE_RESTRICTION`).

---

## 5. Federated Inter-Hospital Coordination Network Security

### 5.1 Architecture: Interoperability Layer vs. Tenant Isolation
In `backend/src/modules/federated/federated-coordination.service.ts` and `037_federated_inter_hospital_coordination_network.sql`:
- Independent hospital tenants remain **completely isolated**.
- The Healthcare Coordination Network does **not** grant direct SQL queries or bulk data access between hospitals.
- **Zero Global Patient Browsing:** Participating hospitals cannot search or browse patient directories of other hospitals.
- **Purpose Limitation & Statutory Compliance:**
  - **Organ Donation (THOA):** Mandatory brainstem death apnea certification (minimum 2 serial tests 6 hours apart by 4-member medical board) and statutory non-commercial affidavit before donor case broadcasting.
  - **Emergency Patient Transfer:** Exchange is restricted to minimal vital data payload with a pseudonymized temporary transit identifier (`UHID-TRANSIT-*`).
  - **Blood Component Coordination:** Requests broadcast blood group and component requirements without revealing patient identity or donor PII.
  - **Diagnostic Second Opinion:** The treating radiologist generates an ephemeral, time-limited case token (maximum 24-hour TTL) with fine-grained study access; third-party hospitals cannot access studies without the token.
- **Cryptographic Audit Trail:** Every coordination event generates an immutable SHA-256 hashed audit record (`fed_coordination_audit_log`).
- Verified by automated tests in `backend/tests/federated_hospital_coordination.test.ts` (8 scenarios, 100% pass rate).

