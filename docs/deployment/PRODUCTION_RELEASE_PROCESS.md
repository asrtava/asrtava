# ASRTAVA Production Release Runbook & Zero-Downtime Process

## 1. Release Preparation Checklist (T-24 Hours)

1. [ ] **QA Sign-Off**: Verification that all 118 automated tests pass on the release candidate branch.
2. [ ] **Database Migration Review**: Verify that schema changes in `database/migrations/` are backward-compatible.
3. [ ] **Changelog & Semantic Tag**: Verify version bump according to SemVer (e.g. `v1.0.0`).
4. [ ] **Operations Notification**: Notify hospital administrators of scheduled maintenance window.

---

## 2. Release Execution Protocol

1. **Trigger Production Workflow**: Navigate to GitHub Actions $\to$ `ASRTAVA Controlled Production Release` $\to$ enter version tag $\to$ `Run workflow`.
2. **Automated RDS Snapshot**: Workflow initiates a point-in-time snapshot (`asrtava-prod-predeploy-YYYYMMDDHHMMSS`).
3. **Rolling Container Deployment**:
   - ECS Fargate spawns new task revisions with `minimum_healthy_percent = 100` and `maximum_percent = 200`.
   - New tasks execute container health checks on `/health`.
   - ALB begins shifting traffic to healthy tasks while old tasks drain connections gracefully for 10 seconds.
4. **Automated Canary Smoke Verification**:
   - Script probes `https://api.asrtava.com/health` and `https://api.asrtava.com/ready`.
   - Upon confirming HTTP 200 from all tasks, deployment is flagged as **SUCCESSFUL**.

---

## 3. Post-Release Verification

- Check CloudWatch Logs for any unhandled 5xx spikes.
- Check Prometheus `/metrics` for heap stability and request latency.
- Execute one test consultation in internal staging tenant to verify live audit logging.

