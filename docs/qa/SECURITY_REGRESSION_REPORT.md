# ASRTAVA Security Regression & Vulnerability Defense Test Report

## 1. Executive Summary

All security mitigations implemented during Stage 12 have been locked into the automated regression test suite (`backend/tests/security_hardening.test.ts`), running on every CI/CD execution to prevent security regressions.

---

## 2. Regression Test Results

| Attack Vector / Defense | Automated Test Assertion | Verification Mechanism | Result |
| :--- | :--- | :--- | :---: |
| **Weak Password Injection** | Reject passwords $< 10$ characters or lacking complexity | NIST SP 800-63B evaluator | **PASSED** |
| **Dictionary Credential Stuffing**| Reject common hospital words (`Hospital@123`, `Doctor2026`) | Blacklist hash matcher | **PASSED** |
| **Brute-Force Account Attacks** | Exponential progressive delay + 15-minute lockout at 5 failures | `PasswordPolicyService.checkLoginThrottle` | **PASSED** |
| **Refresh Token Replay / Theft**| Presenting an already rotated token revokes entire token family | `SessionSecurityService.rotateRefreshToken` | **PASSED** |
| **Broken Object Level Auth (BOLA)**| Requesting entity from foreign hospital tenant | `TenantIsolationGuard` -> 403 Forbidden | **PASSED** |
| **Audit Ledger Tampering** | Payload byte modification breaks SHA-256 chain | `AuditLoggerService.verifyChainIntegrity` | **PASSED** |
| **PII Data Exposure** | Phone, email, National ID displayed unmasked | Masking functions (`maskPhone`, `maskEmail`) | **PASSED** |
| **Illegal Record Deletion** | DPDP erasure request targeting mandatory clinical/tax data | `PrivacyGovernanceService` -> `legal_hold_retained` | **PASSED** |
| **SQL Injection** | Malicious injection in report filters (`' OR '1'='1`) | Controlled AST Query Builder | **PASSED** |
| **Timing Side-Channel Attacks** | Timing discrepancy on webhook HMAC comparison | `crypto.timingSafeEqual` | **PASSED** |

---

## 3. Regression Invariants

- **Never Weaken Security**: Automated tests assert that security checks fail closed (Default Deny).
- **Incident Dispatch Verification**: Verified that critical security failures (such as replay attacks) automatically trigger an unhandled security incident row in `security_incidents`.

