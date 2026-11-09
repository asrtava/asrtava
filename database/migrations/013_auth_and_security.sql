-- ============================================================
-- ASRTAVA HMS - Migration 013: Advanced Auth, MFA, Recovery & Audit
-- ============================================================

-- 1. Multi-Hospital User Memberships
CREATE TABLE IF NOT EXISTS hospital_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'revoked')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, hospital_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_memberships_user ON hospital_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_memberships_hosp ON hospital_memberships(hospital_id);

-- 2. Multi-Factor Authentication (MFA) Credentials
CREATE TABLE IF NOT EXISTS user_mfa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    mfa_type VARCHAR(30) DEFAULT 'totp' CHECK (mfa_type IN ('totp', 'sms')),
    secret_encrypted TEXT NOT NULL,
    backup_codes_hash JSONB DEFAULT '[]'::jsonb,
    is_enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Password Reset & Recovery Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pw_reset_token_hash ON password_reset_tokens(token_hash);

-- 4. Staff Account Invitations
CREATE TABLE IF NOT EXISTS account_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON account_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_hosp_email ON account_invitations(hospital_id, email);

-- 5. Dedicated Authentication & Security Audit Logs
CREATE TABLE IF NOT EXISTS auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('success', 'failure', 'blocked')),
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_hosp ON auth_audit_logs(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event ON auth_audit_logs(event_type, created_at DESC);

-- 6. Enable and Enforce Row-Level Security on New Tenant Tables
DO $$
DECLARE
    t text;
    new_tables text[] := ARRAY[
        'hospital_memberships',
        'account_invitations',
        'auth_audit_logs'
    ];
BEGIN
    FOREACH t IN ARRAY new_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
            EXECUTE format('
                CREATE POLICY tenant_isolation_policy ON %I
                FOR ALL
                USING (
                    hospital_id = current_app_tenant()
                    OR current_setting(''app.is_super_admin'', true) = ''true''
                )
                WITH CHECK (
                    hospital_id = current_app_tenant()
                    OR current_setting(''app.is_super_admin'', true) = ''true''
                );
            ', t);
        END IF;
    END LOOP;
END;
$$;
