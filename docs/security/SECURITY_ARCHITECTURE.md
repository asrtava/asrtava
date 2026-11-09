# ASRTAVA Security Architecture & Defense-in-Depth Specification

## 1. Executive Security Blueprint

ASRTAVA is an enterprise multi-tenant SaaS Hospital Management System (HMS) architected upon **Zero-Trust principles**, **Defense-in-Depth layers**, and strict **Least Privilege** access controls. Because ASRTAVA processes Protected Health Information (PHI) and Sensitive Personal Data (SPD), every communication boundary, persistence volume, and computational tier enforces cryptographic validation and tenant isolation.

```
+-----------------------------------------------------------------------------------+
|                              Client Presentation Layer                            |
|  - Web Portal (Vite React + Strict CSP)     - Patient Native Mobile (iOS/Android) |
|  - Role-Specific Portals (10 Workspaces)     - Secure Keystore/Keychain Storage    |
+-----------------------------------------------------------------------------------+
                                        | (HTTPS / TLS 1.3 Strict Transport Security)
+-----------------------------------------------------------------------------------+
|                           Perimeter & API Gateway Layer                           |
|  - Rate Limiting (express-rate-limit)        - OWASP Helmet Security Headers      |
|  - CORS Origin Lock                          - Request-ID Distributed Tracing     |
+-----------------------------------------------------------------------------------+
                                        |
+-----------------------------------------------------------------------------------+
|                     Identity, Authentication & Session Gateway                    |
|  - High-Cost Password Hashing (Cost 12)      - Progressive Login Throttling       |
|  - RFC 6238 TOTP Multi-Factor Auth           - Refresh Token Family Rotation      |
|  - Automated Replay Reuse Detection Engine   - Device Fingerprint Verification    |
+-----------------------------------------------------------------------------------+
                                        |
+-----------------------------------------------------------------------------------+
|                        Tenant & Authorization Control Engine                      |
|  - Multi-Tenant Isolation Guard              - Anti-BOLA / Anti-IDOR Interceptors |
|  - Explicit Individual DENY Precedence Engine - Zero-Standing-Privilege JIT Guard  |
+-----------------------------------------------------------------------------------+
                                        |
+-----------------------------------------------------------------------------------+
|                        Data Persistence & Cryptographic Layer                     |
|  - PostgreSQL Row-Level Security (RLS)       - AES-256-GCM Envelope Encryption    |
|  - Append-Only SHA-256 Audit Blockchain      - DPDP Consent & Statutory Retention |
+-----------------------------------------------------------------------------------+
```

---

## 2. Zero-Trust Architectural Tenets

1. **Verify Explicitly**: Every inbound request—regardless of whether it originates from the public internet or an internal microservice—must provide an authenticated cryptographic JWT or HMAC signature with valid claims.
2. **Use Least Privilege Access**: Users are granted only the canonical privileges required for their assigned workspace. Broad platform administrators have no standing access to clinical records.
3. **Assume Breach**: Systems, memory regions, and networks are designed with containment boundaries. Token replay attempts trigger automatic termination of entire token families.
4. **Data Isolation by Default**: All persistence queries execute under explicit tenant context (`SET LOCAL app.current_tenant_id = ?;`) with PostgreSQL RLS policies enforcing physical database isolation.

---

## 3. Cryptographic Key Hierarchy & Encryption Standards

| Tier | Standard | Implementation Details | Key Management |
| :--- | :--- | :--- | :--- |
| **Data in Transit** | TLS 1.3 / HTTPS | ECDHE-ECDSA-AES256-GCM-SHA384 with HSTS (`max-age=31536000; includeSubDomains`) | Automated ACME Let's Encrypt / AWS ACM |
| **Data at Rest** | AES-256-GCM | Encrypted PostgreSQL storage volumes, encrypted document storage buckets | AWS KMS / Cloud KMS with annual automated rotation |
| **Credential Vault** | AES-256-GCM | Integration secrets and API tokens encrypted with unique IVs and authenticated tags | Master Key held in environment secrets / KMS envelope |
| **Password Hashing** | Bcrypt (Cost 12) | Salted, resistant to ASIC/GPU rainbow-table attacks | Per-user cryptographic salt generation |
| **Token Signatures** | HMAC-SHA256 | Ephemeral access tokens (1h expiry), single-use refresh tokens | Ephemeral JWT secret with secure rotation |
| **Audit Trails** | SHA-256 Chained | Merkle-style sequential block linking (`GENESIS_BLOCK` -> sequential checksums) | Unalterable append-only ledger protected by PG triggers |

---

## 4. Zero-Standing-Privilege JIT Platform Support

To prevent insider threat and satisfy **HIPAA §164.312(a)** and **DPDP Act 2023 Section 8**, platform Super Admins have zero continuous standing access to clinical records:
- Access to clinical routes (`/api/v1/clinical/*`, `/api/v1/patients/*`) by a Super Admin requires an active, approved Just-In-Time (JIT) support session.
- Hospital Administrators must explicitly approve JIT requests with a predefined time limit (maximum 30-60 minutes).
- Every query performed during a JIT session is logged into the immutable append-only `clinical_audit_events` ledger with `actor_type: 'super_admin_support'`.

