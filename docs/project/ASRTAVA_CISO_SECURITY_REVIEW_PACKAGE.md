# ASRTAVA Cybersecurity & Data Protection Review Package
## Chief Information Security Officer (CISO) & Data Protection Officer Submission

**Document Reference:** `SEC-CISO-PHASE2-2026-FINAL`  
**Submission Date:** November 13, 2026  
**Audience:** Chief Information Security Officer (CISO), Data Protection Officer (DPO), Enterprise Security Architect  
**Purpose:** Comprehensive Technical Security, Cryptographic Audit & Privacy Review for Hospital Pilot  
**Security Clearance Status:** **SUBMITTED FOR CISO REVIEW & FORMAL SIGN-OFF**

---

### 1. Executive Summary & Security Posture

ASRTAVA has been architected under Zero Trust principles, complying with the Digital Personal Data Protection (DPDP) Act 2023, ISO 27001, and Indian CERT-In guidelines.

Key security controls verified:
1. **Multi-Tenant Row-Level Isolation:** Verified across 44 test suites with zero cross-hospital data bleed (`tenant_isolation_matrix.test.ts`).
2. **Individual DENY Precedence:** Explicit security denials permanently override any role permissions or clinical continuity allowances (`clinical_safety_p0.test.ts`).
3. **Cryptographic Tamper-Resistant Audit Logging:** Chained SHA-256 Merkle audit blocks provide mathematical proof of non-repudiation.
4. **End-to-End Cryptography:** AES-256-GCM authenticated encryption for database backups and offline air-gap journals; TLS 1.3 for in-transit network traffic.
5. **Separation of External Integrations:** Production ABDM and external payment gateways remain locked behind verified sandboxes until formal third-party compliance certification is obtained.

---

### 2. Architectural Security Controls Breakdown

#### Control 1: Multi-Tenant Row-Level Security (RLS)
- **Database Level:** Migration `036_tenant_row_level_security.sql` implements PostgreSQL Row-Level Security (RLS) enforcing `tenant_id = current_setting('app.current_hospital_id')`.
- **Application Level:** Middleware verifies JWT claims and injects tenant context on every incoming API request.
- **Negative Testing:** Hospital Alpha administrators or clinicians are strictly blocked from browsing, querying, or modifying Hospital Beta records, including appointments, laboratory orders, pharmacy stock, and staff rosters.

#### Control 2: Portal Audience Isolation & Individual DENY
- **Four Distinct Internal Portals:** Doctor Portal, Nursing Inpatient Portal, Hospital Admin Portal, and Super Admin Platform Portal.
- **Audience Verification:** JWT tokens are scoped to portal audience (`aud: 'portal:doctor'`, etc.). Cross-portal token injection is rejected with HTTP 403 Forbidden.
- **Individual DENY Precedence:** If an individual employee has an active suspension or explicit `DENY` entry for a module, the denial takes absolute precedence, immediately revoking access regardless of role hierarchy.

#### Control 3: Cryptographic Audit Chaining (Merkle Trees)
- **Chained Hashes:** Every clinical update, eMAR administration, and conflict resolution recomputes an immutable hash chained to the previous block:
  $$\text{BlockHash}_n = \text{SHA256}(\text{BlockHash}_{n-1} \parallel \text{Timestamp} \parallel \text{UserId} \parallel \text{PayloadHash})$$
- **Disaster Recovery Continuity:** Verified that Merkle chain continuity survived disaster recovery cold restore without hash divergence.

#### Control 4: Encryption Architecture & Key Management
- **At Rest (Backups & Offline Journal):** AES-256-GCM encryption with unique 96-bit initialization vectors (IV) and 128-bit authentication tags. Tampered records produce immediate auth tag failures.
- **In Transit:** Enforces TLS 1.3 with HSTS (`max-age=31536000; includeSubDomains; preload`) and secure cookie flags (`HttpOnly; Secure; SameSite=Strict`).
- **Key Escrow & Rotation:** Master data encryption keys (DEK) are wrapped with Key Encryption Keys (KEK) suitable for HSM integration (AWS KMS / Azure Key Vault / On-Premise Thales HSM).

#### Control 5: Regulatory Compliance & Penetration Testing Posture
- **DPDP Act 2023 Conformance:** Explicit patient consent capture with purpose specification, right to withdraw consent, and cryptographic pseudonymization in analytical data warehouses.
- **CERT-In Compliance:** Preparation for third-party penetration testing and vulnerability assessment (VAPT) required for production ABDM empanelment.

---

### 3. Formal CISO Sign-Off Roster

| Role / Designation | Representative Name | Review Decision | Signature & Date | Security Conditions / Remarks |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Information Security Officer (CISO)** | Mr. Alok Vardhan, CISSP, CISM | [ ] APPROVED<br>[ ] REJECTED | ____________________ | — |
| **Data Protection Officer (DPO)** | Adv. S. Ramanathan, CIPP/A | [ ] APPROVED<br>[ ] REJECTED | ____________________ | — |
| **Lead Security Architect** | Ms. Farida Sheikh, CEH | [ ] APPROVED<br>[ ] REJECTED | ____________________ | — |
| **Infrastructure & Cloud SecOps Lead** | Mr. Naveen Chawla | [ ] APPROVED<br>[ ] REJECTED | ____________________ | — |
