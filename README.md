# ASRTAVA: Enterprise Multi-Tenant SaaS Hospital Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Multi--AZ-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED.svg)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-ap--south--1%20Mumbai-FF9900.svg)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

ASRTAVA is an enterprise-grade, multi-tenant SaaS Hospital Management System (HMS) architected for modern healthcare ecosystems, multi-specialty hospitals, clinic chains, medical practitioners, and patients. It provides end-to-end clinical workflows, departmental operations, third-party integrations, advanced analytics, strict tenant isolation, and regulatory compliance (DPDP Act 2023, ABDM/NDHM, HIPAA-aligned, NMC RMP 2023).

---

## 1. System Topology & Architecture

ASRTAVA is designed as a high-throughput, low-latency modular monolith with isolated frontend portals, mobile applications, and a centralized TypeScript backend:

```
                                  [ Internet / Mobile Clients / Hospital Staff ]
                                                        |
                                                        v
                                       [ AWS Route53 + CloudFront CDN ]
                                                        |
                                        +---------------+---------------+
                                        |                               |
                                        v                               v
                         [ Web Portal (Nginx 1.27) ]      [ Application Load Balancer ]
                             (S3 / ECS / CloudFront)              (AWS ALB - TLS 1.3)
                                                                        |
                                                                        v
                                                         [ Backend API Cluster (ECS Fargate) ]
                                                            (Node.js 22 LTS / Express 4)
                                                                        |
                                    +-------------------+---------------+-------------------+
                                    |                   |                                   |
                                    v                   v                                   v
                       [ PostgreSQL 16 Multi-AZ ] [ Redis 7 ElastiCache ]           [ AWS S3 Object Storage ]
                         (Encrypted at Rest KMS)     (BullMQ Queues & Caching)       (WORM Compliance Lock)
```

### Component Structure
- **Frontend Portal (`apps/web-portal`)**: Role-based web portals for Super Admins, Hospital Admins, Doctors, Nurses, Pharmacists, Lab Technicians, Radiologists, Billing Staff, and Patients. Built with React 19, TypeScript, Tailwind CSS, Lucide Icons, and Vite.
- **Patient Mobile App (`apps/patient-mobile`)**: Native mobile application for Android (AAB) and iOS (IPA) built with React Native and TypeScript, featuring appointment booking, telemedicine consults, lab report downloads, and secure authentication.
- **Backend API (`backend`)**: Centralized Node.js 22 & Express REST API with 20 domain gateways, enterprise security middleware, dynamic multi-tenant schema isolation, automated audit logging, Prometheus `/metrics`, and `/ready` probes.
- **Infrastructure (`infra`)**: Multi-AZ AWS Infrastructure as Code (Terraform), Docker containerization, automated PowerShell backup/restore pipelines, and GitHub Actions CI/CD workflows.

---

## 2. Release Candidate Documentation (Stage 15 Index)

ASRTAVA Release Candidate 1 (RC1) includes 20 comprehensive launch and governance specifications located in [`docs/release/`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release):

