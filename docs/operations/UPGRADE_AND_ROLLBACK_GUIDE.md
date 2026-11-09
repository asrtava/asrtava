# ASRTAVA — Upgrade, Migration & Zero-Downtime Rollback Guide

## 1. Upgrade Governance & Hospital Autonomy Rule

**Non-Negotiable Rule**: A hospital's production environment must **never be automatically upgraded** without explicit hospital administrative consent, an approved maintenance window, and verified database backup snapshots.

---

## 2. Upgrade Procedure (On-Premises & Hybrid)

### Phase 1: Pre-Upgrade Verification
1. Verify software upgrade entitlement under active AMC:
   ```bash
   curl -H "Authorization: Bearer <ADMIN_TOKEN>" http://localhost:5000/api/v1/licensing/my-license/upgrade-check
   ```
2. Create full database backup snapshot:
   ```bash
   docker exec asrtava-onprem-db pg_dump -U asrtava_local_admin -d asrtava_hospital_local -F c -b -v -f /var/lib/postgresql/data/backup_pre_upgrade.dump
   ```
3. Archive storage directory:
   ```bash
   tar -czf /var/backups/asrtava_storage_pre_upgrade.tar.gz /var/asrtava/storage/
   ```

### Phase 2: Apply Upgrade & Database Migrations
1. Pull or load new release images:
   ```bash
   docker compose -f docker-compose.onprem.yml pull
   ```
2. Execute versioned Knex migrations:
   ```bash
   docker compose -f docker-compose.onprem.yml run --rm backend npm run migrate
   ```
3. Recreate containers with zero-downtime rolling restart:
   ```bash
   docker compose -f docker-compose.onprem.yml up -d --no-deps backend web-portal
   ```

### Phase 3: Post-Upgrade Health Check
```bash
curl -f http://localhost:5000/ready
```
Verify that active gateways report healthy status and all 13 role-specific portal dashboards load successfully.

---

## 3. Automated Rollback Procedure

If unexpected anomalies or fatal errors occur post-upgrade:

1. Stop running containers:
   ```bash
   docker compose -f docker-compose.onprem.yml down
   ```
2. Restore database snapshot:
   ```bash
   docker compose -f docker-compose.onprem.yml up -d postgres
   docker exec -i asrtava-onprem-db pg_restore -U asrtava_local_admin -d asrtava_hospital_local --clean --if-exists /var/lib/postgresql/data/backup_pre_upgrade.dump
   ```
3. Pin previous release images in `docker-compose.onprem.yml` (e.g. `asrtava-backend:1.1.0`).
4. Relaunch services:
   ```bash
   docker compose -f docker-compose.onprem.yml up -d
   ```
5. Confirm clinical workflow continuity.

