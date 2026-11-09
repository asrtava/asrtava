# ASRTAVA System-Wide Security & Compliance Verification Matrix

## 1. Security Testing Methodology
Validates application-wide negative security boundaries, zero-trust controls, cryptographic audit trails, and data isolation.

| Threat / Negative Scenario | Expected Defense / Security Gate | Verification Status |
| :--- | :--- | :---: |
| Cross-tenant clinical record access | PostgreSQL Row-Level Security blocks query | **VERIFIED** |
| Cross-tenant appointment tampering | Concurrency locks bound to tenant_id reject update | **VERIFIED** |
| Super Admin inspecting patient EMR | Blocked without approved, time-bound JIT support session | **VERIFIED** |
| Role elevation / Privilege bypass | Precedence hierarchy enforces: DENY > ALLOW > Role > Default Deny | **VERIFIED** |
| Audit log tampering / Deletion | Append-only SHA-256 Merkle chain detects block alteration | **VERIFIED** |
| Unauthenticated WebRTC session | HMAC-SHA256 session token with 60m TTL required | **VERIFIED** |
| Unauthorized Narcotic administration | Single nurse sign-off rejected; dual cosign mandatory | **VERIFIED** |
| Self-cosigning high-alert drug | `administeringNurseId === cosigningNurseId` rejected with 403 | **VERIFIED** |
| Unverified CAPA closure | Department assignee closure blocked; independent QA sign-off required | **VERIFIED** |
| Protected Health Info in Analytics | HMAC-SHA256 salted pseudonymization eliminates PII in EDW cubes | **VERIFIED** |
| Negative inventory dispensing | FEFO engine rejects dispense exceeding batch balance | **VERIFIED** |
| Unbalanced financial journal entry | General Ledger rejects voucher when $\sum \text{Dr} \neq \sum \text{Cr}$ | **VERIFIED** |
| SQL Injection in custom report | Whitelisted column mappings and parameterized queries reject injection | **VERIFIED** |
| Expired AMC license lockout | Perpetual core license never expires; offline air-gapped claim validates | **VERIFIED** |