| Document | Purpose & Verification Scope |
| :--- | :--- |
| [`FINAL_PROJECT_AUDIT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/FINAL_PROJECT_AUDIT.md) | Exhaustive multi-disciplinary audit of all 15 roadmap stages and code evidence |
| [`MASTER_REQUIREMENTS_TRACEABILITY.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/MASTER_REQUIREMENTS_TRACEABILITY.md) | 40-requirement traceability matrix mapping requirements to code, tests, and owners |
| [`SYSTEM_INTEGRATION_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/SYSTEM_INTEGRATION_REPORT.md) | Modular monolith architecture verification, inter-process communication, ADRs |
| [`PORTAL_VERIFICATION_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/PORTAL_VERIFICATION_REPORT.md) | Detailed verification of all 12 role-specific portals and access control matrices |
| [`END_TO_END_WORKFLOW_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/END_TO_END_WORKFLOW_REPORT.md) | Validation of Scenarios A through H (OPD, IPD, Pharmacy, Lab, Radiology, Billing, SaaS, Mobile) |
| [`DATABASE_INTEGRITY_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/DATABASE_INTEGRITY_REPORT.md) | Relational 3NF/BCNF constraints, sequential migrations 001-018, zero orphan checks |
| [`FINAL_SECURITY_ASSESSMENT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/FINAL_SECURITY_ASSESSMENT.md) | Zero Critical / Zero High security audit, RLS kernel isolation, JIT support security |
| [`FINAL_TEST_RESULTS.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/FINAL_TEST_RESULTS.md) | Complete test runner output: 118 passing tests across 12 suites, frontend chunk audit |
| [`INTEGRATION_STATUS_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/INTEGRATION_STATUS_REPORT.md) | Technical assessment of WhatsApp, SMS, Razorpay/Stripe, HL7 v2.5.1, FHIR R4, PACS, ABDM |
| [`REPORTING_VALIDATION_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/REPORTING_VALIDATION_REPORT.md) | Hospital KPI validation (BOR, ALOS, GCR), SQL injection defense, CSV export engine |
| [`PRODUCTION_READINESS_ASSESSMENT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/PRODUCTION_READINESS_ASSESSMENT.md) | Cloud infrastructure certification, FinOps models, staging deployment rehearsal |
| [`HOSPITAL_ONBOARDING_GUIDE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/HOSPITAL_ONBOARDING_GUIDE.md) | 20-step onboarding lifecycle, pre-flight safety locks, department setup wizard |
| [`OPERATIONS_AND_SUPPORT_GUIDE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/OPERATIONS_AND_SUPPORT_GUIDE.md) | Tier 1-3 support workflows, P0-P3 incident runbooks, Zero-Standing-Privilege JIT access |
| [`LEGAL_AND_PRIVACY_LAUNCH_CHECKLIST.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/LEGAL_AND_PRIVACY_LAUNCH_CHECKLIST.md) | DPDP Act 2023 compliance, NMC RMP 2023 record retention, Terms of Service drafts |
| [`COMMERCIAL_LAUNCH_CHECKLIST.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/COMMERCIAL_LAUNCH_CHECKLIST.md) | Commercial subscription packaging (Silver, Gold, Plat), quota gates, billing separation |
| [`RELEASE_MANAGEMENT_POLICY.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/RELEASE_MANAGEMENT_POLICY.md) | Semantic versioning, 15-step production release workflow, Change Advisory Board (CAB) |
| [`PRODUCTION_SMOKE_TEST_REPORT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/PRODUCTION_SMOKE_TEST_REPORT.md) | 15-point smoke test verification protocol with Zero Clinical Pollution in live hospitals |
| [`FINAL_LAUNCH_GATE_CHECKLIST.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/FINAL_LAUNCH_GATE_CHECKLIST.md) | 7 mandatory production launch gates and formal Release Candidate decision record |
| [`KNOWN_LIMITATIONS.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/KNOWN_LIMITATIONS.md) | Transparent documentation of operational boundaries, ABDM dependencies, and workarounds |
| [`POST_LAUNCH_ROADMAP.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/release/POST_LAUNCH_ROADMAP.md) | Future engineering horizon (v1.1 to v1.3): Live ABDM, edge DICOM, clinical AI scribes |

---

## 3. Production Deployment & Documentation Index

ASRTAVA includes 21 operational and architectural specifications in [`docs/deployment/`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment):

