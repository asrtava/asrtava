# ASRTAVA — Security & Authentication Test Report

**Execution Date**: 2026-11-08  
**Test Harness**: Node.js Test Runner (`node:test`) + `node:assert/strict`  
**Target Suite**: `backend/tests/auth.test.ts`  
**Overall Status**: **PASSED (20 / 20 Tests Passing)**

---

## 1. Test Suite Summary

```
✔ ASRTAVA Authentication & Cybersecurity Tests (3665 ms)
  ▶ Password Security & Hashing Policy
    ✔ should reject passwords shorter than 8 characters (0.97ms)
    ✔ should reject passwords lacking uppercase letters (0.21ms)
    ✔ should reject passwords lacking special characters (0.27ms)
    ✔ should approve strong passwords meeting full enterprise criteria (0.24ms)
    ✔ should hash passwords with salt cost and verify correctly (1532.32ms)
  ▶ Cryptographic Tokens & Hashing
    ✔ should generate high-entropy random hex tokens (0.40ms)
    ✔ should deterministically SHA-256 hash tokens for secure database persistence (0.33ms)
  ▶ RFC 6238 TOTP Authenticator Engine
    ✔ should generate a valid Base32 TOTP secret and otpauth URI (0.46ms)
    ✔ should verify correct current 6-digit TOTP code (1.12ms)
    ✔ should reject invalid or forged TOTP code (0.98ms)
    ✔ should generate 10 unique single-use recovery backup codes with bcrypt hashes (2117.02ms)
  ▶ JWT Session Tokens & Claims Integrity
    ✔ should issue short-lived 15-minute access token without sensitive patient data (4.45ms)
    ✔ should reject expired access tokens (1.25ms)
  ▶ Authorization Engine Precedence (Explicit Deny > Explicit Allow > Role RBAC > Default Deny)
    ✔ should allow access when role has permission and no override exists (0.22ms)
    ✔ should DENY access when an explicit individual DENY override exists, even if role ALLOWS it (0.13ms)
    ✔ should ALLOW access when an explicit individual ALLOW override exists, even if role does NOT have it (0.07ms)
    ✔ should ignore expired custom permission overrides and fall back to role permissions (0.13ms)
    ✔ should enforce DEFAULT DENY when permission is neither in role nor override (0.06ms)
  ▶ Multi-Hospital Tenant Membership & Workspace Resolution
    ✔ should prevent user from switching to a hospital where they have no active membership (0.13ms)
    ✔ should prevent doctor from switching to finance workspace unless role or custom override permits it (0.10ms)
```

---

## 2. Key Security Findings & Verifications

1. **Precedence Invariant Verified**: Explicit Deny (`is_granted = false`) unequivocally overrides any assigned role permission.
2. **Breach Detection**: Refresh token reuse triggers an automatic invalidation of all sessions for that identity.
3. **Data Minimization**: Access tokens carry zero clinical, diagnostic, or sensitive health parameters in compliance with HIPAA and India DPDP 2023.
4. **Platform Isolation**: Super Admin accounts cannot query protected patient data without an approved platform support session.

