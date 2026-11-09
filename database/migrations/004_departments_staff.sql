-- ============================================================
-- ASRTAVA HMS - Migration 004: Departments, Doctors & Staff Profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30),
    department_type VARCHAR(30) DEFAULT 'clinical' CHECK (department_type IN ('clinical', 'diagnostic', 'administrative', 'support', 'pharmacy', 'emergency')),
    head_of_department_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, name)
);

CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_number VARCHAR(50),
    specialization VARCHAR(255) NOT NULL,
    sub_specialization VARCHAR(255),
    qualification VARCHAR(255) NOT NULL,
    experience_years INT DEFAULT 0 CHECK (experience_years >= 0),
    medical_council_reg_number VARCHAR(100),
    consultation_fee DECIMAL(10,2) DEFAULT 0.00 CHECK (consultation_fee >= 0.00),
    follow_up_fee DECIMAL(10,2) DEFAULT 0.00 CHECK (follow_up_fee >= 0.00),
    follow_up_validity_days INT DEFAULT 7 CHECK (follow_up_validity_days >= 0),
    teleconsultation_enabled BOOLEAN DEFAULT FALSE,
    teleconsultation_fee DECIMAL(10,2) DEFAULT 0.00,
    bio TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT DEFAULT 15 CHECK (slot_duration IN (10, 15, 20, 30, 45, 60)),
    max_patients INT DEFAULT 25,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_doctor_schedule_times CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    employment_status VARCHAR(30) DEFAULT 'permanent' CHECK (employment_status IN ('probation', 'permanent', 'contractor', 'visiting', 'intern')),
    date_of_joining DATE DEFAULT CURRENT_DATE,
    date_of_leaving DATE,
    medical_council_reg_number VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    base_monthly_salary DECIMAL(12,2) DEFAULT 0.00,
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, employee_code)
);
