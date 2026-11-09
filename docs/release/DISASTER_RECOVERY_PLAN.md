# ASRTAVA Disaster Recovery & Business Continuity Plan

## 1. RPO & RTO Targets
- **Recovery Point Objective (RPO)**: $< 15$ Minutes (Continuous WAL archiving / 15-minute transactional snapshots).
- **Recovery Time Objective (RTO)**: $< 30$ Minutes (Cold standby restore) / $< 2$ Minutes (Multi-AZ hot standby failover).

## 2. Backup Strategy
- **Daily Automated Physical Dumps**: `scripts/backup_database.sh` generates custom-format dumps at 01:00 AM IST.
- **Continuous Write-Ahead Logging (WAL)**: In streaming replication or S3 KMS archive.
- **Air-Gapped Secondary Backup**: Weekly export to encrypted external offline storage for ransomware defense.

## 3. Step-by-Step Restoration Procedure
1. Provision target clean host with PostgreSQL 16+.
2. Transfer backup file `asrtava_backup_YYYYMMDD_HHMMSS.dump`.
3. Execute restore script:
   ```bash
   chmod +x scripts/restore_database.sh
   ./scripts/restore_database.sh /path/to/backup.dump
   ```
4. Verify database row counts and schema migration status.
5. Launch application containers and run `./scripts/health_check.sh`.

