-- ============================================================
-- ASRTAVA HMS - Migration 020: Customer Onboarding, Implementation, Data Migration & Go-Live Management
-- ============================================================

-- ------------------------------------------------------------
-- 1. Customer Organizations & Account Master
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'CUST-2026-001'
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    category VARCHAR(50) NOT NULL CHECK (category IN ('single_specialty', 'multi_specialty', 'clinic_chain', 'tertiary_teaching', 'government')),
    authorized_branches_count INT NOT NULL DEFAULT 1 CHECK (authorized_branches_count >= 1),
    authorized_contact_name VARCHAR(150) NOT NULL,
    authorized_contact_email VARCHAR(255) NOT NULL,
    authorized_contact_phone VARCHAR(50) NOT NULL,
    technical_contact_name VARCHAR(150),
    technical_contact_email VARCHAR(255),
    commercial_contact_name VARCHAR(150),
    commercial_contact_email VARCHAR(255),
    address_line1 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    implementation_priority VARCHAR(20) DEFAULT 'medium' CHECK (implementation_priority IN ('low', 'medium', 'high', 'critical')),
    target_go_live_date DATE,
    license_id UUID REFERENCES software_licenses(id),
    implementation_owner_user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'onboarding_initiated',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. Hospital Implementation Projects & 18-Stage Lifecycle
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hospital_implementations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'IMP-2026-METRO-01'
    customer_id UUID NOT NULL REFERENCES customer_organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    deployment_model VARCHAR(30) NOT NULL DEFAULT 'cloud' CHECK (deployment_model IN ('cloud', 'on_premises', 'hybrid')),
    current_stage VARCHAR(50) NOT NULL DEFAULT 'requirements_gathering',
    target_go_live_date DATE,
    actual_go_live_date DATE,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocker_reason TEXT,
    deployment_assessment_data JSONB DEFAULT '{}',
    hospital_admin_signoff_by UUID REFERENCES users(id),
    hospital_admin_signoff_at TIMESTAMPTZ,
    asrtava_lead_signoff_by UUID REFERENCES users(id),
    asrtava_lead_signoff_at TIMESTAMPTZ,
    hypercare_ends_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. Implementation Stage Audit Trail
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS implementation_stage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id),
    actor_name VARCHAR(150),
    actor_role VARCHAR(100),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. Hospital Implementation Requirements Catalog
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS implementation_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('clinical', 'administrative', 'billing', 'diagnostics', 'pharmacy', 'integration', 'reporting')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'must_have' CHECK (priority IN ('must_have', 'should_have', 'nice_to_have')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'configured', 'verified', 'rejected')),
    owner_name VARCHAR(150),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. Data Migration Jobs & Reconciliation Engine
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS data_migration_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('departments', 'staff', 'patients', 'appointments', 'consultations', 'pharmacy_catalog', 'inventory', 'billing_tariffs')),
    source_format VARCHAR(30) NOT NULL CHECK (source_format IN ('csv', 'excel', 'json', 'legacy_sql_dump')),
    file_reference VARCHAR(255),
    field_mappings JSONB NOT NULL DEFAULT '{}',
    total_records INT DEFAULT 0,
    valid_records INT DEFAULT 0,
    duplicate_records INT DEFAULT 0,
    failed_records INT DEFAULT 0,
    migrated_records INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'preview_ready', 'approved_for_execution', 'in_progress', 'completed', 'failed', 'rolled_back')),
    dry_run_preview JSONB DEFAULT '[]',
    validation_errors JSONB DEFAULT '[]',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    reconciliation_report JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. Training Programs & Attendance Management
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    role_target VARCHAR(50) NOT NULL, -- 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'finance', 'admin'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    total_modules INT DEFAULT 5,
    trainer_name VARCHAR(150),
    scheduled_start DATE,
    scheduled_end DATE,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attended_sessions INT DEFAULT 0,
    total_sessions INT DEFAULT 5,
    assessment_score INT, -- 0 to 100
    is_certified BOOLEAN DEFAULT FALSE,
    certified_at TIMESTAMPTZ,
    trainer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. User Acceptance Testing (UAT) Engine
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS uat_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    test_scenario VARCHAR(255) NOT NULL,
    expected_outcome TEXT NOT NULL,
    actual_outcome TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'blocked')),
    severity VARCHAR(20) DEFAULT 'major' CHECK (severity IN ('critical', 'major', 'minor', 'cosmetic')),
    executed_by UUID REFERENCES users(id),
    executed_at TIMESTAMPTZ,
    defect_reference VARCHAR(100),
    signoff_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. Go-Live Readiness Checklist & Dual Sign-Offs
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS go_live_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    check_item_code VARCHAR(100) NOT NULL, -- e.g. 'LICENSE_VERIFIED', 'SECURITY_AUDIT', 'MIGRATION_RECONCILED'
    title VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_impl_check_item UNIQUE (implementation_id, check_item_code)
);

-- ------------------------------------------------------------
-- 9. Hypercare & Post-Launch Support Tickets
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hypercare_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    implementation_id UUID NOT NULL REFERENCES hospital_implementations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    ticket_number VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    assigned_engineer_id UUID REFERENCES users(id),
    reported_by UUID REFERENCES users(id),
    resolution_summary TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 10. Performance Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_cust_org_code ON customer_organizations(customer_code);
CREATE INDEX IF NOT EXISTS idx_impl_customer ON hospital_implementations(customer_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_impl_hospital ON hospital_implementations(hospital_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_migration_impl ON data_migration_jobs(implementation_id, status);
CREATE INDEX IF NOT EXISTS idx_training_impl ON training_programs(implementation_id, role_target);
CREATE INDEX IF NOT EXISTS idx_uat_impl ON uat_test_cases(implementation_id, status);
CREATE INDEX IF NOT EXISTS idx_golive_impl ON go_live_checklists(implementation_id, is_verified);
CREATE INDEX IF NOT EXISTS idx_hypercare_impl ON hypercare_tickets(implementation_id, status);

