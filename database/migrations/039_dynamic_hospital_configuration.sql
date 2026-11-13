-- ============================================================================
-- ASRTAVA Hospital Management System
-- 039_dynamic_hospital_configuration.sql
-- Dynamic Hospital Discovery, Bespoke Configuration Engine & Staff Provisioning
-- ============================================================================

-- 1. Alter users table to support generated usernames, force password change, and staff metadata
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='force_password_change') THEN
        ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='staff_department') THEN
        ALTER TABLE users ADD COLUMN staff_department VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='designation') THEN
        ALTER TABLE users ADD COLUMN designation VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='medical_registration_no') THEN
        ALTER TABLE users ADD COLUMN medical_registration_no VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='employee_id') THEN
        ALTER TABLE users ADD COLUMN employee_id VARCHAR(50);
    END IF;
END $$;

-- 2. Hospital Discovery Submissions (12-Section Comprehensive Discovery Questionnaire)
CREATE TABLE IF NOT EXISTS hospital_discovery_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 12),
    section_name VARCHAR(120) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    completion_status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (completion_status IN ('draft', 'submitted', 'verified', 'revision_requested')),
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, section_number)
);

CREATE INDEX IF NOT EXISTS idx_discovery_hospital ON hospital_discovery_submissions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_discovery_section ON hospital_discovery_submissions(hospital_id, section_number);

-- 3. Hospital Configuration Blueprints (Bespoke HMS Blueprint generated from Discovery)
CREATE TABLE IF NOT EXISTS hospital_configuration_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    facility_tier VARCHAR(50) NOT NULL DEFAULT 'general_hospital',
    licensed_bed_capacity INT NOT NULL DEFAULT 0,
    icu_bed_capacity INT NOT NULL DEFAULT 0,
    emergency_bay_capacity INT NOT NULL DEFAULT 0,
    ot_suite_count INT NOT NULL DEFAULT 0,
    enabled_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
    department_hierarchy JSONB NOT NULL DEFAULT '[]'::jsonb,
    ward_bed_taxonomy JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinical_workflows JSONB NOT NULL DEFAULT '{}'::jsonb,
    tariff_billing_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    integration_endpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    deployment_topology JSONB NOT NULL DEFAULT '{}'::jsonb,
    asrtava_lead_signoff_hash VARCHAR(64),
    asrtava_lead_id UUID REFERENCES users(id),
    asrtava_lead_signed_at TIMESTAMPTZ,
    hospital_director_signoff_hash VARCHAR(64),
    hospital_director_id UUID REFERENCES users(id),
    hospital_director_signed_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'provisioned', 'superseded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, version)
);

CREATE INDEX IF NOT EXISTS idx_blueprint_hospital ON hospital_configuration_blueprints(hospital_id);

-- 4. Hospital Staff Provisioning Manifest & Audit
CREATE TABLE IF NOT EXISTS hospital_staff_provisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    batch_id VARCHAR(50) NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    employee_id VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    allocated_role VARCHAR(50) NOT NULL,
    medical_registration_no VARCHAR(100),
    generated_username VARCHAR(100) NOT NULL,
    temp_password_hash VARCHAR(255) NOT NULL,
    temp_password_salt VARCHAR(64) NOT NULL,
    force_password_change BOOLEAN NOT NULL DEFAULT TRUE,
    temp_password_expires_at TIMESTAMPTZ NOT NULL,
    credential_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
    provisioned_user_id UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'provisioned' CHECK (status IN ('provisioned', 'active', 'revoked')),
    provisioned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, generated_username)
);

CREATE INDEX IF NOT EXISTS idx_staff_provision_hospital ON hospital_staff_provisions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_staff_provision_batch ON hospital_staff_provisions(batch_id);

-- 5. Row-Level Security (RLS) Policies for Multi-Tenant Isolation
ALTER TABLE hospital_discovery_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_discovery_submissions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discovery_tenant_isolation ON hospital_discovery_submissions;
CREATE POLICY discovery_tenant_isolation ON hospital_discovery_submissions
    USING (
        app.is_super_admin() OR hospital_id = app.get_current_tenant_id()
    )
    WITH CHECK (
        app.is_super_admin() OR hospital_id = app.get_current_tenant_id()
    );

ALTER TABLE hospital_configuration_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_configuration_blueprints FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blueprint_tenant_isolation ON hospital_configuration_blueprints;
CREATE POLICY blueprint_tenant_isolation ON hospital_configuration_blueprints
    USING (
        app.is_super_admin() OR hospital_id = app.get_current_tenant_id()
    )
    WITH CHECK (
        app.is_super_admin() OR hospital_id = app.get_current_tenant_id()
    );

ALTER TABLE hospital_staff_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_staff_provisions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_provision_tenant_isolation ON hospital_staff_provisions;
CREATE POLICY staff_provision_tenant_isolation ON hospital_staff_provisions
    USING (
        app.is_super_admin() OR hospital_id = app.get_current_tenant_id()
    )
    WITH CHECK (
        app.is_super_admin() OR hospital_id = app.get_current_tenant_id()
    );

