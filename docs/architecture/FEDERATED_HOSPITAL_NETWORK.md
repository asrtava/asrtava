# ASRTAVA Federated Hospital Network & Controlled Healthcare Interoperability
## Architecture Specification & Security Invariants

---

### 1. Architectural Philosophy: Isolation First, Controlled Coordination Second

ASRTAVA is designed on the foundational principle that **every hospital is an autonomous, private entity**.
- Hospitals **do not share a unified patient database**, nor can any hospital query another hospital's electronic medical records, pharmacy inventory, financial ledgers, or employee roster.
- The **ASRTAVA Federated Healthcare Coordination Network** is a secure, decoupled interoperability bus enabling authorized, purpose-specific clinical collaboration without creating a backdoor into hospital databases.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ASRTAVA PLATFORM SERVICES                       │
│    Customer Management · Software Licensing · Telemetry & Deployment   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────┐         ┌───────────────────────────────┐
│     HOSPITAL ALPHA TENANT     │         │      HOSPITAL BETA TENANT     │
│   Private PostgreSQL Schema   │         │   Private PostgreSQL Schema   │
│   • Patients & EMR            │         │   • Patients & EMR            │
│   • Staff & Payroll           │         │   • Staff & Payroll           │
│   • Billing & Ledgers         │         │   • Billing & Ledgers         │
│   • Pharmacy Inventory        │         │   • Pharmacy Inventory        │
└──────────────┬────────────────┘         └───────────────┬───────────────┘
               │                                          │
               ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              ASRTAVA CONTROLLED INTEROPERABILITY GATEWAY                │
│    Identity & Role Verification  ·  Lawful Basis & Consent Validation   │
│  Minimum Necessary Case Payload  ·  Time-Limited Cryptographic Tokens   │
│                   Tamper-Resistant SHA-256 Audit                        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
[ Organ Donation & NOTTO ]  [ Emergency Transfers ]    [ Critical Bed Matrix ]
- Brain-death certification - Minimum clinical payload - Vacancies with TTL
- SOTTO/NOTTO notification  - ALS ambulance dispatch   - Stale reports expire
- Green corridor logistics  - Nursing sign-off handover - Explicit confirmation
```

---

### 2. Permitted Coordination Workflows

Direct cross-hospital connections are strictly limited to the following five healthcare coordination scenarios:

#### A. Organ Donation and Transplantation Coordination
- Primary national coordination network integrating with India's **National Organ and Tissue Transplant Organisation (NOTTO)** and **State Organ and Tissue Transplant Organisations (SOTTO)**.
- **Strict Anti-Commercialization Rule**: Buying, selling, bidding, or paying for organ allocation priority is mathematically and procedurally impossible.
- ASRTAVA provides operational clinical coordination and documentation; **allocation authority remains strictly with official government bodies (NOTTO/SOTTO)**.
- Requires dual apnea test timestamps $\ge 6$ hours apart by a certified 4-doctor brain death board, signed THOA Form 8/10 declaration, and Green Corridor traffic coordination.

#### B. Emergency Patient Referral & Acute Inter-Hospital Transfer
- Case-specific transfer requests when an originating hospital lacks specialized facilities (e.g. neurosurgery, Level 1 trauma, ECMO, neonatal ICU).
- **Minimum Necessary Dataset**: Only clinical parameters needed for acute stabilization (GCS, vitals, intubation status, inotropes, critical interventions) are shared. Complete medical histories are never transmitted.
- Tracks ALS/BLS ambulance dispatch, paramedic telemetry, ETA, and dual-sign-off nursing handover.

#### C. Regional Bed & Critical-Care Availability Reporting
- Voluntary, timestamped capacity broadcast (General Ward, ICU, Ventilator, Emergency Resus bays, OT slots).
- Strict Time-To-Live (TTL: 60 to 120 minutes); stale reports automatically expire to prevent inaccurate reservation assumptions.

#### D. Blood Bank & Blood Component Coordination
- Cross-hospital queries for scarce blood components (PRBC, Single Donor Platelets, Fresh Frozen Plasma, Cryoprecipitate).
- **Donor Privacy Invariant**: Donor identities and health records are never exposed.

#### E. Case-Based Ephemeral Clinical Data Exchange
- Sharing a single diagnostic report (CT angiography, MRI study, HLA tissue typing certificate) for sub-specialty second opinions.
- Uses high-entropy bearer tokens (`asrt_share_*`) valid for 2 to 24 hours, restricted to the recipient hospital tenant, with automated revocation after maximum access limits.

---

### 3. Non-Negotiable System Invariants (What ASRTAVA Must NEVER Do)

1. **NO Direct Database Browsing**: Hospital A can never view Hospital B's patient list.
2. **NO Cross-Hospital EMR Searching**: Hospital A cannot search Hospital B's medical records.
3. **NO Financial or Operational Leakage**: Billing ledgers, staff rosters, payroll, and internal margins are completely invisible to other hospitals.
4. **NO Algorithm-Based Organ Allocation**: ASRTAVA will never run independent matching algorithms that bypass NOTTO/SOTTO.
5. **NO Commercialization of Organs**: Zero tolerance for fees, bids, or financial transactions tied to donor organs.
6. **NO Automatic Record Merging**: Patient records across unrelated hospitals remain isolated unless an explicit legal consent or referral workflow links them.
7. **NO Unrestricted Super Admin Access**: Super Admins cannot inspect patient clinical charts without a hospital-approved JIT support grant.

---

### 4. Technical Architecture & Database Entities

The coordination network is governed by Migration `037_federated_inter_hospital_coordination_network.sql`:
- `federated_participating_hospitals`: Verified hospital registry, state accreditation, and published clinical capabilities.
- `inter_hospital_coordination_requests`: Universal request-and-approval engine tracking lifecycle: `DRAFT -> SUBMITTED -> AUTHORIZATION_CHECK -> ACCEPTED -> IN_PROGRESS -> COMPLETED`.
- `organ_transplant_coordination_cases`: THOA compliance records, apnea test certifications, SOTTO references, Green Corridor logistics, and non-commercial affidavit hashes.
- `emergency_patient_transfer_cases`: Pseudonymized patient tracking, minimum clinical payloads, and ambulance telemetry.
- `inter_hospital_bed_availability_reports`: Real-time vacancy matrix with automatic TTL expiration.
- `blood_bank_coordination_requests`: Component requests with strict donor de-identification.
- `case_based_data_shares`: Ephemeral bearer tokens with tenant bindings and expiration enforcement.
- `inter_hospital_audit_trail`: Cryptographically chained SHA-256 audit logs tagged with lawful basis (THOA 1994, DPDP Act 2023, Emergency Care).
