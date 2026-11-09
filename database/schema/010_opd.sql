-- ============================================================================
-- ASRTAVA Hospital Management System
-- 010_opd.sql - Outpatient Department (Consultations, Diagnoses, Prescriptions)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- consultations
-- ---------------------------------------------------------------------------
CREATE TABLE consultations (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id                 UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    appointment_id              UUID
        REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id                  UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id                   UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    consultation_number         VARCHAR(50) NOT NULL,
    consultation_date           TIMESTAMPTZ DEFAULT NOW(),
    chief_complaint             TEXT,
    history_of_present_illness  TEXT,
    examination_findings        TEXT,
    clinical_notes              TEXT,
    advice                      TEXT,
    follow_up_date              DATE,
    follow_up_instructions      TEXT,
    status                      VARCHAR(20) DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'referred')),
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, consultation_number)
);

-- ---------------------------------------------------------------------------
-- consultation_vitals
-- ---------------------------------------------------------------------------
CREATE TABLE consultation_vitals (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id             UUID NOT NULL
        REFERENCES consultations(id) ON DELETE CASCADE,
    hospital_id                 UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    temperature                 DECIMAL(5,2),
    pulse                       INT,
    blood_pressure_systolic     INT,
    blood_pressure_diastolic    INT,
    respiratory_rate            INT,
    oxygen_saturation           DECIMAL(5,2),
    weight                      DECIMAL(6,2),
    height                      DECIMAL(5,2),
    bmi                         DECIMAL(5,2),
    blood_sugar                 DECIMAL(6,2),
    notes                       TEXT,
    recorded_by                 UUID
        REFERENCES users(id) ON DELETE SET NULL,
    recorded_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- diagnoses
-- ---------------------------------------------------------------------------
CREATE TABLE diagnoses (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id     UUID NOT NULL
        REFERENCES consultations(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    icd_code            VARCHAR(20),
    diagnosis_name      VARCHAR(255) NOT NULL,
    diagnosis_type      VARCHAR(20)
        CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
    description         TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
CREATE TABLE prescriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id         UUID NOT NULL
        REFERENCES consultations(id) ON DELETE CASCADE,
    hospital_id             UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id              UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id               UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    prescription_number     VARCHAR(50) NOT NULL,
    prescription_date       DATE DEFAULT CURRENT_DATE,
    notes                   TEXT,
    is_dispensed            BOOLEAN DEFAULT false,
    dispensed_at            TIMESTAMPTZ,
    dispensed_by            UUID
        REFERENCES users(id) ON DELETE SET NULL,
    status                  VARCHAR(20) DEFAULT 'active',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- prescription_items
-- ---------------------------------------------------------------------------
CREATE TABLE prescription_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id     UUID NOT NULL
        REFERENCES prescriptions(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id         UUID,   -- FK added after medicines table is created
    medicine_name       VARCHAR(255) NOT NULL,
    dosage              VARCHAR(100),
    frequency           VARCHAR(100),
    duration            VARCHAR(100),
    route               VARCHAR(50),
    instructions        TEXT,
    quantity            INT,
    is_dispensed        BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
