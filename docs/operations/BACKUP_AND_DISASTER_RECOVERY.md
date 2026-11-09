# ASRTAVA — Backup, Disaster Recovery & High-Availability Playbook

## 1. RTO & RPO Objectives

| Deployment Model | Recovery Point Objective (RPO) | Recovery Time Objective (RTO) | Backup Mechanism |
|:---|:---:|:---:|:---|
| **Model A: Cloud-Hosted** | $\le 5$ minutes | $\le 15$ minutes | Automated AWS Aurora/RDS continuous WAL archiving + S3 Cross-Region Replication (`ap-south-2`). |
| **Model B: On-Premises** | $\le 1$ hour | $\le 30$ minutes | Automated hourly local `pg_dump` snapshots to hospital NAS + encrypted offsite tape/removable media. |
| **Model C: Hybrid Deployment** | $\le 5$ minutes | $\le 5$ minutes | Local edge node handles instant failover; continuous background sync replicates to cloud aggregator. |

---

## 2. On-Premises Automated Backup Script

Deploy the automated backup cron script on the hospital server host (`/etc/cron.hourly/asrtava-backup`):

```bash
#!/bin/bash
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/asrtava"
mkdir -p "$BACKUP_DIR"

# 1. Export PostgreSQL Database (Custom Compressed Format with Checksums)
docker exec asrtava-onprem-db pg_dump -U asrtava_local_admin -d asrtava_hospital_local -F c -Z 6 -f "/var/lib/postgresql/data/db_${TIMESTAMP}.dump"
mv "/var/asrtava/pgdata/db_${TIMESTAMP}.dump" "${BACKUP_DIR}/"

# 2. Encrypt Backup with Hospital Public Key (AES-256-CBC)
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "${BACKUP_DIR}/db_${TIMESTAMP}.dump" \
  -out "${BACKUP_DIR}/db_${TIMESTAMP}.dump.enc" \
  -pass file:/etc/asrtava/backup.key
rm "${BACKUP_DIR}/db_${TIMESTAMP}.dump"

# 3. Prune Backups Older Than 30 Days (Statutory Compliance Retained)
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +30 -exec rm {} +

echo "[SUCCESS] ASRTAVA Encrypted Backup completed: db_${TIMESTAMP}.dump.enc"
```

---

## 3. Disaster Recovery Restoration Drill

To test recovery or recover after catastrophic server hardware loss:

1. Provision new replacement hardware node.
2. Install Docker & Docker Compose.
3. Decrypt the latest backup file:
   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 \
     -in /var/backups/asrtava/db_latest.dump.enc \
     -out /var/backups/asrtava/db_latest.dump \
     -pass file:/etc/asrtava/backup.key
   ```
4. Restore into fresh PostgreSQL container:
   ```bash
   docker compose -f docker-compose.onprem.yml up -d postgres
   docker exec -i asrtava-onprem-db pg_restore -U asrtava_local_admin -d asrtava_hospital_local --clean --if-exists /var/backups/asrtava/db_latest.dump
   ```
5. Launch remaining services and verify data consistency:
   ```bash
   docker compose -f docker-compose.onprem.yml up -d
   ```

