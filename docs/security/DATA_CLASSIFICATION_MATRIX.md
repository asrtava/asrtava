# ASRTAVA Data Classification & Handling Matrix

## 1. Classification Levels

ASRTAVA categorizes all platform data into four distinct classification tiers under ISO 27001, HIPAA 45 CFR Part 160/164, and Digital Personal Data Protection Act 2023.

| Classification Tier | Definition | Examples | Storage Requirement | Encryption Requirement | Masking / De-identification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Public** | Freely sharable public hospital information. | Hospital names, department listings, public doctor schedules, generic clinic services. | Standard PostgreSQL table | Plaintext or standard TLS transit | None required |
| **Tier 2: Internal Operational** | Non-sensitive hospital operations data. | Staff rotas, inventory reorder levels, generic room codes, bed numbers. | Tenant-isolated tables (RLS enforced) | TLS 1.3 transit, volume encryption at rest | Not required internally |
| **Tier 3: Confidential Business** | Financial, SaaS pricing, and billing contracts. | SaaS subscription rates, vendor invoices, doctor payouts, tax GSTIN filings. | Role-guarded financial ledgers | AES-256-GCM at rest, TLS 1.3 in transit | Aggregated for non-finance roles |
| **Tier 4: Restricted PHI / SPI** | Protected Health Information & Sensitive Personal Identifiers. | Patient names, phone numbers, vitals, diagnoses, e-prescriptions, lab tests, Aadhaar/ABHA. | Strictly RLS scoped + Cryptographic Audit Chaining | AES-256-GCM envelope encryption at rest, TLS 1.3 transit | **Strict**: De-identification for analytics, masking on unprivileged views (`+91 98765*****`, `XXXX-XXXX-1234`) |

---

## 2. Handling & Redaction Guidelines by Role

| Role / Context | Tier 1 (Public) | Tier 2 (Internal) | Tier 3 (Finance) | Tier 4 (Restricted PHI) |
| :--- | :--- | :--- | :--- | :--- |
| **Treating Doctor** | Full Access | Full Access | No Access | **Full Clinical Access** (Audited) |
| **Nursing Staff** | Full Access | Full Access | No Access | **Active Inpatient Care Access** |
| **Receptionist** | Full Access | Full Access | Invoice Generation Only | **Demographics Only** (Clinical Notes Hidden) |
| **Pharmacist** | Full Access | Full Access | Billing Only | **Prescription Items Only** (Full EMR Hidden) |
| **Hospital Admin** | Full Access | Full Access | Full Access | **Aggregated / De-identified Only** |
| **Platform Super Admin** | Full Access | Full Access | SaaS Platform Only | **Zero Standing Access** (Requires JIT Approval) |
| **Analytics & BI** | Full Access | Full Access | Anonymized Aggregates | **Fully Pseudonymized / Masked** |

