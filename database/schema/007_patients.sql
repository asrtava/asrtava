-- ============================================================================
-- ASRTAVA Hospital Management System
-- 007_patients.sql - Patient Records
-- ============================================================================

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
CREATE TABLE patients (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE RESTRICT,
    patient_number      VARCHAR(50) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    date_of_birth       DATE,
    gender              VARCHAR(10)
        CHECK (gender IN ('male', 'female', 'other')),
    blood_group         VARCHAR(5)
        CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    email               VARCHAR(255),
    phone               VARCHAR(20) NOT NULL,
    alternate_phone     VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    nationality         VARCHAR(50) DEFAULT 'Indian',
    marital_status      VARCHAR(20),
    occupation          VARCHAR(100),
    avatar_url          TEXT,
    registration_date   DATE DEFAULT CURRENT_DATE,
    is_active           BOOLEAN DEFAULT true,
    created_by          UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    UNIQUE (hospital_id, patient_number)
);

-- ---------------------------------------------------------------------------
-- patient_emergency_contacts
-- ---------------------------------------------------------------------------
CREATE TABLE patient_emergency_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    relationship    VARCHAR(50),
    phone           VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address         TEXT,
    is_primary      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- patient_medical_history
-- ---------------------------------------------------------------------------
CREATE TABLE patient_medical_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    condition_type  VARCHAR(50)
        CHECK (condition_type IN ('allergy', 'chronic', 'surgical', 'family', 'social')),
    condition_name  VARCHAR(255) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20),
    diagnosed_date  DATE,
    is_current      BOOLEAN DEFAULT true,
    notes           TEXT,
    recorded_by     UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- patient_insurance
-- ---------------------------------------------------------------------------
CREATE TABLE patient_insurance (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    provider_name   VARCHAR(255) NOT NULL,
    policy_number   VARCHAR(100) NOT NULL,
    group_number    VARCHAR(100),
    coverage_type   VARCHAR(50),
    valid_from      DATE,
    valid_until     DATE,
    max_coverage    DECIMAL(12,2),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
