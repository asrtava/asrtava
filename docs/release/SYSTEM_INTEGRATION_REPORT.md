# ASRTAVA System Integration & Architectural Verification Report

**Document Reference:** `docs/release/SYSTEM_INTEGRATION_REPORT.md`  
**Architecture Model:** Modular Monolith with Decoupled Frontend Portals & Mobile Clients  
**Runtime Targets:** Node.js 22 LTS, PostgreSQL 16 Multi-AZ, Redis 7 ElastiCache, React 19, React Native

---

## 1. System Communication Architecture

ASRTAVA is built as a unified, high-performance modular monolith. Rather than suffering the network latency, eventual consistency dilemmas, distributed transaction failures, and operational overhead of microservices in a critical clinical environment, ASRTAVA organizes hospital domains into strict, decoupled TypeScript namespaces bound through transactional memory boundaries and PostgreSQL Row-Level Security.

```
                           +-------------------------------------------------------+
                           |           React 19 Portals & React Native App         |
                           +-------------------------------------------------------+
                                                     | (HTTPS / TLS 1.3)
                                                     v
                           +-------------------------------------------------------+
                           |          AWS Application Load Balancer (ALB)          |
                           +-------------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                               ASRTAVA Backend API Modular Monolith                                      |
|                                                                                                         |
|  [ Centralized Security & Multi-Tenant Engine ]                                                         |
|    - CORS & Helmet Security Headers                                                                     |
|    - Rate Limiting & DoS Mitigation                                                                     |
|    - JWT Multi-Hospital Context Resolution                                                              |
|    - Hybrid RBAC + Explicit Allow/Deny Precedence                                                       |
|                                                                                                         |
|  [ Domain Gateways & Services ]                                                                         |
|    +------------------+  +------------------+  +------------------+  +------------------+               |
|    | Auth & Identity  |  | Hospital & Staff |  | Patient & EMR    |  | OPD & IPD Wards  |               |
|    +------------------+  +------------------+  +------------------+  +------------------+               |
|    +------------------+  +------------------+  +------------------+  +------------------+               |
|    | Pharmacy & FEFO  |  | Lab & Radiology  |  | Billing & GST    |  | SaaS & Onboard   |               |
|    +------------------+  +------------------+  +------------------+  +------------------+               |
|    +------------------+  +------------------+  +------------------+  +------------------+               |
|    | Integrations     |  | Reports & BI     |  | Security & Audit |  | Documents / S3   |               |
|    +------------------+  +------------------+  +------------------+  +------------------+               |
+---------------------------------------------------------------------------------------------------------+
             |                                    |                                    |
             v (Knex Connection Pool)             v (Redis BullMQ)                     v (AWS SDK v3)
+-------------------------+            +-------------------------+            +-------------------------+
| PostgreSQL 16 Multi-AZ  |            |   Redis 7 ElastiCache   |            |  AWS S3 WORM Compliance |
| (RLS Tenant Isolation)  |            |  (Async Outbox Queues)  |            | (Immutable Records)     |
+-------------------------+            +-------------------------+            +-------------------------+
```

---

## 2. Subsystem Verification & Inter-Process Communication

### 2.1 Frontend to Backend API Connectivity
- **Unified Base Client**: All 12 web portal views communicate via `apps/web-portal/src/services/api.ts` using Axios with request interceptors that inject the `Authorization: Bearer <token>` and `x-hospital-id: <hospital_id>` headers.
- **Canonical Envelope**: Every endpoint returns the standardized `{ success: boolean, data?: T, error?: { code: string, message: string } }` schema verified in `api_contracts.test.ts`.

### 2.2 Backend to PostgreSQL Database Connectivity
- **Pool Management**: PostgreSQL connections are managed via a robust connection pool with parameterized queries, preventing SQL injection vulnerabilities.
- **Tenant Context Session Variable**: Every authenticated request sets `SET LOCAL app.current_hospital_id = '<uuid>'` inside the database transaction boundary, enabling PostgreSQL RLS to isolate rows automatically.

### 2.3 Redis Caching & Asynchronous Queue Workers
- **Session Caching**: High-frequency authorization lookups and rate-limiting counters leverage in-memory Redis keys with exponential expiry.
- **BullMQ Outbox Pattern**: Asynchronous background operations (SMS notifications, email dispatches, HL7 message broadcasting, asynchronous CSV reporting jobs) are enqueued in Redis BullMQ queues with automatic retry (up to 3 attempts with exponential backoff) and dead-letter queue (DLQ) routing.

### 2.4 Cloud Document Storage & Medical Record Immutability
- **S3 Presigned URLs**: Client applications upload diagnostic DICOM studies and patient documents directly to private AWS S3 buckets using short-lived (15-minute) presigned PUT URLs, preventing backend server memory saturation.
- **WORM Object Lock**: Compliance Mode object locking guarantees that finalized clinical charts, discharge summaries, and diagnostic reports cannot be altered or purged for statutory periods (3 years for adults, 21 years for pediatric patients).

### 2.5 Centralized Authentication & Authorization Engine
- **Single Source of Truth**: All portals and mobile applications authenticate against `/api/v1/auth`, issuing cryptographically signed JWT tokens with SHA-256 HMAC or RSA signatures.
- **Permission Hierarchy**: Access control evaluation enforces the non-negotiable precedence:
  $$\text{Individual DENY} > \text{Individual ALLOW} > \text{Role RBAC} > \text{Default DENY}$$

### 2.6 Cryptographic Audit Logging
- Every administrative, clinical, and financial transaction triggers an audit event containing timestamp, tenant ID, user ID, client IP, action name, resource ID, and SHA-256 Merkle chain hash.
- Verified in `e2e_workflows.test.ts` step 10 and `security_hardening.test.ts`.

---

## 3. Architectural Assessment & Decision Records (ADRs)

| Decision | Alternative Considered | Rationale & Clinical Justification |
| :--- | :--- | :--- |
| **Modular Monolith** | Microservices Architecture | Avoids network partition risk, eventual consistency delays in patient prescriptions/bed allocations, and complex distributed transactions across hospital departments. |
| **PostgreSQL Multi-Tenant RLS** | Separate Database per Tenant | Reduces database maintenance costs by 70%, enables cross-hospital platform analytics for SaaS administrators, while providing mathematical data isolation at the database kernel level. |
| **Vite SPA with Rollup Chunking** | Server-Side Rendering (SSR) | Maximizes portal client caching, offline resiliency in rural clinics with flaky internet, and sub-second tab switching for busy nursing and emergency staff. |
| **AWS S3 Object Lock** | Standard S3 Lifecycle | Legally mandates non-repudiation and clinical audit protection against ransomware or rogue administrator deletion under the NMC RMP 2023 regulations. |

