-- ============================================================
-- ASRTAVA HMS - Migration 007: Wards, Beds, Admissions & Inpatient IPD
-- ============================================================

CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30),
    ward_type VARCHAR(30) DEFAULT 'general' CHECK (ward_type IN ('general', 'semi_private', 'private', 'icu', 'nicu', 'picu', 'isolation', 'emergency', 'maternity', 'post_op')),
    floor VARCHAR(20),
    total_beds INT DEFAULT 0 CHECK (total_beds >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, name)
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    room_number VARCHAR(30) NOT NULL,
    room_type VARCHAR(30) DEFAULT 'standard' CHECK (room_type IN ('single', 'double', 'triple', 'multi', 'deluxe', 'icu_suite')),
    daily_rate DECIMAL(10,2) DEFAULT 0.00 CHECK (daily_rate >= 0.00),
    has_ac BOOLEAN DEFAULT FALSE,
    has_oxygen_port BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, room_number)
);

CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_number VARCHAR(30) NOT NULL,
    bed_type VARCHAR(30) DEFAULT 'standard' CHECK (bed_type IN ('standard', 'fowler', 'icu', 'pediatric', 'bariatric')),
    status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance', 'cleaning')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, bed_number)
);

CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admitting_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    admission_number VARCHAR(50) NOT NULL,
    admission_date TIMESTAMPTZ DEFAULT NOW(),
    expected_discharge_date TIMESTAMPTZ,
    actual_discharge_date TIMESTAMPTZ,
    admission_type VARCHAR(30) DEFAULT 'emergency' CHECK (admission_type IN ('emergency', 'planned', 'referral', 'day_care')),
    status VARCHAR(30) DEFAULT 'admitted' CHECK (status IN ('admitted', 'under_treatment', 'ready_for_discharge', 'discharged', 'transferred', 'absconded')),
    initial_diagnosis TEXT,
    discharge_summary TEXT,
    discharge_disposition VARCHAR(30) CHECK (discharge_disposition IN ('home', 'transferred_other_hospital', 'against_medical_advice', 'deceased')),
    admitted_by_user_id UUID REFERENCES users(id),
    discharged_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, admission_number)
);

CREATE TABLE IF NOT EXISTS bed_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
    allocated_from TIMESTAMPTZ DEFAULT NOW(),
    allocated_until TIMESTAMPTZ,
    is_current BOOLEAN DEFAULT TRUE,
    transfer_reason TEXT,
    allocated_by_user_id UUID REFERENCES users(id),
    released_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nursing_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    note_category VARCHAR(30) DEFAULT 'observation' CHECK (note_category IN ('observation', 'assessment', 'medication', 'procedure', 'dietary', 'handover')),
    observation_text TEXT NOT NULL,
    interventions_performed TEXT,
    recorded_by_nurse_id UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medication_administration_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    prescription_item_id UUID REFERENCES prescription_items(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL,
    dosage_given VARCHAR(100) NOT NULL,
    route VARCHAR(50) DEFAULT 'oral',
    scheduled_time TIMESTAMPTZ NOT NULL,
    administered_time TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'administered', 'omitted', 'refused', 'delayed')),
    omission_reason TEXT,
    administered_by_nurse_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

