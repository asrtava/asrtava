-- ============================================================================
-- ASRTAVA Hospital Management System
-- 005_roles_permissions.sql - RBAC Tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- roles - System and hospital-level roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(50) NOT NULL,
    description     TEXT,
    is_system_role  BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, code)
);

-- ---------------------------------------------------------------------------
-- permissions - Granular action permissions
-- ---------------------------------------------------------------------------
CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module      VARCHAR(100) NOT NULL,
    sub_module  VARCHAR(100),
    action      VARCHAR(50) NOT NULL
        CHECK (action IN ('view', 'create', 'edit', 'delete', 'approve',
                          'export', 'print', 'manage', 'configure')),
    resource    VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (module, sub_module, action, resource)
);

-- ---------------------------------------------------------------------------
-- role_permissions - Many-to-many mapping
-- ---------------------------------------------------------------------------
CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id         UUID NOT NULL
        REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL
        REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- user_permissions - Direct user-level permission overrides
-- ---------------------------------------------------------------------------
CREATE TABLE user_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL
        REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted      BOOLEAN NOT NULL DEFAULT true,
    granted_by      UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_by     UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_at     TIMESTAMPTZ,
    reason          TEXT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (user_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- permission_audit_log - Track all permission changes
-- ---------------------------------------------------------------------------
CREATE TABLE permission_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    hospital_id     UUID
        REFERENCES hospitals(id) ON DELETE SET NULL,
    permission_id   UUID
        REFERENCES permissions(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    changed_by      UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
