-- ============================================================
-- ASRTAVA HMS - Migration 019: Perpetual Software Licensing & Commercial Management
-- ============================================================

-- ------------------------------------------------------------
-- 1. Core Perpetual Software Licenses
-- Stores perpetual software ownership, edition, modular entitlements,
-- capacity limits, and cryptographic activation certificates
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS software_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_number VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'ASR-LIC-2026-78901'
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    edition VARCHAR(50) NOT NULL CHECK (edition IN ('clinic_basic', 'standard_hospital', 'enterprise_multispecialty', 'custom')),
    license_type VARCHAR(30) NOT NULL DEFAULT 'perpetual' CHECK (license_type IN ('perpetual', 'evaluation', 'academic')),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'pending_activation', 'active', 'suspended', 'revoked', 'transferred')),
    licensed_modules JSONB NOT NULL DEFAULT '[]', -- Array of module strings e.g. ["module:patient_mgmt", "module:appointments", ...]
    deployment_model VARCHAR(30) NOT NULL DEFAULT 'cloud' CHECK (deployment_model IN ('cloud', 'on_premises', 'hybrid')),
    
    -- Capacity and Scope Limits
    authorized_locations INT NOT NULL DEFAULT 1 CHECK (authorized_locations >= 1),
    authorized_installations INT NOT NULL DEFAULT 1 CHECK (authorized_installations >= 1),
    max_beds INT DEFAULT NULL, -- NULL = unlimited
    max_doctors INT DEFAULT NULL, -- NULL = unlimited
    max_active_users INT DEFAULT NULL, -- NULL = unlimited
    
    -- Security & Cryptographic Tokens
    hardware_fingerprint_hash VARCHAR(128), -- SHA-256 hash of server hardware identifiers for air-gapped on-premises bindings
    activation_key VARCHAR(100) UNIQUE, -- Format: ASRT-XXXX-XXXX-XXXX-XXXX
    activation_token TEXT, -- HMAC-SHA256 or RSA cryptographically signed license claim token
    
    -- Lifecycle Timestamps & Actors
    issued_at TIMESTAMPTZ,
    issued_by UUID REFERENCES users(id),
    activated_at TIMESTAMPTZ,
    activated_by UUID REFERENCES users(id),
    suspended_at TIMESTAMPTZ,
    suspended_by UUID REFERENCES users(id),
    suspension_reason TEXT,
    
    -- License Transfer Tracking
    transferred_to_hospital_id UUID REFERENCES hospitals(id),
    transferred_at TIMESTAMPTZ,
    transferred_by UUID REFERENCES users(id),
    transfer_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. Optional Maintenance & Support Agreements (AMC)
-- Strictly separated from core software ownership:
-- AMC expiration restricts official SLA support & major upgrades,
-- but NEVER terminates core software license, clinical care, or patient data access
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS maintenance_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES software_licenses(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    agreement_number VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'ASR-AMC-2026-1024'
    plan_tier VARCHAR(30) NOT NULL DEFAULT 'gold' CHECK (plan_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    sla_response_hours INT NOT NULL DEFAULT 4 CHECK (sla_response_hours >= 1),
    includes_upgrades BOOLEAN NOT NULL DEFAULT TRUE,
    includes_cloud_hosting BOOLEAN NOT NULL DEFAULT FALSE,
    includes_custom_dev_hours INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    annual_fee_inr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewed', 'cancelled')),
    renewal_reminder_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. Commercial Sales Orders & Invoices (One-Time License Procurement)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS license_sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'ASR-ORD-2026-5001'
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    license_id UUID REFERENCES software_licenses(id),
    edition VARCHAR(50) NOT NULL,
    license_fee_inr DECIMAL(12,2) NOT NULL,
    implementation_fee_inr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amc_fee_inr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_order_amount_inr DECIMAL(12,2) NOT NULL,
    payment_terms VARCHAR(50) DEFAULT 'milestone_split', -- '100_advance', 'milestone_split', 'net_30'
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid_in_full', 'refunded')),
    paid_amount_inr DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. Immutable License Audit Trail
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS license_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES software_licenses(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'license_issued', 'license_activated', 'module_added', 'capacity_upgraded', 'license_transferred', 'license_suspended', 'license_reinstated', 'amc_renewed', 'amc_expired', 'validation_failure'
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(50),
    ip_address VARCHAR(50),
    previous_state JSONB,
    new_state JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. Performance & Tenant Isolation Indexes
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_licenses_hospital ON software_licenses(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_licenses_number ON software_licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON software_licenses(activation_key);
CREATE INDEX IF NOT EXISTS idx_amc_license ON maintenance_agreements(license_id, status);
CREATE INDEX IF NOT EXISTS idx_amc_dates ON maintenance_agreements(end_date, status);
CREATE INDEX IF NOT EXISTS idx_orders_hospital ON license_sales_orders(hospital_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_license_audit_event ON license_audit_logs(license_id, event_type);

