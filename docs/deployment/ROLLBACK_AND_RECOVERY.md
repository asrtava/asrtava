# ASRTAVA Automated & Manual Rollback Runbook

## 1. Rollback Trigger Criteria

An immediate rollback is mandated if any of the following occur within 60 minutes post-release:
1. Error rate on `/api/v1/*` exceeds **1.0%** of total traffic.
2. Inability to allocate beds, process consultations, or dispense medications.
3. Cryptographic audit chain verification failure on `/api/v1/security/audit/verify-integrity`.
4. High database lock contention causing request timeouts $> 5\text{s}$.

---

## 2. Automated Rollback (CI/CD Pipeline)

If the automated post-deployment health probe in `.github/workflows/deploy-production.yml` receives a non-200 status code from `/health` or `/ready`:
1. The workflow intercepts the failure.
2. Executes AWS CLI command:
   ```bash
   aws ecs update-service --cluster asrtava-prod-cluster --service asrtava-prod-backend --task-definition asrtava-prod-backend:PREVIOUS
   ```
3. ALB terminates traffic routing to unhealthy tasks and immediately restores the previous stable task definition.

---

## 3. Manual Application Rollback Runbook

If an operational issue arises after the automated pipeline finishes:
```bash
# 1. Roll back backend ECS task definition
aws ecs update-service \
  --cluster asrtava-prod-cluster \
  --service asrtava-prod-backend \
  --task-definition asrtava-prod-backend:<PREVIOUS_STABLE_REVISION>

# 2. Roll back web portal Nginx task definition
aws ecs update-service \
  --cluster asrtava-prod-cluster \
  --service asrtava-prod-web \
  --task-definition asrtava-prod-web:<PREVIOUS_STABLE_REVISION>
```

---

## 4. Database Restoration from Pre-Deployment Snapshot

If a destructive database corruption occurred:
1. Identify the pre-deployment snapshot name: `asrtava-prod-predeploy-YYYYMMDDHHMMSS`.
2. Execute point-in-time restore to a new RDS instance:
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier asrtava-prod-pg-restored \
     --db-snapshot-identifier asrtava-prod-predeploy-YYYYMMDDHHMMSS
   ```
3. Update Route 53 private DNS CNAME `asrtava-prod-pg.internal` to point to the restored instance.
4. Verify database health and resume application traffic.

