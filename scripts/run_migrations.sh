#!/usr/bin/env bash
# ==============================================================================
# ASRTAVA Automated Database Migration Runner
# Executes all 36 relational migrations in strict numerical order
# ==============================================================================

set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-asrtava_prod}"
DB_USER="${DB_USER:-asrtava_admin}"
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../database/migrations" && pwd)"

echo "------------------------------------------------------------"
echo "Starting ASRTAVA Database Migration Sequence"
echo "Target Database: postgres://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "Migrations Directory: ${MIGRATIONS_DIR}"
echo "------------------------------------------------------------"

export PGPASSWORD="${DB_PASSWORD:-AsrtavaSecure2026!}"

# Ensure migration tracking table exists
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);"

APPLIED_COUNT=0
SKIPPED_COUNT=0

for migration_file in $(ls "${MIGRATIONS_DIR}"/*.sql | sort); do
    filename=$(basename "${migration_file}")
    
    # Check if already applied
    ALREADY_RUN=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "
        SELECT COUNT(1) FROM schema_migrations WHERE filename = '${filename}';
    ")

    if [ "${ALREADY_RUN}" -eq 0 ]; then
        echo "Applying: ${filename} ..."
        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${migration_file}" -v ON_ERROR_STOP=1
        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
            INSERT INTO schema_migrations (filename) VALUES ('${filename}');
        "
        APPLIED_COUNT=$((APPLIED_COUNT + 1))
        echo "✓ ${filename} applied successfully."
    else
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    fi
done

echo "------------------------------------------------------------"
echo "Migration Complete: ${APPLIED_COUNT} applied, ${SKIPPED_COUNT} up to date."
echo "------------------------------------------------------------"