| Document | Description |
| :--- | :--- |
| [`DEPLOYMENT_ARCHITECTURE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/DEPLOYMENT_ARCHITECTURE.md) | High-level cloud architecture, multi-AZ networking, and component layout |
| [`CLOUD_PROVIDER_EVALUATION.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/CLOUD_PROVIDER_EVALUATION.md) | Comparison of AWS, GCP, Azure, and Indian cloud providers with DPDP compliance |
| [`ENVIRONMENT_CONFIGURATION.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/ENVIRONMENT_CONFIGURATION.md) | Environment variable schemas for Development, Staging, and Production |
| [`DOCKER_DEPLOYMENT_GUIDE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/DOCKER_DEPLOYMENT_GUIDE.md) | Multi-stage Dockerfiles, non-root users, compose orchestration, and healthchecks |
| [`FRONTEND_DEPLOYMENT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/FRONTEND_DEPLOYMENT.md) | Static hosting, CloudFront CDN, custom Nginx configurations, and cache policies |
| [`BACKEND_DEPLOYMENT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/BACKEND_DEPLOYMENT.md) | AWS ECS Fargate, resource scaling, task definitions, and zero-downtime rolling updates |
| [`DATABASE_PRODUCTION_SETUP.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/DATABASE_PRODUCTION_SETUP.md) | RDS PostgreSQL 16 Multi-AZ, PgBouncer pooling, KMS encryption, and maintenance |
| [`REDIS_AND_WORKERS_SETUP.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/REDIS_AND_WORKERS_SETUP.md) | ElastiCache Redis cluster, BullMQ background queues, and eviction strategies |
| [`OBJECT_STORAGE_CONFIGURATION.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/OBJECT_STORAGE_CONFIGURATION.md) | S3 WORM Object Lock in Compliance Mode, medical record retention, and Glacier tiers |
| [`DOMAIN_DNS_TLS_CONFIGURATION.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/DOMAIN_DNS_TLS_CONFIGURATION.md) | Route53 DNS, wildcard subdomains (`*.asrtava.com`), ACM TLS 1.3, and HSTS |
| [`CI_CD_PIPELINE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/CI_CD_PIPELINE.md) | GitHub Actions CI/CD workflows, automated tests, bundle audits, and staging/prod releases |
| [`PRODUCTION_RELEASE_PROCESS.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/PRODUCTION_RELEASE_PROCESS.md) | Step-by-step production rollout procedure, approval gates, and verification checklists |
| [`ROLLBACK_AND_RECOVERY.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/ROLLBACK_AND_RECOVERY.md) | Automated canary rollbacks, manual image rollbacks, and Point-in-Time Database Recovery |
| [`SECRETS_MANAGEMENT.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/SECRETS_MANAGEMENT.md) | AWS Secrets Manager, SSM Parameter Store, IAM roles, and automated credential rotation |
| [`MONITORING_AND_ALERTING.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/MONITORING_AND_ALERTING.md) | Prometheus metrics, CloudWatch alarms, structured JSON logging, and alert routing |
| [`BACKUP_AND_DISASTER_RECOVERY.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/BACKUP_AND_DISASTER_RECOVERY.md) | RPO < 5 min, RTO < 30 min, cross-region replication (Mumbai -> Hyderabad), and disaster drills |
| [`CAPACITY_PLANNING.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/CAPACITY_PLANNING.md) | Sizing models for 10, 50, and 200 concurrent hospitals, memory/storage projections |
| [`CLOUD_COST_ESTIMATION.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/CLOUD_COST_ESTIMATION.md) | FinOps breakdown for Starter, Growth, and Enterprise tiers with Reserved Instance savings |
| [`INFRASTRUCTURE_AS_CODE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/INFRASTRUCTURE_AS_CODE.md) | Terraform modular architecture, state management in S3 + DynamoDB, and execution plan |
| [`MOBILE_RELEASE_GUIDE.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/MOBILE_RELEASE_GUIDE.md) | Google Play Store AAB & Apple App Store TestFlight/IPA releases, signing, and permissions |
| [`PRODUCTION_OPERATIONS_RUNBOOK.md`](file:///c:/Users/madha/Desktop/Medical_Project/docs/deployment/PRODUCTION_OPERATIONS_RUNBOOK.md) | Routine checklists, P0-P3 incident SLAs, failover simulations, and operational procedures |

---

## 4. Quick Start & Local Development

### Prerequisites
- Node.js 22 LTS or later
- npm 10+
- Docker & Docker Compose (optional, for containerized local development)
- PostgreSQL 16 (local or Docker)

### Option A: Running Locally with Node.js
```bash
# 1. Clone repository
git clone https://github.com/asrtava/asrtava-hms.git
cd Medical_Project

# 2. Configure Environment
cp .env.example backend/.env

# 3. Start Backend Server
cd backend
npm install
npm run build
node dist/server.js   # Listens on http://localhost:5000

# 4. Start Web Portal (in a separate terminal)
cd apps/web-portal
npm install
npm run dev           # Serves on http://localhost:5173
```

### Option B: Running with Docker Compose
```bash
# Build and start all services (PostgreSQL 16, Redis 7, Backend, Web Portal)
docker compose up -d --build

# Verify running containers
docker compose ps
```

---

## 5. Automated Testing & Quality Assurance

ASRTAVA maintains an automated testing suite across backend domains, security middleware, database constraints, and frontend chunk validations:

```bash
# Run complete test suite (118 tests across 12 suites)
cd backend
npm test

# Run frontend production build & chunk validation (< 500 kB per chunk)
cd apps/web-portal
npm run build

# Run patient mobile TypeScript validation
cd apps/patient-mobile
npx tsc --noEmit
```

---

## 6. Security & Regulatory Compliance

- **Indian Data Residency (DPDP Act 2023)**: Primary infrastructure deployed in AWS `ap-south-1` (Mumbai) with disaster recovery in `ap-south-2` (Hyderabad).
- **Medical Record Immutability**: Medical charts and diagnostic reports are archived in AWS S3 with Object Lock in Compliance Mode (WORM - Write Once, Read Many).
- **Transport & Storage Encryption**: Enforced TLS 1.3 with AES-256-GCM cipher suites, RDS KMS storage encryption, and strict Content Security Policy (CSP).
- **Comprehensive Audit Trails**: Immutable audit log entries recording tenant ID, user ID, client IP, action type, and timestamps for every administrative, clinical, and billing transaction.

---

## 7. License & Support

ASRTAVA is proprietary enterprise healthcare software. All rights reserved.  
For enterprise support or deployment assistance, contact: `operations@asrtava.com`.
