# ASRTAVA Backup, Disaster Recovery & High Availability Policy

## 1. Objectives & Metrics

Because ASRTAVA serves emergency departments, operation theatres, and intensive care units, high availability and immediate disaster recovery are safety-critical requirements.

| Metric | Target SLA | Implementation Mechanism |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 15 Minutes** | Continuous PostgreSQL Write-Ahead Log (WAL) archiving to secondary geographic region. |
| **Recovery Time Objective (RTO)** | **< 60 Minutes** | Automated Infrastructure-as-Code failover with container orchestration in standby cluster. |
| **High Availability (HA)** | **99.95% Uptime** | Multi-AZ database cluster with active read-replica and automated health failover. |

---

## 2. Backup Schedules & Retention

1. **Continuous WAL Archiving**: Every write-ahead log file pushed to immutable S3 bucket with Object Lock (WORM).
2. **Daily Incremental Snapshots**: Executed at 02:00 UTC during off-peak operational windows.
3. **Weekly Full Snapshots**: Executed on Sundays at 01:00 UTC, retained for 12 months.
4. **Annual Archival Backlogs**: Retained for statutory periods (minimum 7-8 years under Indian Tax & Medical Record Laws).

---

## 3. Immutability & Air-Gapped Protection

To defeat ransomware attacks targeting clinical infrastructure:
- Backup storage buckets enforce **AWS S3 Object Lock in Compliance Mode**, preventing any user—including root cloud accounts—from deleting or modifying backup archives before the retention expiration.
- Backups are copied asynchronously to an air-gapped AWS account isolated by separate cross-account IAM role boundaries.

---

## 4. Disaster Recovery Testing Cadence

Disaster recovery failover simulation exercises are conducted **semi-annually**:
- Simulated primary database loss.
- Verification of point-in-time recovery (PITR) to exact minute prior to simulated loss.
- Verification of audit ledger cryptographic chain integrity post-restoration.

