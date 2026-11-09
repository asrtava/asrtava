# ASRTAVA Legal, Privacy & Compliance Launch Checklist

**Document Reference:** `docs/release/LEGAL_AND_PRIVACY_LAUNCH_CHECKLIST.md`  
**Applicable Legal Frameworks:** Digital Personal Data Protection (DPDP) Act 2023 (India), National Medical Commission Registered Medical Practitioner (NMC RMP) Regulations 2023, Information Technology Act 2000 & SPDI Rules 2011, ABDM Health Data Management Policy  
**Review Status:** Pre-Launch Compliance Review Completed; Formal Legal Counsel Retainer Sign-Off Required

---

## 1. Legal Document Governance & Mandatory Contracts

Before commercial subscription billing and hospital patient onboarding commence, the following legal instruments must be executed and published:

| Document Instrument | Primary Scope & Audience | Execution Mechanism | Status |
| :--- | :--- | :--- | :---: |
| **Terms of Service (ToS)** | Platform usage rules for hospital staff, doctors, and users | Click-through acceptance upon first login | **DRAFT READY** |
| **Platform Privacy Policy** | Public web and commercial data collection disclosures | Published at `https://asrtava.com/privacy` | **DRAFT READY** |
| **Patient Privacy Notice (PPN)**| Clear, multi-lingual notice to patients on health data processing | Displayed on Patient Web & Mobile App | **DRAFT READY** |
| **Hospital SaaS Service Agreement**| Commercial B2B contract governing subscription, billing, and SLAs | Signed digitally via DocuSign / Leegality | **DRAFT READY** |
| **Data Processing Agreement (DPA)**| Formal Data Fiduciary (Hospital) to Data Processor (ASRTAVA) terms | Embedded schedule to Service Agreement | **DRAFT READY** |
| **Service Level Agreement (SLA)**| 99.95% monthly uptime commitment and service credit schedule | Part of Hospital Service Agreement | **DRAFT READY** |
| **DPDP Consent Artefacts** | Explicit, informed, unconditional consent for health data processing | Signed digitally during UHID creation | **IMPLEMENTED** |

---

## 2. Regulatory Compliance Verification Checklist

### 2.1 Digital Personal Data Protection (DPDP) Act 2023 Compliance
- [x] **Indian Data Residency**: All primary databases, read replicas, Redis instances, and S3 file buckets are located within Indian borders (AWS `ap-south-1` Mumbai and `ap-south-2` Hyderabad).
- [x] **Data Fiduciary vs. Data Processor Clear Delineation**: Hospitals operate as **Data Fiduciaries** who own and control patient medical records. ASRTAVA operates as a **Data Processor** acting solely on documented instructions.
- [x] **Data Subject Rights (DSR) Implementation**: Automated workflows for Right to Information, Right to Correction, and Right to Erasure implemented in `modules/security/dpdp.ts`.
- [x] **Consent Notice Specificity**: Patient consent requests detail exact medical purposes without bundled or coerced authorizations.

### 2.2 National Medical Commission (NMC RMP) Regulations 2023
- [x] **Prescription Authenticity**: All e-prescriptions generated in the doctor portal capture the Registered Medical Practitioner's (RMP) State Medical Council registration number, qualification, signature stamp, and date.
- [x] **Medical Record Retention (Legal Hold)**: Clinical consultation notes, discharge summaries, and inpatient charts are protected against deletion for a minimum statutory period of **3 years** for adults, and until reaching age 21 for pediatric patients.
- [x] **Medico-Legal Case (MLC) Flagging**: MLC records are placed on permanent statutory hold and cannot be modified or purged.

### 2.3 Information Security & Incident Disclosure Obligations
- [x] **CERT-In 6-Hour Reporting Preparedness**: Defined security incident escalation playbook to report cyber security incidents to CERT-In within 6 hours of confirmation.
- [x] **End-to-End Cryptography**: TLS 1.3 enforced for data in transit; AES-256 KMS encryption enforced for data at rest.

---

## 3. Mandatory Legal Notice & Disclaimer

> [!WARNING]
> **LEGAL NOTICE**: The contractual templates, privacy notices, and consent workflows provided in this repository constitute software implementation specifications and engineering guidelines. They **DO NOT** constitute formal legal counsel. Prior to commercial go-live, all legal instruments must be formally reviewed and ratified by qualified legal counsel licensed in India and the operating jurisdictions of the participating hospitals.

