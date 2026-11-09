#!/usr/bin/env bash
# ==============================================================================
# ASRTAVA Disaster Recovery Database Restore Script
# Restores a PostgreSQL custom-format dump with clean schema recreation
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup_dump_file>"
    exit 1
fi

BACKUP_FILE="$1"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-asrtava_prod}"
DB_USER="${DB_USER:-asrtava_admin}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

echo "WARNING: Restoring will overwrite existing data in '${DB_NAME}'."
read -p "Type 'RESTORE' to proceed: " CONFIRMATION

if [ "${CONFIRMATION}" != "RESTORE" ]; then
    echo "Restore aborted by operator."
    exit 0
fi

export PGPASSWORD="${DB_PASSWORD:-AsrtavaSecure2026!}"

echo "Terminating existing connections to ${DB_NAME} ..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
"

echo "Executing pg_restore from ${BACKUP_FILE} ..."
pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists -v "${BACKUP_FILE}"

echo "✓ Database '${DB_NAME}' successfully restored from '${BACKUP_FILE}'."

