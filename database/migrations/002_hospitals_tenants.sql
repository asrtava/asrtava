-- ============================================================
-- ASRTAVA HMS - Migration 002: Multi-Hospital Tenants & Settings
-- ============================================================

CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    license_number VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    logo_url TEXT,
    website VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
    subscription_status VARCHAR(30) DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
    subscription_start_date DATE DEFAULT CURRENT_DATE,
    subscription_end_date DATE,
    max_users INT DEFAULT 50 CHECK (max_users > 0),
    max_branches INT DEFAULT 1 CHECK (max_branches > 0),
    max_departments INT DEFAULT 20 CHECK (max_departments > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hospital_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL UNIQUE REFERENCES hospitals(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'INR',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    appointment_slot_duration INT DEFAULT 15 CHECK (appointment_slot_duration IN (10, 15, 20, 30, 45, 60)),
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    enable_whatsapp BOOLEAN DEFAULT FALSE,
    enable_sms BOOLEAN DEFAULT FALSE,
    tax_enabled BOOLEAN DEFAULT TRUE,
    default_tax_rate DECIMAL(5,2) DEFAULT 18.00 CHECK (default_tax_rate >= 0.00),
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    patient_id_prefix VARCHAR(20) DEFAULT 'PAT',
    clinical_alert_thresholds JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_code VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    is_main_branch BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, branch_code)
);

CREATE TABLE IF NOT EXISTS hospital_tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0.00),
    tax_type VARCHAR(30) DEFAULT 'gst' CHECK (tax_type IN ('gst', 'cgst', 'sgst', 'igst', 'vat', 'other')),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
