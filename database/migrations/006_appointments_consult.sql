-- ============================================================
-- ASRTAVA HMS - Migration 006: Appointments, OPD Consultations & Prescriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    appointment_number VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_type VARCHAR(30) DEFAULT 'new' CHECK (appointment_type IN ('new', 'follow_up', 'walk_in', 'emergency', 'teleconsultation')),
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show')),
    queue_token_number INT,
    reason TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, appointment_number),
    CONSTRAINT valid_appointment_time CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consultation_number VARCHAR(50) NOT NULL,
    consultation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    examination_findings TEXT,
    clinical_notes TEXT,
    management_plan TEXT,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'referred')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, consultation_number)
);

CREATE TABLE IF NOT EXISTS consultation_vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_pressure_systolic INT CHECK (blood_pressure_systolic BETWEEN 40 AND 300),
    blood_pressure_diastolic INT CHECK (blood_pressure_diastolic BETWEEN 30 AND 200),
    pulse INT CHECK (pulse BETWEEN 30 AND 250),
    temperature DECIMAL(5,2) CHECK (temperature BETWEEN 90.0 AND 110.0), -- Fahrenheit
    respiratory_rate INT CHECK (respiratory_rate BETWEEN 5 AND 60),
    oxygen_saturation DECIMAL(5,2) CHECK (oxygen_saturation BETWEEN 50.0 AND 100.0),
    weight DECIMAL(6,2) CHECK (weight > 0.0), -- kg
    height DECIMAL(5,2) CHECK (height > 0.0), -- cm
    bmi DECIMAL(5,2),
    blood_sugar DECIMAL(6,2),
    recorded_by_user_id UUID REFERENCES users(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    diagnosis_name VARCHAR(255) NOT NULL,
    icd10_code VARCHAR(30),
    diagnosis_type VARCHAR(30) DEFAULT 'provisional' CHECK (diagnosis_type IN ('provisional', 'confirmed', 'differential', 'secondary')),
    clinical_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    prescription_number VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'partially_dispensed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, prescription_number)
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL, -- e.g. 500mg
    frequency VARCHAR(100) NOT NULL, -- e.g. 1-0-1 (twice daily)
    duration VARCHAR(50) NOT NULL, -- e.g. 5 days
    route VARCHAR(50) DEFAULT 'oral' CHECK (route IN ('oral', 'iv', 'im', 'subcutaneous', 'topical', 'inhalation', 'drops', 'rectal', 'other')),
    instructions TEXT, -- e.g. after food
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    is_dispensed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

