# Quality & Patient Safety Module Security Audit

## 1. Multi-Tenant Data Protection
- All tables (`qm_incidents`, `qm_capa_actions`, `qm_infection_surveillance`, `qm_clinical_audits`, `qm_patient_grievances`, `qm_accreditation_standards`) enforce PostgreSQL Row-Level Security (RLS) bound to `tenant_id`.
- Hospital A quality auditors cannot inspect Hospital B sentinel incidents, root causes, or accreditation compliance scores.

## 2. Whistleblower Anonymity & Anti-Retaliation
- When `is_anonymous` is true, application drops all user metadata before SQL persistence.
- Cryptographic hash salt ensures no reverse lookups of reporting identities.

## 3. Tamper-Evident Audit Trails
- State changes on sentinel incidents and CAPA verifications generate append-only audit entries.
- Retroactive deletion or modification of incident history is strictly prohibited.

