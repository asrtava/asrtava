# ASRTAVA Hybrid Synchronization & Clinical Conflict Resolution Policy

**Document Reference:** `docs/project/ASRTAVA_HYBRID_SYNCHRONIZATION_AND_CONFLICT_POLICY.md`  
**Phase:** Phase 2.1 — Critical Operational Safety Verification  
**Audit Target:** `backend/src/modules/deployment/hybrid-sync.service.ts` & Transactional Outbox Engine  
**Policy Mandate:** **STRICT PROHIBITION OF SILENT OVERWRITES ON CLINICAL RECORDS**

---

## 1. Critique & Rejection of Naive Chronological Resolution

The previous claim that "chronological conflict resolution prevents split-brain" has been re-evaluated and **rejected for clinical data entities**:
- **Why Chronological Ordering Alone is Dangerous in Healthcare:** In distributed hospital networks with network latency, mobile offline clients, or intermittent edge WAN connections, timestamp ordering is susceptible to clock skew and out-of-order event delivery. An older, superseded medication order could arrive at a cloud node after a newer critical clinical discontinuation order. Applying the latest timestamp or blind Last-Write-Wins (LWW) could silently reactivate a discontinued drug or overwrite an acute allergy warning.
- **The Core Policy:** **Automatic conflict resolution is strictly restricted to approved, non-clinical, low-risk master catalog entities.** For all clinical records, conflicts must be explicitly detected, conflicting versions preserved, and routed to an authorized human clinician for formal reconciliation.

---

## 2. Field-Specific Source of Truth & Conflict Resolution Matrix

| Data Category | Designated Source of Truth | Permitted Sync Direction | Conflict Detection Mechanism | Resolution Policy | Clinical Safety Safeguard |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Patient Identity & Demographics** | Local Hospital Edge | Edge $\to$ Cloud | Cryptographic hash variance on UHID, phone, name. | **Deterministic Edge Master with EMPI Review** | Local hospital records dominate for local care; cross-branch duplicates flag for Central Records reconciliation. |
| **Patient Allergies & Warnings** | Both Edge & Cloud | Bidirectional | Asymmetric comparison of active allergy lists. | **Safety-First Union (Most Restrictive)** | If EITHER edge OR cloud reports a drug allergy, the system adopts the allergy immediately. Deletion requires Chief of Medicine sign-off. |
| **Medication Orders & eRx** | Local Hospital Edge | Edge $\to$ Cloud | Version vector collision; concurrent status updates. | **Append-Only Versioning + Manual Clinical Review** | Discontinued orders cannot be reactivated by out-of-order sync. Conflicting orders queue for treating doctor review. |
| **Clinical Notes (SOAP)** | Local Hospital Edge | Edge $\to$ Cloud | Checksum comparison on finalized consultation note. | **Strictly Append-Only (Addenda)** | Finalized notes are immutable. Updates are committed as versioned addenda with author ID and timestamp. Overwrite is blocked. |
| **Laboratory Results** | Local Hospital Edge | Edge $\to$ Cloud | Result payload mutation after technologist validation. | **Original Preserved + Controlled Amendment** | Original signed result is permanently preserved. Any corrected lab result creates an auditable amendment with pathologist signature. |
| **Radiology Reports & PACS** | Local Hospital Edge | Edge $\to$ Cloud | Study UID collision or report text variation. | **Original Report Locked + Legal Addendum** | Signed radiology reports cannot be overwritten. Supplementary observations append versioned legal addenda. |
| **OPD Appointments** | Enterprise Cloud | Cloud $\to$ Edge & Edge $\to$ Cloud | Slot concurrency conflict on doctor calendar. | **Distributed Lock / Anti-Collision Gate** | Double booking is rejected (`409 Conflict`). Patient with earlier confirmed booking wins; displaced patient receives alternative slot. |
| **Pharmacy Stock Balances** | Local Hospital Edge | Edge $\to$ Cloud | Physical stock count vs cloud warehouse ledger. | **Edge Master Dominance** | Physical stock on-site at the hospital pharmacy is the definitive master. Cloud inventory adjusts to match physical counts. |
| **Billing & Invoices** | Local Hospital Edge | Edge $\to$ Cloud | Invoice item modification after cashier settlement. | **Financial Credit/Debit Reversal** | Settled invoices are locked. Adjustments require supervisor PIN and post balancing double-entry Journal Vouchers. |
| **Master Drug Catalog / Formulary** | Enterprise Cloud | Cloud $\to$ Edge | Drug code or LASA warning update. | **Last-Write-Wins (LWW) with Audit** | Permitted **only** because cloud is the authorized regulatory source for master formularies. |

---

## 3. Transactional Outbox Engine Inspection & Current Gaps

Inspection of `backend/src/modules/deployment/hybrid-sync.service.ts` reveals:
1. **Current In-Memory Limitation:**
   - Line 37: `private static outboxQueue: SyncOutboxEntry[] = [];`
   - Line 38: `private static cloudReplicatedStore = new Map<string, Record<string, any>>();`
   - *Gap:* The current outbox queue and cloud replicated store are held in memory. In production, this outbox must be persisted to the PostgreSQL table `outbox_sync_events` inside the local database transaction to survive restarts.
2. **Idempotency & Replay Protection:**
   - Lines 75-78 generate deterministic SHA-256 idempotency keys:
     $$\text{idempotencyKey} = \text{SHA256}(\text{hospitalId} : \text{entityType} : \text{entityId} : \text{version} : \text{operation})$$
   - Cloud ingestion verifies `processedIdempotencyKeys.has(item.idempotencyKey)` and safely returns `{ success: true, isDuplicate: true }` without double-mutating records.
3. **Current Incomplete Entity Coverage:**
   - Lines 180-200 handle append-only logic strictly for `'consultation'` and `'emergency_triage'`.
   - Entities such as `'patient'`, `'bed_allocation'`, `'prescription_dispense'`, and `'billing_invoice'` fall through to a simple version comparison (`existing._version >= item.version`), which drops out-of-order clinical updates without flagging a conflict!
   - *Required Action:* Expand conflict detection to all clinical entities and route anomalies to `outbox_sync_conflicts` for manual clinical review.

---

## 4. Privacy, Data Minimization & Pseudonymization Boundaries

Under the DPDP Act 2023:
1. **Approved Sync Payloads Only:** Hybrid cloud payloads are strictly restricted to:
   - Aggregated hospital operational KPIs (bed occupancy, wait times, clinical volume).
   - Anonymized financial ledgers and GST tax summaries.
   - Consented longitudinal patient health records where the patient has granted explicit ABDM/ASRTAVA consent.
2. **Pseudonymization $\neq$ Complete Anonymization:**
   - The system utilizes HMAC-SHA256 salted hashes (`pseudonym_hash`) to scrub Direct Identifiers (Name, Phone, Aadhaar, Address).
   - However, pseudonymized records remain **Protected Health Information (PHI)** under law because the local edge server possesses the key to re-identify the patient.
   - Cloud storage of pseudonymized records must continue to enforce AES-256 encryption, access logging, and strict tenant isolation.

