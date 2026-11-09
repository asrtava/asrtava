-- ============================================================================
-- ASRTAVA Hospital Management System
-- 009_appointments.sql - Appointment Management
-- ============================================================================

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id          UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id           UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id       UUID
        REFERENCES departments(id) ON DELETE SET NULL,
    appointment_number  VARCHAR(50) NOT NULL,
    appointment_date    DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    appointment_type    VARCHAR(30)
        CHECK (appointment_type IN ('new', 'follow_up', 'walk_in', 'emergency', 'teleconsultation')),
    status              VARCHAR(20) DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress',
                          'completed', 'cancelled', 'no_show', 'rescheduled')),
    reason              TEXT,
    notes               TEXT,
    cancellation_reason TEXT,
    rescheduled_from    UUID
        REFERENCES appointments(id) ON DELETE SET NULL,
    rescheduled_to      UUID
        REFERENCES appointments(id) ON DELETE SET NULL,
    created_by          UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, appointment_number)
);
