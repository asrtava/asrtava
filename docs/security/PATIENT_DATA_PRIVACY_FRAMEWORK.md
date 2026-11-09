# ASRTAVA Patient Data Privacy & Consent Governance Framework

## 1. Compliance Alignment

ASRTAVA's privacy architecture is mapped directly against the **Digital Personal Data Protection Act 2023 (DPDP Act, India)** and the **HIPAA Privacy & Security Rules (45 CFR Parts 160 and 164, USA)**.

---

## 2. Core Privacy Principles in Code

1. **Lawful Basis & Consent Ledger**: Processing of personal data requires lawful justification. A dedicated consent ledger (`patient_consents`) tracks specific granular purposes:
   - General Inpatient/Outpatient Treatment
   - Surgical Procedures & Anesthesia
   - Telemedicine Consultations
   - WhatsApp / SMS Communications
   - Insurance Claim Data Sharing
2. **Purpose Limitation**: Consent granted for treatment does not authorize commercial communication or broad analytics.
3. **Data Minimization & De-identification**: Non-clinical views, billing exports, and dashboards display masked data (`+91 98765*****`, `XXXX-XXXX-1234`).
4. **Storage Limitation & Statutory Retention**: Medical records cannot be deleted indiscriminately. Indian National Medical Commission (NMC) regulations mandate retaining adult medical records for at least 3 years, and records of minors for 21 years (until age 18 + 3 years of majority limitation).

---

## 3. Data Subject Rights (DSR) Workflows

Under DPDP Act Section 11-13 and HIPAA §164.524, patients can exercise specific rights via `/api/v1/security/privacy/requests`:

| Right | API Flow | SLA | Handling of Statutory Retention |
| :--- | :--- | :--- | :--- |
| **Right to Access** | Returns consolidated patient health dossier | 30 Days | Complete audit trail logged |
| **Right to Portability** | Generates FHIR R4 standard JSON export | 30 Days | Machine-readable interoperable bundle |
| **Right to Correction** | Clinician-reviewed medical record amendment | 15 Days | Original note preserved; amendment appended |
| **Right to Erasure** | Erasure evaluation workflow | 30 Days | Records under NMC RMP 2023 or Tax Sec 44AA are placed under `legal_hold_retained`; direct personal identifiers pseudonymized. |
| **Consent Withdrawal** | Updates `patient_consents` table | Real-time | Channels (e.g. WhatsApp notifications) disabled immediately |

