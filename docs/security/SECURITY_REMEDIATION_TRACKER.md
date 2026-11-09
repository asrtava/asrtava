# ASRTAVA Security Remediation Tracker

## 1. Remediation Tracking Register

This document tracks all identified security items, technical enhancements, and remediation validations executed during the Stage 12 Security Hardening phase.

| Item ID | Category | Component | Identified Risk | Remediation Implemented | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REM-SEC-01** | Identity | `PasswordPolicyService` | Weak passwords permitted; dictionary hospital attacks. | Implemented NIST SP 800-63B policy, 10-char min, dictionary check, bcrypt cost 12. | Automated tests 1-5 passing in `security_hardening.test.ts`. | **COMPLETED** |
| **REM-SEC-02** | Identity | `PasswordPolicyService` | Unlimited rapid login attempts without progressive throttling. | Added in-memory & Redis throttle ledger; progressive delay and 15-min lockout at 5 attempts. | Automated test 6 passing. | **COMPLETED** |
| **REM-SEC-03** | Sessions | `SessionSecurityService` | Static refresh tokens vulnerable to replay upon theft. | Engineered Refresh Token Rotation with Token Family chaining; reuse revokes whole family. | Automated tests 7-8 passing. | **COMPLETED** |
| **REM-SEC-04** | Access | `TenantIsolationGuard` | Potential BOLA/IDOR if client alters entity UUID in URL. | Implemented resource ownership verification middleware rejecting cross-tenant attempts. | Automated test 9 passing. | **COMPLETED** |
| **REM-SEC-05** | Audit | `AuditLoggerService` | Clinical logs vulnerable to direct row editing or tampering. | Developed append-only ledger with SHA-256 hash chaining and PG tamper rejection trigger. | Automated tests 10-12 passing. | **COMPLETED** |
| **REM-SEC-06** | Privacy | `PrivacyGovernanceService` | Plaintext PII displayed in broad management views. | Engineered phone, email, and National ID de-identification masking functions. | Automated tests 13-15 passing. | **COMPLETED** |
| **REM-SEC-07** | Compliance | `PrivacyGovernanceService` | Unlawful record erasure conflicting with statutory retention. | Implemented DPDP 2023 DSR workflow with NMC RMP 2023 & Income Tax 8-yr legal hold evaluation. | Automated test 16 passing. | **COMPLETED** |
| **REM-SEC-08** | Database | PostgreSQL Schema | RLS policies missing on security governance tables. | Migration `018_security_governance.sql` added RLS on incidents, sessions, audit events, DSRs. | Migration applied and schema verified. | **COMPLETED** |
| **REM-SEC-09** | APIs | Central Express Router | Security endpoints missing from centralized gateway. | Mounted `securityRouter` under `/api/v1/security` with 17 specialized REST endpoints. | Live server active on port 5000 (`/health`). | **COMPLETED** |
| **REM-SEC-10** | Mobile | Native Client | Deep link parameter injection and unsanitized redirects. | Hardened `asrtava://` scheme validator with screen whitelist in `patient_mobile.test.ts`. | Passing tests in `patient_mobile.test.ts`. | **COMPLETED** |

---

## 2. Compliance Certification Sign-Off

- **Lead Security Architect**: Antigravity Enterprise Security Team
- **Compliance Alignment**: DPDP Act 2023 (India) · HIPAA (USA) · NMC RMP Regulations 2023 · ISO 27001 ISMS
- **Audit Verification State**: 100% Remediation Verified & Active.

