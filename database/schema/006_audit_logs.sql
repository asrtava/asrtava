-- ============================================================================
-- ASRTAVA Hospital Management System
-- 006_audit_logs.sql - System Audit Trail
-- ============================================================================

-- ---------------------------------------------------------------------------
-- audit_logs - Universal audit trail for all entities
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID
        REFERENCES hospitals(id) ON DELETE SET NULL,
    user_id         UUID
        REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
