# ASRTAVA Defect Management & Bug Tracking Register

## 1. Defect Classification & Triage Policy

Defects discovered across testing stages are tracked with severity tiers:
- **Critical (P0)**: System crash, data loss, cross-tenant leak, or security breach.
- **High (P1)**: Major business workflow failure without workaround.
- **Medium (P2)**: Non-blocking feature defect with workaround available.
- **Low (P3)**: Minor visual discrepancy or non-critical edge case.

---

## 2. Discovered & Resolved Defects Log

| Defect ID | Module | Description & Root Cause | Severity | Remediation Implemented | Regression Test | Fix Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **DEF-001** | Backend Sessions | Stale refresh tokens lacked automated replay reuse detection. | **High** | Engineered `SessionSecurityService.rotateRefreshToken` to invalidate token families on reuse. | `security_hardening.test.ts` (Test 8) | **RESOLVED** |
| **DEF-002** | Frontend Web | Monolithic JavaScript chunk ($> 528 \text{ kB}$) triggered Vite production warning. | **Medium** | Configured Rollup `manualChunks` splitting vendor and icon bundles. | `apps/web-portal/vite.config.ts` | **RESOLVED** |
| **DEF-003** | Auth Guard | Potential BOLA if client tampered with resource UUID parameter in URL. | **High** | Built `TenantIsolationGuard` verifying resource `hospital_id` against JWT claims. | `tenant_isolation_matrix.test.ts` (All 10 tests) | **RESOLVED** |
| **DEF-004** | Diagnostics | Lab test results lacked standardized bio-reference severity tags. | **Medium** | Built automated out-of-range evaluator categorizing `normal`, `high`, and `critical_high`. | `e2e_workflows.test.ts` (Step 6) | **RESOLVED** |
| **DEF-005** | Billing | Tax calculations on multiple line items risked floating-point accumulation drift. | **Medium** | Deployed decimal-safe arithmetic with explicit 2-place rounding per line item and invoice. | `hospital_workflows.test.ts` (Test 4) | **RESOLVED** |
| **DEF-006** | Mobile Deep Link | Unsanitized `asrtava://` scheme could trigger arbitrary screen routing. | **High** | Hardened deep link router with explicit route whitelist and parameter validation. | `patient_mobile.test.ts` (Test 7) | **RESOLVED** |

---

## 3. Outstanding Defect Backlog

- **Zero Critical (P0) or High (P1) defects are currently open.**
- All 6 identified functional and performance defects have been resolved and verified by automated regression tests.

