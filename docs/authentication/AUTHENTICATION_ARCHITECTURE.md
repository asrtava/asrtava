# ASRTAVA — Authentication Architecture

## 1. Overview
ASRTAVA employs a **Centralized Identity & Multi-Tenant Authorization Model**. User identity is decoupled from tenant membership: a single user identity can belong to multiple hospitals, hold different role assignments within each hospital, and seamlessly switch workspaces without re-authenticating.

```
                              ASRTAVA Central Identity (users)
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      Platform Authority            Hospital Memberships            Patient Identity
      (Super Admin Tier)            (Multi-Tenant Staff)            (Web + Mobile App)
               │                            │                            │
   Isolated Console Access         Role & Dept Assignments          Medical Records
   No default patient access        Dual-Layer Authorization       Self-Care Services
```

---

## 2. Core Entities & Database Mapping

| Entity | Purpose | Storage & Security |
| :--- | :--- | :--- |
| **User Identity** (`users`) | Central account profile across platform | Email/phone, password hash, lockout tracking |
| **Hospital Membership** (`hospital_memberships`) | Tenant relationship & active status | Tenant isolation, status (`active`, `suspended`) |
| **Role Assignments** (`user_roles`) | RBAC role binding per hospital | Scoped to hospital tenant |
| **Individual Overrides** (`user_permissions`) | Custom explicit ALLOW or DENY overrides | Precedence engine: Explicit DENY > Explicit ALLOW > RBAC |
| **Sessions** (`user_sessions`) | Active session tracking with rotation | Rotated refresh token hashes, portal context |
| **MFA Credentials** (`user_mfa`) | RFC 6238 TOTP secrets & backup codes | Base32 secret, 10 bcrypt-hashed recovery codes |
| **Device Registrations** (`user_devices`) | Mobile app push & biometric binding | Android Keystore / iOS Keychain binding |
| **Security Audit** (`auth_audit_logs`) | Tamper-evident authentication audit trail | IP, user agent, event type, timestamp |

---

## 3. Login Entry Points

1. **Super Admin Login** (`/super-admin/login`):
   - Restricted to platform operators (`user_type = 'super_admin'`).
   - Mandatory TOTP multi-factor authentication.
   - Platform telemetry, subscription billing, and hospital onboarding.
   - **Clinical Isolation**: Super Admin cannot access patient medical records without an approved, time-limited, audited platform support session.

2. **Hospital Admin Login** (`/hospital/login`):
   - Access for Hospital Owners, Chief Executives, and System Administrators.
   - Multi-hospital tenant resolution: prompts with hospital selection if user manages multiple facilities.
   - Staff directory, shift roistering, billing configuration, department queues.

3. **Common Staff Login** (`/staff/login`):
   - Common single sign-on entry for all 12 staff roles (Doctor, Nursing, Reception, Pharmacy, Laboratory, Radiology, Finance, HR, Inventory).
   - Dynamically resolves assigned roles and authorized workspaces.
   - Multi-role workspace switcher in top navigation revalidates permissions on the server.

4. **Patient Login** (`/patient/login`):
   - Unified identity for Patient Web Portal and React Native Mobile Application.
   - Login via Mobile phone or Email + Password or SMS OTP.
   - India DPDP 2023 certified encrypted medical data repository.

---

## 4. Key Security Controls

- **Password Policy**: Enforces minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character. Hashed using `bcrypt` with cost factor 12.
- **Account Lockout**: 5 failed login attempts trigger a 15-minute progressive lockout (`locked_until`).
- **Token Breach Detection**: If a revoked refresh token is re-attempted, the server triggers an automatic security breach alarm, revokes all active sessions for the user, and records a security audit log.
- **Tenant Context Enforcement**: PostgreSQL Row-Level Security (RLS) is strictly enforced via `withTenantContext()` and `current_app_tenant()`.

