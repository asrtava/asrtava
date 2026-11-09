-- ============================================================================
-- ASRTAVA Hospital Management System
-- 004_departments.sql - Hospital Departments
-- ============================================================================

-- ---------------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------------
CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20),
    description     TEXT,
    head_doctor_id  UUID,  -- FK added after doctors table is created
    is_active       BOOLEAN DEFAULT true,
    display_order   INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, name)
);
