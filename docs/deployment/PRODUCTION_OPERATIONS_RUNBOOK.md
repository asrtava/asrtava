# ASRTAVA Production Operations Runbook

This operational runbook governs day-to-day administrative procedures, routine health verification, incident response matrices, automated recovery workflows, and maintenance windows for the **ASRTAVA Hospital Management System**.

---

## 1. Operational Tiering & Roles

| Role | Primary Responsibilities | On-Call Schedule |
| :--- | :--- | :--- |
| **Site Reliability Engineer (SRE)** | Cloud infrastructure, ALB, ECS auto-scaling, RDS health, CI/CD | 24/7 Primary Rotation (PagerDuty) |
| **Database Administrator (DBA)** | Multi-AZ replication, connection pooling (PgBouncer), backup verification | Secondary Escalation |
| **Healthcare Security Officer** | DPDP Act compliance, audit log integrity, credential rotation, SOC 2 | Business Hours + High Incident |
| **Platform Lead Architect** | Architecture decisions, emergency patches, catastrophic disaster recovery | P0 Incident Commander |

---

## 2. Daily Operational Health Checklist

Execute at 08:00 IST every operational business day:

1. **ECS Fargate Tasks**:
   - Verify cluster `asrtava-prod-ecs-cluster` has healthy running tasks across AZs (`ap-south-1a`, `ap-south-1b`).
   - Check ECS service task restart count over the last 24h: `aws ecs describe-services --cluster asrtava-prod-ecs-cluster --services asrtava-prod-backend-service`.
2. **Database Metrics**:
   - Check RDS CPU utilization (< 65% average).
   - Check DB storage free space (> 25% free).
   - Verify Replica Lag is 0 ms: `SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;`.
3. **Automated Backup Integrity**:
   - Verify daily snapshot was created at 03:00 IST without error.
   - Run `canary-health-check.ps1` against production endpoints.
4. **Certificate & Domain Expiry**:
   - Verify ACM TLS certificates have > 60 days before expiration (auto-renewal managed by AWS Route53).
5. **Redis Cache & BullMQ Queue**:
   - Verify memory usage < 70% maxmemory.
   - Check dead-letter queues (DLQ) for failed notification jobs: `GET asrtava:queue:notifications:failed`.

---

## 3. Incident Severity Levels & Response SLA

| Severity | Definition | Target MTTA | Target MTTR | Escalation Path |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Critical)** | Entire platform outage; clinical operations blocked; data breach suspected | **< 5 min** | **< 30 min** | Primary SRE -> Incident Commander -> CTO |
| **P1 (High)** | Major hospital module degraded (e.g., Billing or Pharmacy offline); partial outage | **< 15 min** | **< 2 hours** | Primary SRE -> Domain Engineer |
| **P2 (Medium)** | Non-critical service failure (e.g., background SMS report delayed, analytics export slow) | **< 1 hour** | **< 8 hours** | On-call SRE |
| **P3 (Low)** | Minor cosmetic bug, non-blocking telemetry alert | **< 4 hours** | Next sprint | Jira backlog ticket |

---

## 4. Emergency Procedures & Runbook Steps

### 4.1 ECS Backend Service Restart
If backend tasks enter a degraded state or memory leak:
```bash
aws ecs update-service \
  --cluster asrtava-prod-ecs-cluster \
  --service asrtava-prod-backend-service \
  --force-new-deployment \
  --region ap-south-1
```

### 4.2 Database Failover Simulation / Manual Trigger
In the event of primary hardware degradation:
```bash
aws rds reboot-db-instance \
  --db-instance-identifier asrtava-prod-postgres \
  --force-failover \
  --region ap-south-1
```
*Expected recovery time: 60-120 seconds with automatic DNS alias redirection.*

### 4.3 Database Backup Execution (Manual On-Demand)
```powershell
.\infra\scripts\backup-database.ps1 `
  -DbHost "prod-db.internal.asrtava.com" `
  -DbPort 5432 `
  -DbName "asrtava_prod" `
  -DbUser "postgres" `
  -BackupDir "C:\backups\emergency"
```

### 4.4 Automated Database Restoration & Integrity Check
```powershell
.\infra\scripts\restore-database.ps1 `
  -BackupFilePath "C:\backups\emergency\asrtava_prod_20261109_094723.sql" `
  -DbHost "localhost" `
  -DbPort 5432 `
  -DbName "asrtava_restore_verify" `
  -DbUser "postgres"
```

---

## 5. Maintenance Windows & Change Management

- **Scheduled Window**: Every Sunday 02:00 IST – 04:00 IST (lowest hospital inpatient and OPD traffic).
- **Notification Protocol**:
  - 72 hours prior: In-app notification to all hospital tenant admins.
  - 2 hours prior: Banner activation on Web Portal and Mobile App.
- **Rollback Decision Trigger**: Any deployment exceeding 15 minutes of downtime or failing post-deployment canary test triggers an immediate automated rollback via GitHub Actions `deploy-production.yml`.

