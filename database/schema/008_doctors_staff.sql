-- ============================================================================
-- ASRTAVA Hospital Management System
-- 008_doctors_staff.sql - Doctors & Staff Records
-- ============================================================================

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
CREATE TABLE doctors (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id       UUID
        REFERENCES departments(id) ON DELETE SET NULL,
    employee_number     VARCHAR(50),
    specialization      VARCHAR(255),
    qualification       VARCHAR(500),
    experience_years    INT,
    license_number      VARCHAR(100),
    consultation_fee    DECIMAL(10,2),
    follow_up_fee       DECIMAL(10,2),
    bio                 TEXT,
    is_available        BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Add the deferred FK from departments -> doctors for head_doctor_id
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head_doctor
    FOREIGN KEY (head_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- doctor_schedules
-- ---------------------------------------------------------------------------
CREATE TABLE doctor_schedules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id       UUID NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    day_of_week     INT NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday .. 6=Saturday
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration   INT DEFAULT 15,
    max_patients    INT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (doctor_id, day_of_week, start_time)
);

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------
CREATE TABLE staff (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id       UUID
        REFERENCES departments(id) ON DELETE SET NULL,
    employee_number     VARCHAR(50),
    designation         VARCHAR(100),
    qualification       VARCHAR(500),
    joining_date        DATE,
    employment_type     VARCHAR(20)
        CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    shift               VARCHAR(20),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, employee_number)
);
