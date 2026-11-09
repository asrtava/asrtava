# ASRTAVA Technical Blockers, Operational Risks & Mitigation Register

**Document Reference:** `docs/project/BLOCKERS_AND_RISKS.md`  
**Execution Authority:** ASRTAVA Technical Project Manager & Risk Officer  
**Last Updated:** 2026-11-09  
**Review Frequency:** Weekly during Commercial Release Candidate Evaluation

---

## 1. Technical & External Integration Blockers

| Blocker ID | Domain | Description | Impact | Remediation & Workaround | Owner |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **BLK-01** | National Interop | **NHA ABDM Sandbox Access**: National Health Authority has not issued static IP empanelment credentials. | HIGH | Internal mock ABDM adapter (`modules/integrations/abdm.ts`) simulates ABHA verification without blocking local or clinical hospital workflows. | Interop Lead |
| **BLK-02** | Telecommunications | **MSG91 DLT & WhatsApp Business Credentials**: Live SMS and WhatsApp delivery requires approved hospital DLT template headers and Meta app verification. | MEDIUM | System falls back to structured console logging (`[MOCK_SMS]`) in dev/staging. Hospital admins must provide DLT Entity ID in production `.env`. | Integration Lead |
| **BLK-03** | Physical Hardware | **On-Premises Hospital PACS Connection**: Physical GE/Siemens radiology modalities require local network IPsec VPN or on-premises edge router. | MEDIUM | Web Portal S3 presigned upload bridge allows radiologists to upload DICOM studies directly for cloud viewing. Edge appliance planned for v1.1. | DevOps Lead |

---

## 2. Operational, Security & Governance Risks

