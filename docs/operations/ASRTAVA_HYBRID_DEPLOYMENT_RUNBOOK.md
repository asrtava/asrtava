# ASRTAVA Hybrid Edge-to-Cloud Deployment Runbook

**Document Reference:** `docs/operations/ASRTAVA_HYBRID_DEPLOYMENT_RUNBOOK.md`  
**Target Topology:** Local Hospital Edge Node with Encrypted Sync to Central Cloud Aggregator  
**Architectural Goal:** Zero-Latency Clinical Continuity with Central Enterprise Intelligence  
**Status:** **READY WITH DOCUMENTED PREREQUISITES**

---

## 1. Hybrid Architecture & Guiding Principles

The Hybrid deployment model combines the ultra-low latency and air-gapped resilience of an on-premises hospital server with the consolidated visibility of a multi-hospital cloud aggregator:

```
┌──────────────────────────────────────────────┐
│            HOSPITAL LOCAL EDGE               │
│  - Clinical Source of Truth                  │
│  - Zero-latency OPD, IPD, OT, LIS & Pharmacy │
│  - Operates 100% offline during WAN outages  │
│  - Transactional Outbox Buffer Queue         │
└──────────────────────┬───────────────────────┘
                       │ Encrypted mTLS Sync (Transactional Outbox)
                       │ DPDP PII Redaction & De-identification
                       ▼
┌──────────────────────────────────────────────┐
│           ENTERPRISE CLOUD AGGREGATOR        │
│  - Consolidated Multi-Branch Telemetry       │
│  - Longitudinal Analytics & EDW Mart         │
│  - Group-Level Financial Rollup              │
│  - Central Patient Portal Bridge             │
└──────────────────────────────────────────────┘
```

---

## 2. Fundamental Architectural Guardrails & Source-of-Truth Rules

### 2.1 Domain-Specific Source-of-Truth Hierarchy
To eliminate ambiguity and prevent split-brain inconsistencies, every data entity has an immutable source-of-truth master:

| Data Category | Designated Source of Truth | Sync Direction | Invariant & Mutation Policy |
| :--- | :---: | :---: | :--- |
| **Active Clinical Encounters & SOAP** | **Local Hospital Edge** | Edge $\to$ Cloud | The edge server is the sole clinical master. Cloud cannot mutate an active clinical encounter. |
| **eMAR & Medication Charting** | **Local Hospital Edge** | Edge $\to$ Cloud | Nursing administrations recorded on local tablets are definitive; never overwritten by cloud. |
| **Pharmacy Batches & Physical Stock** | **Local Hospital Edge** | Edge $\to$ Cloud | Physical inventory counted at the hospital store dictates available balances. |
| **Laboratory & Radiology Results** | **Local Hospital Edge** | Edge $\to$ Cloud | Pathologist/radiologist signatures committed at edge are final. Cloud receives sealed reports. |
| **Master Drug Catalog & Formularies** | **Enterprise Cloud** | Cloud $\to$ Edge | Centralized drug lists, LASA warning tables, and ICD-10 updates distribute downstream to edges. |
| **Enterprise Master Tariff Templates** | **Enterprise Cloud** | Cloud $\to$ Edge | Master hospital service rate schedules distribute downstream; local active invoices retain point-in-time rates. |

### 2.2 Strict Prohibition of Silent Clinical Overwrites
- **No Automatic Overwrites for Clinical Records:** Automatic resolution (e.g. Last-Write-Wins / LWW) is **strictly prohibited** for all patient clinical records (patient identity, allergies, medication orders, diagnoses, prescriptions, and clinical observations).
- **Conflict Detection Engine:** If concurrent edits or schema anomalies occur during synchronization of clinical data:
  1. The sync agent flags a `SYNC_CLINICAL_CONFLICT` event.
  2. The incoming cloud payload is **never** allowed to silently overwrite local clinical data.
  3. Both conflicting versions are preserved as chronological versioned addenda.
  4. The conflict is routed into the **Manual Clinical Reconciliation Queue** for review by the hospital Medical Records Department or treating physician.
- **Complete Audit Trail:** Every synchronization transaction logs the sending node, receiving node, before-state checksum, and after-state checksum in `outbox_sync_audit_log`.

