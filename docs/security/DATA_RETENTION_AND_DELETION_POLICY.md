# ASRTAVA Data Retention, Archival and Statutory Deletion Policy

## 1. Statutory Retention Framework

In healthcare and hospital operations, indiscriminate data deletion violates statutory regulations and exposes hospitals to severe legal penalties. ASRTAVA programmatically enforces compliance with statutory mandates:

| Data Category | Statutory Minimum Retention | Legal Basis & Mandate | Handling upon Erasure Request |
| :--- | :--- | :--- | :--- |
| **Adult Clinical Records** | **3 Years** from last consultation/discharge | National Medical Commission (RMP) Regulations 2023, Reg 3.1 & Clinical Establishments Act | **Legal Hold Retained**: Cannot be deleted; contact identifiers pseudonymized. |
| **Minor Clinical Records** | **21 Years** (Age 18 + 3 years majority limitation) | Indian Limitation Act 1963 & Medical Jurisprudence | **Legal Hold Retained**: Preserved until patient reaches age 21. |
| **Financial & Tax Ledgers** | **8 Years** | Indian Income Tax Act 1961 (Section 44AA) & GST Regulations | **Legal Hold Retained**: Mandatory preservation of invoices, receipts, and vouchers. |
| **Audit & Access Trails** | **7 Years** | HIPAA Security Rule §164.316(b)(2)(i) & ISO 27001 | **Immutable**: Append-only ledger; updates and deletes permanently blocked. |
| **Radiology DICOM Scans** | **5 Years** | Atomic Energy Regulatory Board (AERB) & Medical Council | Archived to cold encrypted tier after 12 months. |
| **Transient Telemetry** | **1 Year** | DPDP Act 2023 Data Minimization Principle | Automatically purged after 365 days. |

---

## 2. Programmatic Legal Hold Workflow

When a patient files an erasure request under DPDP 2023 Section 12(3):
1. The engine checks the creation dates and categories of all associated records.
2. If any records fall within the statutory retention window, the request status is transitioned to `legal_hold_retained`.
3. The response provides the statutory citation (e.g. *NMC RMP Regulations 2023 Reg 3.1*).
4. Direct personal identifiers (e.g., secondary phone numbers, email addresses, marketing consents) are pseudonymized, while the clinical encounter data is retained securely.

---

## 3. Cryptographic Data Erasure Standards

When retention periods expire and no active litigation or legal holds exist:
- Data is erased following **NIST SP 800-88 Rev. 1 (Guidelines for Media Sanitization)**:
  - Cryptographic erasure: Destruction of tenant-specific Data Encryption Keys (DEKs) renders archived ciphertext mathematically unrecoverable.
  - Zero-overwriting: Primary database rows are deleted and space reclaimed via PostgreSQL `VACUUM FULL`.

