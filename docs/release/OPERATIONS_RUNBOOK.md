# ASRTAVA System Operations & Maintenance Runbook

## 1. Routine Maintenance Tasks

### Daily Checks
- Run `./scripts/health_check.sh` to probe API and web portal status.
- Check database disk space: `df -h /var/lib/postgresql/data`.
- Review Dead-Letter Queue (DLQ) in Interoperability Management Hub.

### Weekly Checks
- Verify automated database backup completion in `/var/backups/asrtava`.
- Review expired drug batches in Pharmacy Hub and quarantined stock.
- Audit failed user login attempts in Security Hardening Dashboard.

### Monthly Checks
- Generate executive performance and financial reconciliation reports.
- Review Planned Preventive Maintenance (PPM) schedule for biomedical assets.
- Review staff license expiry dates and compliance training completion.

## 2. Emergency Incident Response
- **Database CPU Spike (> 90%)**: Check active queries via `SELECT * FROM pg_stat_activity WHERE state = 'active';` and terminate runaway unindexed queries.
- **Network Outage in Branch**: Local Edge continues full clinical and inpatient operations; outbox queue buffers mutations automatically.