### 2.3 Privacy & Data Minimization (DPDP Act 2023 Compliance)
- **No Silent Bulk Synchronization:** ASRTAVA **never** streams raw, unmasked hospital medical records into cloud infrastructure.
- **De-Identification & Pseudonymization Engine:** Before sync dispatch, the local edge agent scrubs Direct Identifiers (Patient Name, Full Address, Phone Number, Aadhaar Number). Demographics are linked solely via a cryptographic HMAC-SHA256 pseudonym hash (`pseudonym_hash`).
- **Telemetry-First Sync:** Only aggregated KPIs, financial summaries, bed census counts, and consented longitudinal records are transmitted upstream.

### 2.4 Transactional Outbox Pattern & Idempotency
- When a transaction occurs at the edge, a synchronization event is written to the local database table `outbox_sync_events` in the **exact same ACID transaction** as the clinical update.
- The local background sync worker polls `outbox_sync_events` and posts batches to the cloud aggregator using unique, deterministic `idempotency_key` headers (`SYNC-<EVENT_ID>-<HASH>`).
- If network connection is severed, events accumulate safely in the local PostgreSQL outbox without blocking local clinical workflows.
- Upon reconnection, events flush in strict chronological order with exponential backoff and jitter. Replayed duplicate payloads are safely acknowledged and ignored by the cloud receiver.

---

## 3. Conflict Detection and Resolution Rules

| Record Domain | Conflict Condition | Resolution Policy | Technical Implementation |
| :--- | :--- | :--- | :--- |
| **Clinical EMR & SOAP** | Concurrent edits or out-of-order sync | **Append Chronological Amendment + Manual Review** | EMR notes are immutable. Automatic overwrite strictly prohibited. Appends versioned addendum; flags conflict for clinician review. |
| **Patient Allergies & Warnings** | Discrepancy between edge and cloud records | **Safety-First Union (Most Restrictive)** | If either edge or cloud indicates an allergy, the system adopts the union of all allergies to prevent adverse drug events. |
| **Pharmacy Stock & Batch Balances** | Concurrent issue vs central transfer | **Edge Master Dominance** | Physical stock at the hospital site always dictates available balance. Cloud ledger reconciles against physical count. |
| **Administrative & Master Catalogs** | Group Admin edits tariff in cloud while local admin edits tariff | **Last-Write-Wins (LWW) with Audit** | Permitted **only** on non-clinical master templates. Timestamp comparison resolves collision; existing invoices remain locked. |
| **Doctor OPD Rosters** | Multi-branch booking collision | **Distributed Lock / Anti-Collision Gate** | Cross-branch booking requests query the central availability broker before confirming slot. |

---

## 4. Step-by-Step Hybrid Edge Deployment

### Step 4.1: Launch Edge Stack
Using `docker-compose.hybrid.yml`:
```bash
docker-compose -f docker-compose.hybrid.yml up -d
```

### Step 4.2: Configure Cloud Gateway Connection
In `/opt/asrtava/.env.hybrid`:
```ini
DEPLOYMENT_MODEL=hybrid
HYBRID_SYNC_ROLE=edge_node
CLOUD_GATEWAY_URL=https://sync.asrtava.com/api/v1/hybrid/sync
EDGE_NODE_ID=edge-node-mumbai-branch-01
EDGE_MTLS_CERT_PATH=/etc/asrtava/certs/edge.crt
EDGE_MTLS_KEY_PATH=/etc/asrtava/certs/edge.key
SYNC_BATCH_SIZE=100
SYNC_FLUSH_INTERVAL_MS=5000
```

### Step 4.3: Simulate WAN Outage and Resumption Test
1. Disconnect WAN interface or block outbound traffic to `CLOUD_GATEWAY_URL`.
2. Execute 10 inpatient vitals recordings and 5 pharmacy dispenses locally. Confirm all operations succeed instantly (`HTTP 200`).
3. Check local outbox: `SELECT COUNT(*) FROM outbox_sync_events WHERE status = 'PENDING'`. Count equals 15.
4. Restore WAN interface.
5. Within 10 seconds, confirm outbox flushes to 0 pending events and cloud aggregator receives all 15 updates with zero data loss.
