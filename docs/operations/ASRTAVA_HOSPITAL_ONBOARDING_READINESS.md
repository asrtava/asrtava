# ASRTAVA Hospital Onboarding & Implementation Readiness Runbook

**Document Reference:** `docs/operations/ASRTAVA_HOSPITAL_ONBOARDING_READINESS.md`  
**Framework:** 14-Stage Enterprise Implementation Lifecycle & Dual-Dashboard Architecture  
**Modules Referenced:** `backend/src/modules/onboarding/`, `apps/web-portal/src/portals/onboarding/`  
**Status:** **VERIFIED IMPLEMENTED & COMPLIANT**

---

## 1. Executive Summary & Dual-Dashboard Architecture

Hospital onboarding is governed by a secure, collaborative dual-dashboard architecture:
1. **Platform Admin Implementation Console (`CustomerOnboardingView.tsx`):** Used by ASRTAVA implementation managers to oversee milestone progression, upload schema mapping rules, and validate readiness gates.
2. **Hospital Customer Implementation Workspace (`HospitalOnboardingWorkspace.tsx`):** Used by the hospital's executive sponsor, IT manager, and clinical leads to provide hospital master data, review data migration mappings, sign off on training, and give dual go-live approvals.
3. **Verified Authentication Boundary:** Possessing a project code alone **never** grants access. Resumption strictly requires verified identity (`lead_email`, `lead_password`) and confirmed membership in the customer organization (`1c7be09`).

---

## 2. The 14-Stage Hospital Onboarding Lifecycle

```
[ 01. Customer Registration ] ──► [ 02. Requirements & Sizing ] ──► [ 03. License Issuance ]
                                                                             │
                                                                             ▼
[ 06. Topology Deployment ] ◄── [ 05. Branch Configuration ] ◄── [ 04. Tenant Creation ]
         │
         ▼
[ 07. User Provisioning ] ──► [ 08. Role & Permission Setup ] ──► [ 09. Data Migration Pipeline ]
                                                                             │
                                                                             ▼
[ 12. Staff Training & UAT ] ◄── [ 11. Testing & Validation ] ◄── [ 10. Medical Device Interop ]
         │
         ▼
[ 13. Dual Go-Live Approval ] ──► [ 14. 30-Day Post-Go-Live Hypercare Stabilization ]
```

---

### Detailed Stage Specifications

#### Stage 01: Customer Registration & Contracting
- Formal registration of legal hospital entity, GSTIN, PAN, Clinical Establishment Act registration, and authorized signers.
- Identification of designated Customer Implementation Lead (`lead_email`, phone).

#### Stage 02: Requirements Assessment & Sizing
- Bed capacity census, operational departments, specialty clinics, OT suites, and daily OPD volume profiling.
- Network bandwidth audit and hardware architecture sizing (Cloud vs On-Premises vs Hybrid).

#### Stage 03: Perpetual License Issuance
- ASRTAVA Platform Admin generates cryptographically signed perpetual software license token (`ASR-LIC-YYYY-XXXXX`) and activation key bound to authorized locations, bed limits, and selected modules.

#### Stage 04: Organization & Tenant Provisioning
- Creation of isolated PostgreSQL tenant database partition with Row-Level Security (`FORCE RLS`) and dedicated storage prefix.

#### Stage 05: Hospital & Branch Hierarchy Configuration
- Configuration of Directed Acyclic Graph (DAG) facility hierarchy: Organization $\to$ Hospital Campus $\to$ Building $\to$ Floor $\to$ Department $\to$ Ward $\to$ Room $\to$ Bed.

#### Stage 06: Infrastructure Deployment & Installation
- Execution of containerized stack deployment via `docker-compose.prod.yml`, `docker-compose.onprem.yml`, or `docker-compose.hybrid.yml`.
- Schema initialization via `run_migrations.sh`.

#### Stage 07: Administrative User Provisioning
- Creation of initial primary Hospital Admin account. Generation of secure one-time account activation link.
- Hospital Admin creates departmental staff profiles (doctors, nurses, pharmacists, accountants).

#### Stage 08: Role & Permission Assignment
- Assignment of 12 role profiles. Configuration of department-specific ALLOW/DENY permission overrides following the strict rule: Explicit Deny > Explicit Allow > Role RBAC > Default Deny.

#### Stage 09: Legacy Data Migration Pipeline
- **Four-Step Safe Migration Protocol:**
  1. *Extract & Backup:* Full snapshot and backup of legacy hospital database.
  2. *Schema Mapping & Validation:* Mapping legacy tables to ASRTAVA FHIR/relational schemas via CSV/JSON ETL staging tables.
  3. *Reconciliation Dry-Run:* Automated reconciliation audit verifying record counts, financial balances, and patient UHID integrity without inserting active records.
  4. *Customer Validation & Sign-Off:* Hospital Medical Records Director inspects sample converted records and provides formal cryptographic signature before production commit.

#### Stage 10: Medical Device & Laboratory Interoperability
- Configuration of hospital lab analyzer ASTM 1394 serial ports, HL7 v2.5.1 MLLP gateways, and PACS DICOM modality connections.

#### Stage 11: End-to-End System Integration Testing
- Execution of automated test suites and real-world operational simulation scenarios (`tests/real_world_hospital_simulation.test.ts`) on the hospital's deployed instance.

#### Stage 12: Multi-Cadre Staff Training & UAT
- Department-by-department training workshops for doctors, nurses, receptionists, pharmacists, and billing executives.
- Hands-on execution of all 20 UAT test scripts using synthetic patient cases.

#### Stage 13: Dual Go-Live Authorization Gate
- Formal production go-live requires two independent digital authorizations:
  1. **ASRTAVA Implementation Director Sign-Off:** Certifies that all 14 technical readiness gates are green.
  2. **Hospital Medical Director Sign-Off:** Certifies that clinical workflows, data migration, and staff readiness are accepted.

#### Stage 14: Post-Go-Live Hypercare Stabilization
- 30-day on-site and remote hypercare monitoring with dedicated engineering standby, daily clinical reconciliation standups, and performance tuning.

---

## 3. Data Migration Integrity Safeguards

To prevent clinical data corruption during transition:
1. **Zero Raw Patient Data in Test Enclaves:** Demonstration and staging environments must exclusively use synthetic records generated by Faker or mock utilities.
2. **Permanent Rollback Archive:** Legacy database dumps and unedited source CSVs are archived in read-only WORM storage prior to ETL execution.
3. **Reconciliation Audit Report:** The migration pipeline generates an automated variance report:
   $$\text{Variance} = \text{Legacy Active Patients} - \text{ASRTAVA Imported Patients} == 0$$
   Any discrepancy $> 0$ automatically halts migration and rolls back database transaction.
