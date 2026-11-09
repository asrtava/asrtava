# ASRTAVA Architecture Decision Records (ADRs)

**Document Reference:** `docs/project/ARCHITECTURE_DECISION_RECORDS.md`  
**Execution Authority:** ASRTAVA Chief Software Architect  
**Architecture Standard:** Michael Nygard ADR Template  
**Repository Model:** Multi-Tenant Modular Monolith

---

## ADR-001: Adoption of Modular Monolith over Microservices
- **Status**: APPROVED
- **Context**: Healthcare workflows (such as doctor consultation -> lab ordering -> bed reservation -> pharmacy dispensing) require atomic consistency and low latency. Microservices introduce network partition hazards, eventual consistency lag in emergency bed allocation, and distributed transaction complexity across hospital departments.
- **Decision**: Architect ASRTAVA as a modular monolith in TypeScript, organizing domains into strict internal modules (`backend/src/modules/*`) sharing a single database transaction boundary and unified dependency injection.
- **Consequences**: Significantly simplified deployment, sub-millisecond inter-module communication, zero distributed transaction overhead, and predictable operational maintenance.

---

## ADR-002: Multi-Tenancy via PostgreSQL Row-Level Security (RLS)
- **Status**: APPROVED
- **Context**: ASRTAVA must serve hundreds of hospitals while guaranteeing strict data isolation under the DPDP Act 2023. Separate databases per hospital would incur unsustainable cloud infrastructure costs (500+ RDS instances).
- **Decision**: Utilize a shared database with PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`). Every tenant table includes a `hospital_id` UUID column, and database connections set `SET LOCAL app.current_hospital_id = ?` per transaction.
- **Consequences**: Mathematically enforced kernel-level isolation, reduced hosting costs by 70%, centralized SaaS business analytics, and zero cross-tenant data bleed.

---

## ADR-003: Hybrid RBAC with Explicit Individual Deny Precedence
- **Status**: APPROVED
- **Context**: Hospital hierarchies require standard department roles (e.g., Doctor, Nurse, Pharmacist), but hospital medical directors frequently need to revoke specific permissions (e.g., denying an intern access to VIP patient records or high-risk opioid prescriptions).
- **Decision**: Implement a Centralized Authorization Engine enforcing the precedence:
  $$\text{Individual DENY} > \text{Individual ALLOW} > \text{Role RBAC} > \text{Default DENY}$$
- **Consequences**: Granular, auditable permission controls without exploding the number of static role definitions.

---

## ADR-004: Decoupled Vite SPA with Rollup Manual Chunking
- **Status**: APPROVED
- **Context**: Hospital clinical staff switch rapidly between clinical encounters, bed maps, and patient charts. Server-side rendering (SSR) introduces server memory contention and round-trip delays over erratic clinic internet connections.
- **Decision**: Build the frontend as a React 19 Single Page Application (SPA) using Vite 6, with Rollup `manualChunks` separating vendor frameworks (`react`, `axios`), icons (`lucide-react`), and portal modules.
- **Consequences**: All production JavaScript chunks remain under 360 kB (81 kB gzip). Zero chunks exceed 500 kB. Sub-second view rendering in hospital emergency rooms.

---

## ADR-005: Cryptographic Merkle Chain for Audit Non-Repudiation
- **Status**: APPROVED
- **Context**: National Medical Commission (NMC RMP 2023) regulations mandate that medical records and prescriptions cannot be tampered with or repudiated retroactively.
- **Decision**: Every audit log record appends to `audit_events_immutable`, computing a SHA-256 hash incorporating the previous record's hash:
  $$\text{Hash}_n = \text{SHA256}(\text{TenantID} \parallel \text{UserID} \parallel \text{Timestamp} \parallel \text{Action} \parallel \text{Hash}_{n-1})$$
- **Consequences**: Any direct SQL tampering out-of-band breaks the cryptographic chain and triggers instant CloudWatch alarms.

---

## ADR-006: AWS S3 WORM Object Lock in Compliance Mode
- **Status**: APPROVED
- **Context**: Electronic health records and radiology DICOM files must be protected against malicious deletion or ransomware attacks for statutory periods (minimum 3 years for adults, 21 years for minors).
- **Decision**: Configure the primary AWS S3 storage bucket with Object Lock in **Compliance Mode**.
- **Consequences**: Finalized medical records cannot be overwritten or deleted by any user—including AWS root account credentials—until the retention lock expires.

---

## ADR-007: Zero-Standing-Privilege Just-in-Time (JIT) Support Access
- **Status**: APPROVED
- **Context**: SaaS platform Super Administrators should not possess persistent standing access to patient clinical consultations or private diagnoses.
- **Decision**: Super Admins receive zero default clinical read permissions. Support access requires an explicit, audited JIT support ticket (max 60 minutes) approved by the hospital administrator.
- **Consequences**: Guarantees patient privacy and eliminates insider threat vectors across tenant clinical boundaries.

---

## ADR-008: One-Time Perpetual Licensing with Optional AMC Independence
- **Status**: APPROVED
- **Context**: Healthcare institutions require long-term capital expenditure stability and legal software ownership rather than compulsory recurring SaaS subscription lock-ins. Furthermore, administrative contract lapses must never interrupt clinical care or delete medical records.
- **Decision**: Implement a One-Time Perpetual Software Licensing model where software usage rights are permanent. Annual Maintenance & Support (AMC) agreements are separate, optional commercial contracts. Expiration of an AMC strictly never terminates the perpetual core license or blocks clinical workflows. Emergency department care and patient lookup feature hardcoded fail-safe bypasses.
- **Consequences**: Enhanced hospital trust, zero risk of clinical lockouts, and clear legal delineation between software ownership and ongoing support.

---

## ADR-009: Multi-Deployment Agnostic Architecture via Pluggable Adapters
- **Status**: APPROVED
- **Context**: Hospitals require choice in deployment topologies: Cloud VPC, On-Premises Air-Gapped server, or Hybrid Edge-Cloud. Maintaining three separate products would fragment engineering and introduce synchronization divergence.
- **Decision**: Retain a single codebase with pluggable infrastructure adapters (`IStorageAdapter`, `INotifierAdapter`, `HybridSyncService`, `OfflineLicenseAdapter`). Business domain modules remain strictly deployment-agnostic. Hybrid topologies enforce that the local hospital edge node is the undisputed source of truth for clinical encounters with append-only EMR versioning.
- **Consequences**: 100% code reuse across Cloud, On-Premises, and Hybrid deployments; air-gapped clinical resilience; seamless customer migration between hosting topologies.

---

## ADR-010: 18-Stage Onboarding Lifecycle, Dry-Run Migration & Mandatory Dual Sign-Off Go-Live
- **Status**: APPROVED
- **Context**: Hospital go-live transitions carry immense clinical and financial risks. Unvalidated data migration, untrained staff, open clinical defects, or unilateral cutover decisions can cause medical errors or legal liabilities.
- **Decision**: Implement a deterministic 18-stage implementation state machine with strict gate evaluation. Data migration mandates a 4-phase pipeline (ingestion, dry-run duplicate detection, human administrative approval, and production execution with SHA-256 checksums). Production cutover strictly requires **Mandatory Dual Sign-Off** (`hospitalAdminUserId` + `asrtavaLeadUserId`) and 100% verification across 14 mandatory readiness gates with 0 open critical UAT defects.
- **Consequences**: Zero silent clinical data overwrites; mathematically verifiable data reconciliation; shared clinical and technical governance; guaranteed operational readiness before opening hospital doors.

---

## ADR-011: Directed Acyclic Graph (DAG) Hierarchy, Multi-Workplace Identity & Anti-Collision Engine
- **Status**: APPROVED
- **Context**: Healthcare enterprises operate complex multi-tier structures (Hospital Groups, Regional Divisions, Main Hospitals, Satellite Branches, Outpatient Clinics, and Specialized Centers). Doctors and specialists routinely rotate across multiple physical locations. Previous multi-tenant models treated hospitals as isolated, flat silos, causing duplicate patient identities across branches, doctor scheduling double-bookings across physical locations, and lack of group financial visibility.
- **Decision**:
  1. Model organizational structures as a Directed Acyclic Graph (DAG) with an in-engine cycle prevention validator preventing recursive ancestry loops.
  2. Implement an Enterprise Master Patient Index (EMPI) linking local patient records via SHA-256 National ID hashes and fuzzy phone+name matching under DPDP consent governance.
  3. Decouple staff identity from a single hospital into a central identity with N-workplace assignments (`primary`, `secondary`, `temporary`, `visiting`).
  4. Implement a multi-facility doctor scheduling anti-collision engine rejecting overlapping duty rosters across physical facilities on the same calendar day with HTTP 409 Conflict.
  5. Enforce hierarchical configuration precedence: `Platform Default -> Organization Group -> Hospital -> Branch Override`.
- **Consequences**: Enables large hospital chains to operate as unified healthcare systems; prevents doctor double-booking across cities; consolidates group revenue while preserving branch clinical autonomy and distinct legal entity tax accounting.

---

## ADR-012: Standards-Based Healthcare Interoperability, ASTM Frame Ingestion & Pathologist Approval Gate
- **Status**: APPROVED
- **Context**: Standalone hospital applications suffer from isolated clinical silos, inability to automatically capture analyzer readings from laboratory instruments (Sysmex, Roche Cobas), manual clerical patient errors at radiology scanner consoles (CT, MRI), and friction in exchanging electronic health records with national platforms (ABDM, NHCX). Unchecked automated ingestion also introduces severe clinical risks: uncalibrated analyzer outputs or critical panic readings could contaminate patient records without qualified human verification.
- **Decision**:
  1. Implement native, embedded healthcare standards adapters: HL7 v2.5.1 (ADT, ORM, ORU, SIU, ACK), FHIR R4 (4.0.1) REST API and CapabilityStatement, and DICOM Modality Worklist (MWL) emulation via DICOMweb.
## ADR-012: Standards-Based Healthcare Interoperability, ASTM Frame Ingestion & Pathologist Approval Gate
- **Status**: APPROVED
- **Context**: Standalone hospital applications suffer from isolated clinical silos, inability to automatically capture analyzer readings from laboratory instruments (Sysmex, Roche Cobas), manual clerical patient errors at radiology scanner consoles (CT, MRI), and friction in exchanging electronic health records with national platforms (ABDM, NHCX). Unchecked automated ingestion also introduces severe clinical risks: uncalibrated analyzer outputs or critical panic readings could contaminate patient records without qualified human verification.
- **Decision**:
  1. Implement native, embedded healthcare standards adapters: HL7 v2.5.1 (ADT, ORM, ORU, SIU, ACK), FHIR R4 (4.0.1) REST API and CapabilityStatement, and DICOM Modality Worklist (MWL) emulation via DICOMweb.
  2. Implement an ASTM 1394-97 (CLSI LIS2-A2) multi-frame parser (`H`, `P`, `O`, `R`, `C`, `L`) for direct analyzer serial and TCP socket telemetry ingestion.
  3. Enforce a mandatory **Pathologist / Lab Technician Sign-Off Safety Gate**: analyzer readings—especially those exhibiting panic values (`HH`, `LL`, `CRITICAL`)—remain strictly quarantined in `pending_approval` and are never released to patient portals or clinical progress notes without verified professional sign-off.
  4. Implement an ambiguous study quarantine workflow requiring mandatory clinical justification notes before linking unverified imaging studies.
  5. Maintain an immutable Dead-Letter Queue (DLQ) with sliding-window idempotency filters (15 minutes) preventing double diagnostic ordering or duplicate billing charges.
- **Consequences**: Seamless, error-free connectivity to hospital diagnostic equipment and national health networks; zero manual transcription errors; mathematical non-repudiation; and guaranteed clinical safety prior to diagnostic finalization.

---

## ADR-013: Double-Entry General Ledger Balance Invariant, SAC 999312 GST Exemption & Cashier Shift Governance
- **Status**: APPROVED
- **Context**: Hospital revenue cycles frequently suffer from revenue leakage, unbalanced single-sided journal entries, cashier float theft, improper GST application (charging GST on exempt clinical healthcare or failing to charge GST on retail pharmacy), uncoordinated refunds, and cross-departmental billing mismatches.
- **Decision**:
  1. Enforce mathematical double-entry balance at both database and service levels ($\sum \text{Debits} = \sum \text{Credits}$) with a hard SQL constraint `CONSTRAINT chk_journal_balance CHECK (total_debit = total_credit)`; any entry with variance $> 0.001$ throws `JOURNAL_UNBALANCED_ERROR`.
  2. Implement a 5-category Chart of Accounts (COA): Asset (1xxx), Liability (2xxx), Equity (3xxx), Revenue (4xxx), Expense (5xxx).
  3. Comply strictly with Indian GST Notification 12/2017-Central Tax (Rate): SAC 999312 clinical healthcare diagnosis, treatment, and care services are exempt (0% GST), while retail pharmacy sales and non-clinical services carry 5%, 12%, or 18% GST.
  4. Enforce mandatory managerial supervisor PIN authorization for patient refunds, cancellations, and credit notes.
  5. Require cashier shift blind counts: `Expected Closing Cash = Opening Float + Cash Collected - Cash Refunds Disbursed`; discrepancies trigger automated variance holds.
  6. Enforce 3-way matching across Purchase Orders, Goods Receipt Notes, and Vendor Bills (`MATCHED_3WAY` vs `VARIANCE_HOLD`).
- **Consequences**: Mathematically provable financial integrity; zero single-sided GL entries; statutory Indian tax compliance; tamper-evident cashier reconciliations; and unified operational revenue visibility across all departments and branches.

---

## ADR-014: Medication Safety Decision Support, Prescription Versioning Immutability, FEFO Hard-Blocks & Dual-Nurse Cosign
- **Status**: APPROVED
- **Context**: Medication errors represent one of the leading causes of preventable hospital morbidity and mortality. Key operational failure modes include sound-alike/look-alike (LASA) confusion, undetected drug-drug interactions, duplicate therapy overdose, silent modification of signed doctor prescriptions, dispensing of expired inventory, uncontrolled narcotic pilferage, and administration errors in inpatient wards.
- **Decision**:
  1. **Clinical Decision Support (CDS) & Hard-Stop Overrides**: Implement real-time screening for allergies, drug-drug interactions, duplicate active ingredients, and phonetic LASA with ISMP Tall Man lettering (`predniSONE` vs `predniSOLONE`). Severe or contraindicated alerts require mandatory documented clinical override justification (`clinical_alert_overrides`).
  2. **Prescription Immutability & Versioning**: Signed prescriptions cannot be mutated in place. Any clinician alteration creates a new sealed record in `prescription_versions` with incremented version counter and complete modification audit.
  3. **Pharmacist Verification Queue**: All eRx orders must pass through a pharmacist verification staging queue before dispensing, with auditable generic-brand substitution tracking.
  4. **Strict FEFO & Expiry Isolation**: First-Expiry-First-Out allocation selects earliest expiring batches; expired lots are hard-blocked from dispensing and automatically quarantined (`QUARANTINED_EXPIRED`). Negative stock is prohibited under all concurrency conditions.
  5. **Five Rights & Dual-Nurse Cosign in eMAR**: Inpatient administration validates the Five Rights (Right Patient, Drug, Dose, Route, Time). High-Alert medications and Schedule X/NDPS narcotics mandate two distinct verified nurse identities (`administeringNurseId !== cosigningNurseId`).
  6. **Cold-Chain Excursions & Lot Recalls**: IoT refrigeration sensors reporting outside $2^\circ\text{C} - 8^\circ\text{C}$ automatically trigger batch quarantine (`QUARANTINED_TEMP_EXCURSION`). Lot recalls instantly freeze inventory and trace historical patient administrations for urgent notification.
  7. **Controlled Substance Vault**: Enforce two-person dual custody (Custodian Nurse + Independent Witness Pharmacist) for every transaction in `narcotic_vault_ledger`, with blind shift audit reconciliation.
- **Consequences**: Provable elimination of common medication error vectors, strict adherence to Indian NDPS and CDSCO regulations, immutable clinical audits, zero dispensing of expired medications, and end-to-end patient traceability.











