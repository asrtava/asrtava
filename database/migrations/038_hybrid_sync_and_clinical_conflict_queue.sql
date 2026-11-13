-- ============================================================
-- ASRTAVA HMS - Migration 038: Hybrid Edge-to-Cloud Sync & Clinical Conflict Reconciliation
-- Prevents naive Last-Write-Wins (LWW) clinical overwrites.
-- Strictly enqueues concurrent clinical mutations for supervisor review.
-- Compliance: India DPDP Act 2023, NABH Standards, ISO 27799 Clinical Safety
-- ============================================================

-- ------------------------------------------------------------
-- 1. Sync Outbox Table (Local Edge Outbox Pattern)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_outbox (
    id VARCHAR(100) PRIMARY KEY,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'APPEND')),
    version INTEGER NOT NULL DEFAULT 1,
    payload JSONB NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'synced', 'failed', 'conflict_resolved')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_hosp_status ON sync_outbox(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_idempotency ON sync_outbox(idempotency_key);

-- ------------------------------------------------------------
-- 2. Manual Clinical Conflict Reconciliation Queue (P0-05)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinical_conflict_queue (
    id VARCHAR(100) PRIMARY KEY,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    sync_entry_id VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    local_version INTEGER NOT NULL DEFAULT 1,
    cloud_version INTEGER NOT NULL DEFAULT 1,
    local_payload JSONB NOT NULL,
    cloud_payload JSONB NOT NULL,
    conflict_reason VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'REQUIRES_CLINICAL_REVIEW' CHECK (status IN (
        'REQUIRES_CLINICAL_REVIEW',
        'RESOLVED_ACCEPT_LOCAL',
        'RESOLVED_ACCEPT_CLOUD',
        'RESOLVED_MANUAL_MERGE',
        'DISCARDED'
    )),
    resolution_type VARCHAR(40),
    resolution_notes TEXT,
    resolved_payload JSONB,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clin_conf_hosp_status ON clinical_conflict_queue(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_clin_conf_entity ON clinical_conflict_queue(entity_type, entity_id);

-- ------------------------------------------------------------
-- 3. Row-Level Security (RLS) Policies
-- ------------------------------------------------------------
ALTER TABLE sync_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_conflict_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sync_outbox' AND policyname = 'tenant_isolation_sync_outbox'
    ) THEN
        CREATE POLICY tenant_isolation_sync_outbox ON sync_outbox
            FOR ALL USING (
                hospital_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'clinical_conflict_queue' AND policyname = 'tenant_isolation_clinical_conflict_queue'
    ) THEN
        CREATE POLICY tenant_isolation_clinical_conflict_queue ON clinical_conflict_queue
            FOR ALL USING (
                hospital_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;
END $$;