| Risk ID | Risk Category | Severity | Probability | Risk Description | Mitigation Strategy | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :---: |
| **RSK-01** | Regulatory | HIGH | LOW | DPDP Act 2023 non-compliance penalty if patient health data is processed outside India. | Primary hosting locked to AWS `ap-south-1` (Mumbai) and DR in `ap-south-2` (Hyderabad). Zero overseas cross-border egress. | **MITIGATED** |
| **RSK-02** | Security | CRITICAL | LOW | Cross-tenant data leak if application-level SQL filtering is accidentally bypassed. | Dual-layer isolation: Express API tenant validation + PostgreSQL `FORCE ROW LEVEL SECURITY` at the database kernel. | **MITIGATED** |
| **RSK-03** | Clinical Safety | HIGH | LOW | Double bed allocation during high-volume emergency room triage. | Database exclusion constraint (`status = 'OCCUPIED'`) ensures atomic bed occupancy transitions; duplicate booking throws 409 Conflict. | **MITIGATED** |
| **RSK-04** | Operational | MEDIUM | MEDIUM | Hospital cloud bill shock caused by unbounded diagnostic DICOM imaging storage. | S3 lifecycle policies automatically transition DICOM studies older than 90 days to Amazon S3 Glacier Flexible Retrieval. | **MITIGATED** |
| **RSK-05** | Legal | HIGH | LOW | Operating without ratified Terms of Service and Data Processing Agreements. | Draft legal templates authored in `docs/release/`; pilot launch conditioned on hospital legal retainer signature. | **PENDING SIGN-OFF** |
| **RSK-06** | Clinical Safety | CRITICAL | LOW | Commercial or AMC contract lapse locking out emergency or inpatient care. | Architectural decoupling: AMC expiry never terminates perpetual license; Emergency triage & Patient lookup fail-safe bypass hardcoded. | **MITIGATED** |
| **RSK-07** | Commercial | HIGH | LOW | Unauthorized copying or VM cloning of on-premises air-gapped installations. | Hardware fingerprint binding (CPU/MAC/Motherboard SHA-256 hash) and HMAC-SHA256 cryptographic claims verification. | **MITIGATED** |
| **RSK-08** | Clinical Safety | HIGH | LOW | Dirty legacy data (duplicate UHIDs, missing allergies) corrupting clinical records during migration. | 4-Phase Migration pipeline with dry-run deduplication, mandatory field validation, and human sign-off checkpoint before production insertion. | **MITIGATED** |
| **RSK-09** | Operational | HIGH | LOW | Unprepared clinical staff causing medical errors or patient queue delays on day-1 go-live. | Role-specific training certification gate (&ge; 80% passing score), UAT defect clearance (0 critical defects), and mandatory dual sign-off. | **MITIGATED** |
| **RSK-10** | Regulatory | HIGH | LOW | Cross-hospital patient record access violating DPDP Act 2023 patient consent mandates. | EMPI linking mandates explicit patient consent (`consent_granted: true`) with immutable audit logging on every cross-facility record query. | **MITIGATED** |
| **RSK-11** | Clinical Safety | HIGH | LOW | Doctor double-booking across separate physical branches causing abandoned OPD clinics. | Centralized Doctor Scheduling Anti-Collision engine mathematically prevents overlapping duty rosters across facilities on the same day. | **MITIGATED** |
| **RSK-12** | Financial | MEDIUM | LOW | Inter-branch inventory or revenue disputes causing internal group accounting discrepancies. | Dual-approval double-entry ledger workflow (initiator + receiving branch finance officer) and automated elimination during group consolidation. | **MITIGATED** |
| **RSK-13** | Clinical Safety | CRITICAL | LOW | Unvalidated analyzer telemetry releasing false readings or unverified panic values to patient charts. | Mandatory Pathologist / Lab Technician Sign-Off Gate; unverified packets are quarantined in `pending_approval`. | **MITIGATED** |
| **RSK-14** | Operational | MEDIUM | LOW | Transient network drops during external HL7/FHIR exchange causing lost orders or duplicated billing charges. | 15-minute sliding-window idempotency filter combined with persistent Dead-Letter Queue (DLQ) and exponential backoff retries. | **MITIGATED** |
| **RSK-15** | Financial | HIGH | LOW | Single-sided or unbalanced journal entries corrupting the general ledger and financial statements. | Hard database kernel check constraint `CONSTRAINT chk_journal_balance CHECK (total_debit = total_credit)` and pre-persistence service verification. | **MITIGATED** |
| **RSK-16** | Regulatory | HIGH | LOW | Improper GST taxation on exempt healthcare services triggering tax penalties under Notification 12/2017. | Automatic classification engine enforces SAC 999312 0% tax exemption for clinical healthcare services vs taxable retail pharmacy rates. | **MITIGATED** |
| **RSK-17** | Clinical Safety | CRITICAL | LOW | Dispensing confusion due to Look-Alike / Sound-Alike (LASA) drug names or undetected drug-drug interactions resulting in adverse drug events. | Clinical Decision Support engine with ISMP Tall Man lettering, pairwise DDI matrix, duplicate active ingredient checking, and mandatory documented clinical override justification. | **MITIGATED** |
| **RSK-18** | Operational / Clinical | HIGH | LOW | Undetected cold-chain temperature excursions compromising vaccine and biologic drug efficacy. | Automated IoT refrigeration sensor telemetry evaluation ($2^\circ\text{C} - 8^\circ\text{C}$); automatic immediate quarantine of affected storage bin lots (`QUARANTINED_TEMP_EXCURSION`) and urgent alerts. | **MITIGATED** |
| **RSK-19** | Regulatory | HIGH | LOW | Narcotic pilferage or improper controlled substance recordkeeping violating NDPS Act. | Two-person dual custody rule (`custodianNurseId !== witnessPharmacistId`) on every transaction in `narcotic_vault_ledger`, sequential perpetual balance, and blind shift discrepancy auditing. | **MITIGATED** |

---

## 3. Pending User / Stakeholder Decisions

The following decisions require explicit stakeholder or executive confirmation prior to live production traffic:
1. **Pilot Hospital Selection**: Final confirmation of the 3 initial healthcare facilities selected for Staged Rollout Phase 1.
2. **Payment Gateway Merchant Accounts**: Creation of live corporate Razorpay/Stripe merchant accounts and injection of production API keys into AWS Secrets Manager.
3. **Domain & DNS Approval**: Authorization to bind the production domain (`asrtava.com`) to the AWS CloudFront distribution and Route 53 hosted zone.

