# ASRTAVA Incident Management & Emergency Response Runbook

**Document Reference:** `docs/operations/ASRTAVA_INCIDENT_RESPONSE_RUNBOOK.md`  
**Standard:** ISO/IEC 27035 (Information Security Incident Management), DPDP Act 2023 Data Breach Rules  
**Scope:** Healthcare Operational Continuity, Clinical Safety Incidents, Security Breaches & Outages  
**Status:** **READY WITH DOCUMENTED PREREQUISITES**

---

## 1. Incident Severity Classification & Response SLAs

| Severity | Definition & Clinical Impact | Initial Response SLA | Escalation Target | Resolution Target |
| :---: | :--- | :---: | :--- | :---: |
| **P0 (Critical / Patient Safety Blocker)** | Clinical care paralyzed; active emergency triage or inpatient eMAR blocked; database down; suspected data breach. | **$\le 15\text{ minutes}$** | Chief Medical Officer, Lead Architect, Hospital IT Director | **$\le 2\text{ hours}$** |
| **P1 (High / Severe Impairment)** | Major module unavailable (e.g. Pharmacy dispensing stalled, LIS analyzer offline); no manual workaround. | **$\le 30\text{ minutes}$** | Department Head, Senior DevOps Engineer | **$\le 4\text{ hours}$** |
| **P2 (Medium / Non-Blocking)** | Partial workflow degraded (e.g. Scheduled PDF report generation delay, SMS reminder queue lag); workarounds exist. | **$\le 2\text{ hours}$** | Support Team Lead, Module Owner | **$\le 24\text{ hours}$** |
| **P3 (Low / Minor Request)** | Minor UI cosmetic glitch, documentation typo, non-urgent feature question. | **$\le 8\text{ hours}$** | Customer Support Specialist | Next Sprint |

---

## 2. Emergency Escalation Pathways

### 2.1 Clinical Safety Escalation (Patient Care at Risk)
1. **Immediate Clinical Safe Harbor:** If any software bug or licensing condition impairs patient diagnosis or medication administration, treating clinicians immediately invoke the **Emergency Clinical Override** or transition to the hospital's manual downtime paper charts.
2. **Notification Protocol:**
   - On-duty nurse/physician alerts the Nursing Supervisor & Hospital Incident Commander.
   - Hospital IT alerts ASRTAVA 24/7 Clinical Safety Escalation Hotline.
3. **Clinical Incident Logging:** Log incident in `qm_incidents` within 24 hours under Quality Management for multidisciplinary Root Cause Analysis (RCA).

### 2.2 Security Incident & DPDP Act Data Breach Response
Under the Digital Personal Data Protection (DPDP) Act 2023, data breaches must be reported to the Data Protection Board of India and affected data principals:
1. **Containment:** Immediately revoke compromised user credentials, terminate active sessions via `SessionSecurityService.revokeUserSessions()`, and isolate affected network nodes.
2. **Investigation:** Inspect immutable audit logs in `audit_merkle_blocks` and `audit_logs` using cryptographic verification to determine the exact scope of accessed patient records.
3. **Statutory Notification:** If Protected Health Information (PHI) is compromised, the Hospital Data Protection Officer (DPO) and ASRTAVA Legal Counsel prepare the formal regulatory notification within the statutory timeline.

---

## 3. Operational Outage Playbooks

### Playbook A: Total Database Connectivity Loss
1. **Step 1:** Check database host resources: `docker-compose ps` or AWS RDS console.
2. **Step 2:** Inspect backend logs for connection errors:
   ```bash
   docker logs asrtava-backend | grep -i "connection"
   ```
3. **Step 3:** If PostgreSQL crashed due to disk exhaustion, expand host volume immediately.
4. **Step 4:** Restart PostgreSQL container / trigger RDS multi-AZ failover.
5. **Step 5:** Backend `/ready` probe automatically detects reconnection and resumes normal request processing.

### Playbook B: License Verification Failure / Commercial Lockout Risk
1. **Step 1:** Hospital displays warning banner: "License verification service unreachable".
2. **Step 2:** **Clinical Continuity Invariant:** Verify that existing EMR records, active inpatient admissions, and emergency triage continue without interruption (`allowed: true, isClinicalContinuity: true`).
3. **Step 3:** Administrative IT Lead regenerates offline claims token or checks LAN connectivity.
4. **Step 4:** Re-apply offline license key via `LicenseService.activateOfflineLicense()`.

### Playbook C: External Integration Failure (SMS / WhatsApp Gateway Down)
1. **Step 1:** Outbox dispatcher encounters HTTP 5xx from telecom provider.
2. **Step 2:** System routes failing notifications into Dead-Letter Queue (DLQ) after 5 exponential retries.
3. **Step 3:** Critical alerts automatically failover to fallback channels (e.g. In-App alert + On-Duty Nurse station audio chime).
4. **Step 4:** Replay queued notifications once provider confirms service restoration:
   ```bash
   curl -X POST http://localhost:5000/api/v1/integrations/outbox/replay-dlq -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```

---

## 4. Responsibility Separation: Internal ASRTAVA vs Hospital IT

| Responsibility Domain | ASRTAVA Engineering & Support | Hospital IT & Clinical Operations |
| :--- | :--- | :--- |
| **Application Core & Codebase** | Responsible for software bug fixes, patches, and version upgrades. | Responsible for user account management and local password security. |
| **Physical Server & Network Hardware** | Advises on hardware sizing and minimum specs. | **Solely responsible** for hospital LAN, routers, UPS power, and physical security. |
| **Database Backups (On-Premises)** | Provides automated backup scripts (`backup_database.sh`). | **Solely responsible** for scheduling cron jobs, off-site storage, and NAS capacity. |
| **Clinical Decision-Making** | Provides software tools (CDS, allergy checks, eMAR). | **Solely responsible** for all medical diagnoses, prescription orders, and patient care. |
