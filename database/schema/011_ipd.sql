-- ============================================================================
-- ASRTAVA Hospital Management System
-- 011_ipd.sql - Inpatient Department (Admissions, Nursing, Progress)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- admissions
-- ---------------------------------------------------------------------------
CREATE TABLE admissions (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id                 UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id                  UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id                   UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    department_id               UUID
        REFERENCES departments(id) ON DELETE SET NULL,
    admission_number            VARCHAR(50) NOT NULL,
    admission_date              TIMESTAMPTZ DEFAULT NOW(),
    expected_discharge_date     DATE,
    actual_discharge_date       TIMESTAMPTZ,
    admission_type              VARCHAR(30)
        CHECK (admission_type IN ('emergency', 'planned', 'transfer', 'referral')),
    admission_reason            TEXT,
    diagnosis                   TEXT,
    status                      VARCHAR(20) DEFAULT 'admitted'
        CHECK (status IN ('admitted', 'under_treatment', 'ready_for_discharge',
                          'discharged', 'transferred', 'absconded')),
    discharge_summary           TEXT,
    discharge_type              VARCHAR(30)
        CHECK (discharge_type IN ('normal', 'against_medical_advice', 'transferred', 'expired')),
    discharged_by               UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_by                  UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, admission_number)
);

-- ---------------------------------------------------------------------------
-- nursing_notes
-- ---------------------------------------------------------------------------
CREATE TABLE nursing_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admission_id    UUID NOT NULL
        REFERENCES admissions(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    note_type       VARCHAR(30)
        CHECK (note_type IN ('observation', 'medication', 'procedure', 'assessment', 'handover')),
    content         TEXT NOT NULL,
    recorded_by     UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- daily_progress
-- ---------------------------------------------------------------------------
CREATE TABLE daily_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admission_id    UUID NOT NULL
        REFERENCES admissions(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    progress_date   DATE NOT NULL,
    doctor_notes    TEXT,
    nurse_notes     TEXT,
    vitals          JSONB,
    diet            TEXT,
    treatment_given TEXT,
    status          VARCHAR(50),
    recorded_by     UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
