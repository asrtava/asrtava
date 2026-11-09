# ASRTAVA Privacy Impact Assessment (PIA) Template

## 1. Project Information & Assessment Metadata

- **Project / Feature Name**: __________________________________________________
- **Module Under Assessment**: [ ] Clinical [ ] Pharmacy [ ] Lab [ ] Billing [ ] Integration
- **Lead Clinical / Technical Architect**: ______________________________________
- **Data Protection Officer (DPO)**: ___________________________________________
- **Assessment Date**: _________________________________________________________

---

## 2. Personal Data Intake & Classification

1. **What categories of personal data will be collected or processed?**
   - [ ] Patient Identifiers (Name, Phone, Email, National ID, ABHA)
   - [ ] Protected Health Information (Diagnoses, ICD-10, Lab Values, Imaging)
   - [ ] Financial Data (Payment card tokens, bank accounts, UPI IDs)
   - [ ] Employee / Doctor Credentials & Biometrics

2. **Lawful Basis for Processing (DPDP Act 2023 / HIPAA)**:
   - [ ] Explicit Granular Patient Consent
   - [ ] Medical Emergency / Preservation of Life
   - [ ] Legal Obligation / Statutory Compliance

---

## 3. Privacy Risk Assessment & Mitigations

| Identified Privacy Risk | Likelihood | Impact | Severity | Mitigation Controls Implemented | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Cross-tenant data bleed | Low | Critical | High | PostgreSQL RLS + `TenantIsolationGuard` | Low |
| Unauthorized staff viewing | Medium | High | High | Role-specific scoping + Clinical Audit Trail | Very Low |
| Intercepted webhook | Low | High | Medium | HMAC-SHA256 signature verification | Low |

---

## 4. DPO Sign-Off & Approval

- **DPO Determination**: [ ] Approved without Conditions [ ] Approved with Conditions [ ] Rejected
- **Mandatory Review Date**: ___________________________________________________
- **Signature**: ______________________________________________________________

