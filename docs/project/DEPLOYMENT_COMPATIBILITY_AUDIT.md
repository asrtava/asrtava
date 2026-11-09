# ASRTAVA — Multi-Deployment Compatibility Audit

## 1. Executive Summary

This audit assesses the ASRTAVA Hospital Management System across all three confirmed deployment topologies:
1. **Cloud-Hosted Deployment** (ASRTAVA-managed or customer-managed cloud VPC).
2. **On-Premises Deployment** (Customer-operated private data center or local edge server).
3. **Hybrid Deployment** (Local edge server for zero-latency clinical care with approved cloud synchronization).

The core business model remains a **One-Time Perpetual Software License** across all three deployment models, preserving multi-tenancy, strict data isolation, and customer data autonomy without mandatory SaaS subscription renewals.

---

## 2. Deployment Compatibility Matrix

| Architectural Layer | Cloud-Hosted Deployment | On-Premises Deployment | Hybrid Deployment | Compatibility Status |
|:---|:---|:---|:---|:---:|
| **Frontend Web Portal** (`apps/web-portal`) | Nginx in Cloud ECS / CloudFront CDN | Local Nginx container serving LAN IP / Intranet FQDN | Local Nginx for staff; Cloud CDN for Patient Web | **COMPATIBLE** |
| **Patient Mobile App** (`apps/patient-mobile`) | Connects to Cloud API Gateway | Local LAN WiFi / Reverse Proxy | Connects to Cloud Sync Gateway | **COMPATIBLE** |
| **Backend API Gateway** (`backend/src`) | Multi-tenant Express API in Kubernetes / ECS | Standalone containerized Node.js instance on local server | Dual-instance: Edge API (Clinical) + Cloud API (Patient) | **COMPATIBLE** |
| **Database Engine** | PostgreSQL 16 Multi-AZ with RLS | Local PostgreSQL 16 instance (Bare-metal or Docker) | Local PostgreSQL (Master Clinical) + Cloud Replica | **COMPATIBLE** |
| **Document & DICOM Storage** | AWS S3 / MinIO Object Storage | Local File System / Hospital NAS mount | Local NAS with encrypted cloud archive backup | **NEEDS ADAPTER** |
| **Messaging & Notifications** | SMS (MSG91), WhatsApp, SendGrid, FCM | Local file queue / Internal SMTP (Air-gapped) | Edge generates in-app; Cloud dispatches SMS/WhatsApp | **NEEDS ADAPTER** |
| **License Validation** | Online verification against Central DB | Offline cryptographic claims token (`.asrtalic`) | Local claims cache + periodic background validation | **COMPATIBLE** |
| **Clinical Continuity** | Dependent on cloud uptime | 100% resilient against external internet outages | 100% resilient; local transactions queue for sync | **COMPATIBLE** |
| **Emergency Fail-Safe** | Hardcoded fail-open bypass | Hardcoded fail-open bypass | Hardcoded fail-open bypass | **COMPATIBLE** |

---

## 3. Cloud-Specific Assumptions Identified & Remediation Plan

### 1. Object & Document Storage Assumption
- **Current Assumption**: Medical documents, prescriptions, and radiology DICOM files assumed S3-compatible presigned URLs.
- **On-Premises Impact**: Hospitals operating air-gapped without internet access cannot reach AWS S3.
- **Remediation**: Establish `IStorageAdapter` interface with two swappable implementations:
  1. `S3StorageAdapter`: For AWS S3, Cloudflare R2, or MinIO.
  2. `LocalStorageAdapter`: For local directory storage or hospital NAS with server-side AES-256 file encryption.

### 2. Telecom & External Gateway Assumption
- **Current Assumption**: Notifications assume external internet connectivity to telecom aggregators (MSG91, WhatsApp Business API).
- **On-Premises Impact**: Unhandled network timeouts when dispatching SMS from an air-gapped server.
- **Remediation**: Establish `INotifierAdapter` interface:
  1. `GatewayNotifierAdapter`: For production cloud environments.
  2. `LocalMockNotifierAdapter`: Stores notifications in an internal database outbox queue without network timeouts.

### 3. Split-Brain & Hybrid Synchronization Risk
- **Current Assumption**: Single centralized PostgreSQL database.
- **Hybrid Challenge**: If an on-premises hospital loses internet for 3 days and reconnects, bidirectional blind synchronization could overwrite clinical records.
- **Remediation**: 
  - Define **Local Hospital Edge as the Absolute Source of Truth** for Clinical Care (OPD, IPD, Beds, FEFO Dispensing, Vital Signs).
  - Define **Cloud as the Source of Truth** for Global Directory, Public Patient Registrations, and Super Admin Governance.
  - Implement **Deterministic Last-Write-Wins (LWW) with Version Vectors** and an **Append-Only Clinical Audit Policy** (clinical amendments append versioned records, never overwrite).
  - Enforce **DPDP Act 2023 PII Redaction** before synchronizing hospital data to the cloud.

---

## 4. Architectural Invariants Across All Deployments
1. **Perpetual Software Ownership**: A one-time purchase grants perpetual operation rights regardless of deployment model.
2. **Clinical Safety Guarantee**: Zero patient lockout, zero emergency care denial, zero clinical record deletion under any commercial or network circumstance.
3. **Strict Data Isolation**: Patient records in shared cloud remain separated by PostgreSQL RLS; on-premises installations enjoy physical boundary isolation.

