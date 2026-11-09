-- ============================================================
-- ASRTAVA HMS - Migration 005: Patients & Electronic Medical Records (EMR)
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Linked patient portal account (Nullable)
    patient_number VARCHAR(50) NOT NULL,
    national_health_id VARCHAR(50), -- ABHA ID or equivalent
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    marital_status VARCHAR(30) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
    occupation VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relation VARCHAR(50),
    registration_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (hospital_id, patient_number)
);

CREATE TABLE IF NOT EXISTS patient_dependents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    primary_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    dependent_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN ('child', 'spouse', 'parent', 'sibling', 'guardian', 'other')),
    can_view_records BOOLEAN DEFAULT TRUE,
    can_book_appointments BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (primary_patient_id, dependent_patient_id)
);

CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen_type VARCHAR(50) NOT NULL CHECK (allergen_type IN ('drug', 'food', 'environmental', 'latex', 'other')),
    allergen_name VARCHAR(255) NOT NULL,
    severity VARCHAR(30) DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
    reaction_description TEXT,
    diagnosed_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    recorded_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_medical_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_category VARCHAR(50) NOT NULL CHECK (condition_category IN ('chronic', 'surgical', 'family', 'social', 'congenital', 'other')),
    condition_name VARCHAR(255) NOT NULL,
    icd10_code VARCHAR(30),
    onset_date DATE,
    resolution_status VARCHAR(30) DEFAULT 'active' CHECK (resolution_status IN ('active', 'resolved', 'managed', 'in_remission')),
    clinical_notes TEXT,
    recorded_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    alternate_phone VARCHAR(30),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tpa_provider_name VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    card_number VARCHAR(100),
    sum_insured DECIMAL(12,2) DEFAULT 0.00,
    pre_auth_limit DECIMAL(12,2) DEFAULT 0.00,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

