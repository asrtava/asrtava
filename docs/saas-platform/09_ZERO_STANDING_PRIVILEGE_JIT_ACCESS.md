# Zero-Standing-Privilege Just-In-Time (JIT) Support Access

## 1. Compliance Background (HIPAA / DPDP 2023)
In healthcare multi-tenancy, platform administrators and support engineers must not possess standing "backdoor" access to patient charts, consultation notes, or radiology scans.

## 2. JIT Support Workflow Protocol
When a hospital encounters a technical incident requiring platform engineering assistance:
1. **Request Creation (`support_access_requests`)**:
   - Super Admin or Support Engineer submits request:
     - Target Hospital ID.
     - Support Ticket reference (e.g. `TCK-8845`).
     - Technical Justification (e.g. *Diagnosing PACS sync error on CT scan*).
     - Requested Duration (30, 60, or 120 minutes).
     - Requested Scope (`logs_only`, `config_only`, `read_only_records`).
2. **Hospital Admin Explicit Approval**:
   - The Hospital Administrator receives an in-app prompt in their dashboard.
   - The Hospital Admin clicks **Approve** or **Reject**.
3. **Time-Limited Token Generation (`support_access_grants`)**:
   - Upon approval, the server issues a single-use token cryptographically hashed (SHA-256) with a strict expiration timestamp (`expires_at`).
   - The session automatically expires upon duration completion or immediate revocation by the Hospital Administrator.
4. **Immutable Audit Logging**:
   - Every database query executed during the JIT window is stamped with the JIT request ID and persisted to `platform_audit_logs`.

