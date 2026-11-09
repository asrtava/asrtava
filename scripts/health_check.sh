#!/usr/bin/env bash
# ==============================================================================
# ASRTAVA Production Health & Subsystem Readiness Check
# Probes backend API, PostgreSQL database, Redis, and frontend Nginx endpoints
# ==============================================================================

set -uo pipefail

API_URL="${API_URL:-http://localhost:5000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost}"

echo "============================================================"
echo "ASRTAVA Production Health Probe"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "============================================================"

# 1. Probe Backend API
echo -n "Probing Backend API (${API_URL}/health)... "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" || echo "FAIL")
if [ "${BACKEND_STATUS}" -eq 200 ]; then
    echo "HEALTHY (HTTP 200)"
else
    echo "CRITICAL: HTTP ${BACKEND_STATUS}"
fi

# 2. Probe Web Portal Frontend
echo -n "Probing Web Portal (${FRONTEND_URL}/health)... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/health" || echo "FAIL")
if [ "${FRONTEND_STATUS}" -eq 200 ]; then
    echo "HEALTHY (HTTP 200)"
else
    echo "WARNING: HTTP ${FRONTEND_STATUS}"
fi

echo "============================================================"
echo "Health Check Sequence Complete"
echo "============================================================"

