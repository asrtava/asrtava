# ASRTAVA Multi-Framework Compliance Control Matrix

## 1. Regulatory Frameworks Covered
- **DPDP Act 2023**: Digital Personal Data Protection Act (India)
- **HIPAA**: Health Insurance Portability and Accountability Act (45 CFR Parts 160 & 164)
- **NMC RMP 2023**: National Medical Commission Registered Medical Practitioner Regulations (India)
- **ISO 27001:2022**: Information Security Management System Controls

---

## 2. Comprehensive Control Mapping Matrix

| Standard / Section | Regulatory Requirement Description | ASRTAVA Implementation & Technical Control | Evidence & Artifact |
| :--- | :--- | :--- | :--- |
| **HIPAA §164.312(a)(1)** | **Access Control**: Unique user identification and emergency access ("break-glass") procedures. | Every user assigned unique UUID; passwords hashed via salted bcrypt; emergency access requires explicit justification and is audited with `EMERGENCY_BREAK_GLASS`. | `backend/src/modules/security/audit-logger.service.ts` |
| **HIPAA §164.312(a)(2)(iv)** | **Encryption and Decryption**: Mechanism to encrypt and decrypt electronic protected health information. | AES-256-GCM envelope encryption at rest; TLS 1.3 in transit with forced HSTS. | `backend/src/modules/security/credential-vault.ts` |
| **HIPAA §164.312(b)** | **Audit Controls**: Mechanisms to record and examine activity in information systems containing ePHI. | Append-only `clinical_audit_events` with SHA-256 Merkle chain linking and database triggers prohibiting UPDATE/DELETE. | `database/migrations/018_security_governance.sql` |
| **HIPAA §164.312(e)(1)** | **Transmission Security**: Guard against unauthorized access to ePHI in transit. | Enforces TLS 1.3, strict CORS origins, OWASP Helmet headers, and rejects plaintext HTTP. | `backend/src/server.ts` |
| **DPDP Act 2023 §6** | **Consent Notice & Granular Withdrawal**: Notice in clear language and accessible consent ledger. | Granular consent ledger (`patient_consents`) capturing category-specific approvals with instant withdrawal support. | `backend/src/modules/security/privacy-governance.service.ts` |
| **DPDP Act 2023 §8(5)** | **Data Erasure & Statutory Retention**: Erase personal data upon purpose completion unless retention required by law. | `PrivacyGovernanceService.processPrivacyRequest` checks NMC RMP 2023 & Income Tax Act Sec 44AA; marks record as `legal_hold_retained` when statutory retention is active. | `backend/src/modules/security/privacy-governance.service.ts` |
| **DPDP Act 2023 §8(6)** | **Data Protection Officer & Redressal**: Mechanism to process data subject rights. | DSR processing portal (`/api/v1/security/privacy/requests`) with 30-day statutory SLA tracking. | `backend/src/modules/security/security.routes.ts` |
| **NMC RMP 2023 Reg 3.1** | **Medical Record Preservation**: Inpatient and outpatient medical records must be preserved for at least 3 years. | Statutory retention policy table (`data_retention_policies`) configured with 3-year adult hold and 21-year minor hold. | `database/migrations/018_security_governance.sql` |
| **Income Tax Act §44AA** | **Financial Ledger Preservation**: Mandatory 8-year preservation of financial invoices and accounting books. | Invoices and billing transactions preserved for 8 years minimum with legal hold flags. | `database/migrations/018_security_governance.sql` |
| **ISO 27001 A.9.4.2** | **Secure Log-On Procedures**: Password complexity, throttling, and session timeouts. | NIST SP 800-63B password rules, progressive login throttling, account lockout after 5 failures, refresh token family rotation. | `backend/src/modules/security/password-policy.service.ts` |

