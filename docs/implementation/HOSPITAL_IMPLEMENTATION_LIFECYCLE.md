# ASRTAVA Hospital Implementation Lifecycle (18-Stage State Machine)

## 1. Overview

The ASRTAVA Implementation Lifecycle is an 18-stage, deterministic state machine that governs the deployment of the ASRTAVA Hospital Management Platform for newly onboarded healthcare organizations. Every stage transition is recorded with timestamped audit entries (`actorId`, `actorRole`, `notes`, `fromStage`, `toStage`).

```
+---------------------------------------------------------------------------------------------------------+
|                                    18-STAGE IMPLEMENTATION STATE MACHINE                                 |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  [01. lead_prospect]                                                                                    |
|          │                                                                                              |
|          ▼                                                                                              |
|  [02. commercial_agreement_pending] ──► Commercial Terms & Perpetual Scope Agreed                       |
|          │                                                                                              |
|          ▼                                                                                              |
|  [03. license_confirmed]            ──► Perpetual License Key Issued & Cryptographically Bound          |
|          │                                                                                              |
|          ▼                                                                                              |
|  [04. onboarding_initiated]         ──► Project Team Assigned, Kickoff Workshop Scheduled               |
|          │                                                                                              |
|          ▼                                                                                              |
|  [05. requirements_gathering]       ──► Workflows, Formularies & Local Tariffs Cataloged                |
|          │                                                                                              |
|          ▼                                                                                              |
|  [06. infrastructure_assessment]    ──► Hardware, Sizing, Network & Air-Gapped Resiliency Inspected     |
|          │                                                                                              |
|          ▼                                                                                              |
|  [07. environment_preparation]      ──► Local Edge Cluster / Cloud VPC / DB Instances Provisioned       |
|          │                                                                                              |
|          ▼                                                                                              |
|  [08. installation_in_progress]     ──► Core Platform Binaries, Migrations & Services Deployed           |
|          │                                                                                              |
|          ▼                                                                                              |
|  [09. configuration_in_progress]    ──► Departments, Wards, Beds, Doctors, Tariffs & Integrations Config|
|          │                                                                                              |
|          ▼                                                                                              |
|  [10. data_migration]               ──► Dry-Run Validation ──► Human Approval ──► Production Reconciled |
|          │                                                                                              |
|          ▼                                                                                              |
|  [11. user_training]                ──► Doctors, Nurses, Admin, Pharmacy Trained (>= 80% Cert Gate)     |
|          │                                                                                              |
|          ▼                                                                                              |
|  [12. uat]                          ──► 16 Operational Domains Executed (0 Critical Defects Gate)       |
|          │                                                                                              |
|          ▼                                                                                              |
|  [13. go_live_readiness]            ──► 14 Mandatory Readiness Gates Evaluated                          |
|          │                                                                                              |
|          ▼                                                                                              |
|  [14. production_go_live]           ──► MANDATORY DUAL SIGN-OFF (Hospital Admin + ASRTAVA Lead)         |
|          │                                                                                              |
|          ▼                                                                                              |
|  [15. hypercare_initial_support]    ──► 30-Day SLA Rapid-Response Support & High-Priority Ticketing     |
|          │                                                                                              |
|          ▼                                                                                              |
|  [16. implementation_completed]     ──► Formal Handover to Customer & Standard AMC / Support            |
|                                                                                                         |
|  * Exception States:                                                                                    |
|  [17. on_hold]   - Transitioned if blockers arise (infrastructure delay, client restructuring)          |
|  [18. cancelled] - Commercial or legal termination                                                      |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Stage Definitions, Transition Gates & Deliverables

| Stage Code | Stage Name | Mandatory Prerequisite Gates | Required Deliverables |
|---|---|---|---|
| `lead_prospect` | Lead Prospect | Prospective hospital identified | Initial scoping questionnaire |
| `commercial_agreement_pending` | Commercial Agreement Pending | Commercial proposal delivered | Perpetual licensing contract |
| `license_confirmed` | License Confirmed | Payment milestone cleared | Signed RSA-4096 license token |
| `onboarding_initiated` | Onboarding Initiated | Kickoff workshop conducted | Implementation Charter & RACI |
| `requirements_gathering` | Requirements Gathering | Departmental interviews held | Hospital Requirements Catalog |
| `infrastructure_assessment` | Infrastructure Assessment | Hardware & network benchmarked | Infrastructure Assessment Report |
| `environment_preparation` | Environment Preparation | Server OS & Docker cluster configured | Environment Health Checklist |
| `installation_in_progress` | Installation in Progress | Database migrations executed | System Readiness Probe (200 OK) |
| `configuration_in_progress` | Configuration in Progress | Departments, beds & tariffs loaded | Master Data Sign-Off Document |
| `data_migration` | Data Migration | Dry-run preview verified clean | Data Migration Reconciliation Report |
| `user_training` | User Training | >= 80% passing grade achieved | Role Training Certifications |
| `uat` | User Acceptance Testing | 16 domains tested, 0 critical defects | Signed UAT Acceptance Certificate |
| `go_live_readiness` | Go-Live Readiness | All 14 mandatory readiness gates green | Go-Live Readiness Evaluation Report |
| `production_go_live` | Production Go-Live | Dual sign-off registered | Dual Go-Live Authorization Certificate |
| `hypercare_initial_support` | Hypercare Initial Support | Live production cutover completed | 30-Day Hypercare Incident Logs |
| `implementation_completed` | Implementation Completed | 0 open critical/high tickets | Formal Support Handover Protocol |
| `on_hold` | On Hold | Reason for suspension documented | Mitigation & Resumption Plan |
| `cancelled` | Cancelled | Contractual termination invoked | Data Archival & Teardown Protocol |

---

## 3. Strict Transition Rules & Guardrails

1. **Gate Enforcement**: The system strictly prevents transitions to `production_go_live` unless:
   - All 14 mandatory checklist gates are marked `is_verified = true`.
   - Open critical UAT defects = 0.
   - Dual sign-off credentials (`hospitalAdminUserId` AND `asrtavaLeadUserId`) are verified.
2. **Reversibility**: If unexpected hardware failure or critical clinical risk occurs during cutover, the system can revert to `go_live_readiness` or transition to `on_hold` with an explicit audit justification.
3. **Hypercare Expiration**: The 30-day hypercare window automatically tracks `hypercare_ends_at`. The project cannot be marked `implementation_completed` if any critical hypercare tickets remain open.

