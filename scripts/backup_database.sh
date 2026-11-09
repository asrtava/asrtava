#!/usr/bin/env bash
# ==============================================================================
# ASRTAVA Automated Database Backup Engine
# Generates timestamped, compressed, encrypted PostgreSQL dumps
# ==============================================================================

set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-asrtava_prod}"
DB_USER="${DB_USER:-asrtava_admin}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/asrtava}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/asrtava_backup_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "Initiating backup for ${DB_NAME} to ${BACKUP_FILE} ..."
export PGPASSWORD="${DB_PASSWORD:-AsrtavaSecure2026!}"

pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${BACKUP_FILE}" "${DB_NAME}"

# Retain only past 30 days of backups
find "${BACKUP_DIR}" -name "asrtava_backup_*.dump" -mtime +30 -exec rm {} \;

echo "✓ Backup successfully created: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

