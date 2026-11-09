# ASRTAVA Hybrid Edge-Cloud Installation Guide

## 1. Operating Concept
The Hybrid architecture provides local operational autonomy for hospital branches while maintaining consolidated corporate oversight:
- **Local Branch Edge**: Runs local PostgreSQL and backend for real-time OPD, IPD, OT, LIS, RIS, and Pharmacy operations without internet dependency.
- **Transactional Outbox Engine**: Clinical and financial mutations write to a local `outbox_events` table.
- **Asynchronous Synchronization**: When WAN connectivity is available, an edge sync agent securely dispatches batches to HQ central servers using TLS 1.3 and HMAC signatures.

## 2. Deployment Walkthrough

### Step 1: Deploy Branch Edge
```bash
cd /opt/asrtava
docker compose -f docker/docker-compose.hybrid.yml up -d
```

### Step 2: Configure Central HQ Connection
Set environment variables in your branch config:
```env
HQ_CENTRAL_SYNC_URL=https://hq.hospitalgroup.com/api/v1/sync
HQ_API_TOKEN=branch_edge_hmac_token_2026
OUTBOX_SYNC_INTERVAL_SEC=30
```

### Step 3: Outbox Verification
Monitor sync status:
```bash
curl -s http://localhost:5000/api/v1/groups/sync-status | jq .
```
Verify that `pendingOutboxCount` decrements to 0 upon reconnection.

