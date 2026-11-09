-- ============================================================
-- ASRTAVA HMS - Migration 015: Complete SaaS Management & Multi-Tenant Administration
-- ============================================================

-- ------------------------------------------------------------
-- 1. Platform-Level User Identity & Authorization
-- Strictly separated from hospital tenant staff roles
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE, -- 'PLATFORM_SUPER_ADMIN', 'PLATFORM_BILLING_ADMIN', 'PLATFORM_SUPPORT_AGENT', 'PLATFORM_SECURITY_OFFICER'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE, -- 'tenants:view', 'tenants:manage', 'tenants:suspend', 'billing:view', 'billing:manage', 'support:jit_request', etc.
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_role_permissions (
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES platform_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS platform_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES platform_roles(id),
    department VARCHAR(100) DEFAULT 'Platform Operations',
    is_mfa_enforced BOOLEAN DEFAULT TRUE,
    mfa_enabled_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. Tenant Lifecycle Statuses & Custom Domains
-- ------------------------------------------------------------

-- Alter hospitals table to add extended SaaS columns if not already present
ALTER TABLE hospitals 
ADD COLUMN IF NOT EXISTS tenant_slug VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS gstin VARCHAR(50),
ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(30) DEFAULT 'active' 
    CHECK (lifecycle_status IN ('pending_verification', 'provisioning', 'trial', 'active', 'grace_period', 'read_only', 'suspended', 'cancelled', 'deactivated')),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_storage_gb INT DEFAULT 10;

CREATE TABLE IF NOT EXISTS tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    domain_type VARCHAR(20) DEFAULT 'subdomain' CHECK (domain_type IN ('subdomain', 'custom')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(100),
    dns_txt_record VARCHAR(255),
    ssl_status VARCHAR(30) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed', 'revoked')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tenant_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    reason TEXT NOT NULL,
    actor_id UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. Hospital Self-Serve Onboarding Wizard Tracker
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL UNIQUE REFERENCES hospitals(id) ON DELETE CASCADE,
    current_step INT DEFAULT 1 CHECK (current_step BETWEEN 1 AND 10),
    total_steps INT DEFAULT 10,
    is_completed BOOLEAN DEFAULT FALSE,
    step_data JSONB DEFAULT '{}', -- Stores in-progress form entries across wizard steps
    resumption_token VARCHAR(100) UNIQUE,
    completed_steps JSONB DEFAULT '[]', -- Array of step indices completed: [1, 2, 3]
    last_saved_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 4. Subscription Plans, Feature Entitlements & Overrides
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'module:ipd', 'module:pharmacy', 'module:pacs_dicom', 'feature:api_access'
    category VARCHAR(50) NOT NULL, -- 'clinical', 'diagnostic', 'administrative', 'integration'
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_entitlements (
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES plan_features(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT TRUE,
    quota_limit INT DEFAULT NULL, -- NULL = unlimited
    PRIMARY KEY (plan_id, feature_id)
);

CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    feature_code VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN NOT NULL,
    valid_until TIMESTAMPTZ,
    granted_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_feature UNIQUE (hospital_id, feature_code)
);

-- ------------------------------------------------------------
-- 5. Usage Metering, Quotas & Alert Policies
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'active_staff', 'branches', 'monthly_patients', 'storage_bytes', 'api_requests', 'sms_notifications'
    metric_value BIGINT NOT NULL DEFAULT 1,
    billing_period_month VARCHAR(7) NOT NULL, -- '2026-11'
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_usage_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    billing_period_month VARCHAR(7) NOT NULL, -- '2026-11'
    active_staff_count INT DEFAULT 0,
    total_branches INT DEFAULT 1,
    patients_registered INT DEFAULT 0,
    storage_consumed_bytes BIGINT DEFAULT 0,
    api_request_count BIGINT DEFAULT 0,
    sms_count INT DEFAULT 0,
    whatsapp_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_month UNIQUE (hospital_id, billing_period_month)
);

CREATE TABLE IF NOT EXISTS tenant_quota_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL UNIQUE REFERENCES hospitals(id) ON DELETE CASCADE,
    warning_threshold_pct INT DEFAULT 80 CHECK (warning_threshold_pct BETWEEN 50 AND 95),
    critical_threshold_pct INT DEFAULT 95 CHECK (critical_threshold_pct BETWEEN 90 AND 99),
    hard_block_on_non_clinical BOOLEAN DEFAULT TRUE,
    overage_allowed BOOLEAN DEFAULT TRUE,
    notification_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. SaaS Subscription Billing, Coupons & Discounts
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscription_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_inr')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    max_redemptions INT DEFAULT 100,
    times_redeemed INT DEFAULT 0,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    coupon_id UUID REFERENCES subscription_coupons(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    applied_to_invoice_id UUID REFERENCES subscription_invoices(id),
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. Payment Gateway Webhook Audit & Idempotency
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payment_gateway_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway VARCHAR(50) NOT NULL, -- 'razorpay', 'stripe'
    event_id VARCHAR(150) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL, -- 'payment.captured', 'subscription.charged', 'refund.processed'
    signature_verified BOOLEAN DEFAULT FALSE,
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'processed' CHECK (status IN ('received', 'processed', 'duplicate_ignored', 'failed')),
    error_message TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. Tenant Data Export Jobs (Self-Service Data Portability)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenant_data_export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    export_format VARCHAR(10) DEFAULT 'json' CHECK (export_format IN ('json', 'csv')),
    export_scope VARCHAR(50) DEFAULT 'full_tenant' CHECK (export_scope IN ('full_tenant', 'clinical_only', 'financial_only', 'audit_logs')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    file_path TEXT,
    file_size_bytes BIGINT,
    download_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    download_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 9. Just-In-Time (JIT) Super Admin Support Access Control
-- Strict zero-standing-privilege over hospital clinical data
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS support_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requester_user_id UUID NOT NULL REFERENCES users(id), -- Platform Admin
    support_ticket_id VARCHAR(50) NOT NULL,
    justification TEXT NOT NULL,
    requested_duration_minutes INT DEFAULT 60 CHECK (requested_duration_minutes BETWEEN 15 AND 480),
    requested_scope VARCHAR(100) NOT NULL, -- 'logs_only', 'configuration_only', 'read_only_records'
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
    approved_by UUID REFERENCES users(id), -- Hospital Admin
    approved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_access_grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES support_access_requests(id) ON DELETE CASCADE,
    access_token_hash VARCHAR(128) NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- ------------------------------------------------------------
-- 10. Platform Announcements & Maintenance Broadcasts
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical', 'maintenance')),
    target_tier VARCHAR(50) DEFAULT 'all' CHECK (target_tier IN ('all', 'trial', 'starter', 'professional', 'enterprise')),
    published_by UUID NOT NULL REFERENCES users(id),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_announcement_reads (
    announcement_id UUID NOT NULL REFERENCES platform_announcements(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    read_by UUID NOT NULL REFERENCES users(id),
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (announcement_id, hospital_id, read_by)
);

-- ------------------------------------------------------------
-- 11. Platform Support Tickets
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES users(id),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'technical' CHECK (category IN ('technical', 'billing', 'feature_request', 'compliance', 'security')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_tenant', 'resolved', 'closed')),
    assigned_agent_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES platform_support_tickets(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES users(id),
    is_platform_staff BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Indexes for High Performance & Tenant-Safe SaaS Analytics
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_hospitals_lifecycle ON hospitals(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_tenant_onboarding_token ON tenant_onboarding(resumption_token);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON tenant_usage_records(hospital_id, billing_period_month);
CREATE INDEX IF NOT EXISTS idx_tenant_aggregates_month ON tenant_usage_aggregates(billing_period_month);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_status ON subscription_invoices(payment_status, invoice_due_date);
CREATE INDEX IF NOT EXISTS idx_gateway_events_event_id ON payment_gateway_events(event_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_hospital ON support_access_requests(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_announcements_active ON platform_announcements(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON platform_support_tickets(hospital_id, status);

