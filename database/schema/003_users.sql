-- ============================================================================
-- ASRTAVA Hospital Management System
-- 003_users.sql - Users & Authentication Tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- users - All system users (super admins, hospital admins, staff)
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID
        REFERENCES hospitals(id) ON DELETE SET NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(20),
    avatar_url          TEXT,
    user_type           VARCHAR(20) NOT NULL
        CHECK (user_type IN ('super_admin', 'hospital_admin', 'staff')),
    is_active           BOOLEAN DEFAULT true,
    is_email_verified   BOOLEAN DEFAULT false,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- user_sessions - JWT refresh token sessions
-- ---------------------------------------------------------------------------
CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    hospital_id     UUID
        REFERENCES hospitals(id) ON DELETE CASCADE,
    refresh_token   VARCHAR(500) NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- password_reset_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    used_at     TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- login_history - Track all login attempts
-- ---------------------------------------------------------------------------
CREATE TABLE login_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    hospital_id     UUID
        REFERENCES hospitals(id) ON DELETE SET NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    login_status    VARCHAR(20)
        CHECK (login_status IN ('success', 'failed', 'blocked')),
    failure_reason  VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
