# ASRTAVA Threat Model & STRIDE Risk Assessment

## 1. Scope & Methodology

This threat model assesses the attack surfaces of the ASRTAVA Multi-Tenant Hospital Management System using the **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) combined with healthcare-specific threat scenarios under the OWASP Top 10 API Security 2023.

---

## 2. STRIDE Assessment Matrix

| Threat Category | Primary Target | Potential Attack Vector | Hardened Mitigation in ASRTAVA | Residual Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing Identity** | Staff & Patient Portals | Credential stuffing, brute force, stolen mobile session tokens | Salted high-cost password hashing, progressive login delays, account lockout after 5 attempts, RFC 6238 TOTP MFA, token family rotation with automated reuse detection. | **Low** |
| **Tampering with Data** | Clinical Consultations, Prescriptions, Financial Invoices | Parameter tampering, cross-tenant ID injection, database direct SQL injection | Parameterized Knex/PG queries, AST-controlled query builder, immutable clinical audit logs with SHA-256 hash chaining, database triggers blocking UPDATE/DELETE on audit trails. | **Very Low** |
| **Repudiation** | Doctor E-Prescriptions, Controlled Drug Dispense | Staff denying they ordered/dispensed narcotics or altered patient vitals | Immutable `clinical_audit_events` ledger logging actor ID, role at execution, IP address, user agent, before/after JSON states, and cryptographic verification. | **Very Low** |
| **Information Disclosure** | Medical Records, Lab Results, Financial Ledgers | Broken Object Level Authorization (BOLA/IDOR), cross-tenant leakage, unmasked exports | Strict PostgreSQL Row-Level Security (`current_tenant_id`), `TenantIsolationGuard` validating object tenant ownership, automatic de-identification and data masking for unprivileged queries. | **Low** |
| **Denial of Service** | Public APIs, Webhook Ingress, Report Generation | API flooding, heavy analytical SQL exhaustion, webhook amplification attacks | IP rate-limiting (`express-rate-limit`), async queue-based report generation with 24h expiring presigned links, webhook payload signature checks before queuing. | **Low** |
| **Elevation of Privilege** | Hospital Admin, Platform Support | Horizontal tenant hopping, vertical escalation from staff to Super Admin | Centralized RBAC + individual custom permission overrides where explicit DENY takes absolute precedence, JIT Support protocol requiring hospital authorization. | **Very Low** |

---

## 3. High-Priority Threat Scenarios & Mitigations

### Scenario A: Broken Object Level Authorization (BOLA/IDOR)
- **Threat**: Doctor in Hospital A alters patient URL from `.../patients/pat-tenant-a-1` to `.../patients/pat-tenant-b-9` to inspect foreign patient health data.
- **Defense**: `TenantIsolationGuard.verifyResourceTenantOwnership` checks that the requested entity's `hospital_id` strictly matches the verified session `token.hospitalId`. If a discrepancy is found, an immediate `403 Forbidden` is returned, and a `security_incidents` record with category `cross_tenant_attempt` is logged.

### Scenario B: Refresh Token Replay / Theft
- **Threat**: An adversary intercepts a mobile refresh token over an unpinned public network and attempts to exchange it for an access token after the legitimate client has rotated it.
- **Defense**: `SessionSecurityService.rotateRefreshToken` evaluates the token family. When an already-rotated token hash is presented, it flags a **Critical Token Replay Attack**, invalidates the entire token family across all user devices, and records an emergency security alert.

### Scenario C: Malicious or Coerced Record Deletion
- **Threat**: An insider or compromised credential issues a DELETE request on diagnostic lab reports or clinical consultation notes.
- **Defense**: All clinical tables enforce append-only amendment workflows. Deletions are forbidden by database triggers on audit trails, and DPDP erasure requests evaluate statutory retention (NMC RMP 2023 requires 3-year minimum retention for adults, 21 years for minors), marking files as `legal_hold_retained`.

