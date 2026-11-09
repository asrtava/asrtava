-- ============================================================
-- ASRTAVA HMS - Migration 011: SaaS Platform Administration & Subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code VARCHAR(50) NOT NULL UNIQUE, -- 'basic', 'professional', 'enterprise'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    annual_price_inr DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_active_staff_users INT DEFAULT 50,
    max_monthly_patients INT DEFAULT 2000,
    max_branches INT DEFAULT 1,
    includes_whatsapp_api BOOLEAN DEFAULT FALSE,
    includes_pacs_dicom BOOLEAN DEFAULT FALSE,
    includes_advanced_analytics BOOLEAN DEFAULT FALSE,
    is_publicly_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    subscription_status VARCHAR(30) DEFAULT 'active' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    auto_renew BOOLEAN DEFAULT TRUE,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES hospital_subscriptions(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    amount_due DECIMAL(10,2) NOT NULL,
    tax_applied DECIMAL(10,2) DEFAULT 0.00,
    invoice_due_date DATE NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'void')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_invoice_id UUID NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_gateway VARCHAR(50) DEFAULT 'razorpay' CHECK (payment_gateway IN ('razorpay', 'stripe', 'wire_transfer', 'manual_admin')),
    gateway_payment_id VARCHAR(100) UNIQUE,
    payment_time TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_support_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    super_admin_user_id UUID NOT NULL REFERENCES users(id),
    hospital_authorizer_user_id UUID NOT NULL REFERENCES users(id),
    support_ticket_reference VARCHAR(100) NOT NULL,
    access_reason TEXT NOT NULL,
    session_started_at TIMESTAMPTZ DEFAULT NOW(),
    session_expires_at TIMESTAMPTZ NOT NULL,
    session_revoked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id),
    hospital_id UUID REFERENCES hospitals(id),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

