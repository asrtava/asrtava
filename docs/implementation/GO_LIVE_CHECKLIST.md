# ASRTAVA 14-Gate Go-Live Readiness Checklist & Dual Sign-Off

## 1. Executive Summary

Production cutover represents the point of operational transfer where the hospital transitions from legacy systems or paper workflows to live clinical operations on ASRTAVA. To protect patient safety, clinical integrity, and regulatory compliance, ASRTAVA enforces a mandatory **14-Gate Pre-Flight Checklist** and **Mandatory Dual Sign-Off**.

---

## 2. The 14 Mandatory Readiness Gates

Every gate must be evaluated and verified in the database before the production cutover transaction can proceed:

| Gate # | Gate Code | Gate Title | Verification Criteria | Verified By |
|---|---|---|---|---|
| **Gate 1** | `LICENSE_VERIFIED` | Perpetual Software License Issued & Verified | Valid cryptographic RSA/Ed25519 token bound to hospital UUID, bed tier, and active modules | ASRTAVA Licensing Admin |
| **Gate 2** | `DEPLOYMENT_ENV_OPERATIONAL` | Hosting Environment Health & Probe Passed | Hardware specs (CPU, RAM, NVMe), Docker services, and local network probes pass (HTTP 200) | Infrastructure Lead |
| **Gate 3** | `SECURITY_AUDIT_CLEARED` | Encryption, NIST Passwords & RBAC Verified | TLS 1.3 enforced, at-rest AES-256 DB encryption verified, DPDP Act PII masking validated | Security Engineer |
| **Gate 4** | `BACKUP_RESTORATION_VERIFIED` | Automated Snapshot & Recovery Drill Succeeded | End-to-end backup snapshot taken, test database restored, and zero-data-loss verified | Lead DBA |
| **Gate 5** | `HOSPITAL_CONFIG_COMPLETED` | Departments, Beds, Tariffs & Formulary Configured | All hospital wards, beds, doctors, fee tariffs, and drug formularies loaded and verified | Hospital Admin |
| **Gate 6** | `DATA_MIGRATION_RECONCILED` | Patient Data & Master Catalogs Reconciled | 100% reconciliation checksum, zero unhandled errors, and admin sign-off recorded | Migration Lead |
| **Gate 7** | `STAFF_ACCOUNTS_ACTIVATED` | Clinical & Staff Accounts Enrolled | Staff accounts provisioned with least-privilege roles; default passwords changed | Hospital HR / Admin |
| **Gate 8** | `MANDATORY_TRAINING_CERTIFIED` | Role Certifications Completed (&ge; 80% Grade) | &ge; 90% of active clinical doctors and nurses certified on clinical modules | Training Lead |
| **Gate 9** | `UAT_SIGN_OFF` | 16 Hospital Domains Accepted (0 Critical Defects) | All 16 domain test suites executed; 0 open critical defects | QA & UAT Lead |
| **Gate 10** | `INTEGRATIONS_VERIFIED` | Telecom, Diagnostic Devices & PACS Operational | SMS gateway, WhatsApp API, HL7 LIS analyzers, and DICOM PACS connections confirmed | Integrations Engineer |
| **Gate 11** | `COMMUNICATION_PLAN_APPROVED` | Patient & Department Launch Notifications Prepared | Staff go-live memo circulated, patient portal guidance ready, triage protocols posted | Hospital Management |
| **Gate 12** | `SUPPORT_TEAM_ASSIGNED` | Hypercare Technical Leads & Escalation Configured | 24/7 on-site and remote hypercare engineering roster confirmed with SLA tiers | Implementation Lead |
| **Gate 13** | `HOSPITAL_ADMIN_APPROVAL` | Hospital Medical Director / Admin Formal Sign-Off | Formal administrative authorization confirming hospital acceptance of the system | Hospital Medical Director |
| **Gate 14** | `ASRTAVA_LEAD_APPROVAL` | ASRTAVA Implementation Lead Dual Sign-Off Gate | Formal engineering authorization confirming system stability and readiness | ASRTAVA Account Lead |

---

## 3. Mandatory Dual Sign-Off Protocol

Production cutover requires dual cryptographic endorsement:
1. `hospitalAdminUserId`: The designated hospital Medical Director or Chief Administrative Officer.
2. `asrtavaLeadUserId`: The assigned ASRTAVA Lead Implementation Manager.

```typescript
// Strict backend enforcement in OnboardingService.executeProductionGoLive
if (!params.hospitalAdminUserId || !params.asrtavaLeadUserId) {
  throw new Error('Dual Sign-Off required: Both Hospital Admin and ASRTAVA Implementation Lead signatures are mandatory.');
}

const readiness = this.getGoLiveReadinessReport(impl.id);
if (!readiness.isReadyForGoLive) {
  throw new Error(`Production Go-Live aborted: ${readiness.unverifiedMandatoryCount} checklist gates remain unresolved.`);
}
```

Upon successful dual sign-off:
- The system stage transitions to `production_go_live`.
- Timestamps and signatory user IDs are immutably logged.
- The 30-day hypercare support window (`hypercare_ends_at = NOW() + 30 days`) is automatically initiated.
- Notification events are broadcast to all clinical stations.

