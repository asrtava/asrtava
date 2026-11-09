-- ============================================================================
-- ASRTAVA Hospital Management System
-- 002_hospitals.sql - Hospital (Tenant) Tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- hospitals - Core tenant table
-- ---------------------------------------------------------------------------
CREATE TABLE hospitals (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50) UNIQUE NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100) DEFAULT 'India',
    pincode             VARCHAR(10),
    logo_url            TEXT,
    website             VARCHAR(255),
    license_number      VARCHAR(100),
    established_date    DATE,
    subscription_plan   VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active'
        CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial')),
    max_users           INT DEFAULT 50,
    max_departments     INT DEFAULT 20,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- hospital_settings - Per-hospital configuration
-- ---------------------------------------------------------------------------
CREATE TABLE hospital_settings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id             UUID NOT NULL UNIQUE
        REFERENCES hospitals(id) ON DELETE CASCADE,
    currency                VARCHAR(10) DEFAULT 'INR',
    timezone                VARCHAR(50) DEFAULT 'Asia/Kolkata',
    date_format             VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    appointment_slot_duration INT DEFAULT 15,
    working_hours_start     TIME DEFAULT '09:00',
    working_hours_end       TIME DEFAULT '18:00',
    enable_whatsapp         BOOLEAN DEFAULT false,
    enable_sms              BOOLEAN DEFAULT false,
    tax_enabled             BOOLEAN DEFAULT true,
    default_tax_rate        DECIMAL(5,2) DEFAULT 18.00,
    invoice_prefix          VARCHAR(20) DEFAULT 'INV',
    patient_id_prefix       VARCHAR(20) DEFAULT 'PAT',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);
