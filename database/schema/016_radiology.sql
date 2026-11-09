-- ============================================================================
-- ASRTAVA Hospital Management System
-- 016_radiology.sql - Radiology Management
-- ============================================================================

-- ---------------------------------------------------------------------------
-- radiology_procedures
-- ---------------------------------------------------------------------------
CREATE TABLE radiology_procedures (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id                 UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    procedure_name              VARCHAR(255) NOT NULL,
    procedure_code              VARCHAR(50),
    category                    VARCHAR(100),
    modality                    VARCHAR(50)
        CHECK (modality IN ('xray', 'ct', 'mri', 'ultrasound', 'mammography',
                            'fluoroscopy', 'pet', 'other')),
    description                 TEXT,
    preparation_instructions    TEXT,
    price                       DECIMAL(10,2),
    duration_minutes            INT,
    is_active                   BOOLEAN DEFAULT true,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, procedure_code)
);

-- ---------------------------------------------------------------------------
-- radiology_orders
-- ---------------------------------------------------------------------------
CREATE TABLE radiology_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id          UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id           UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    consultation_id     UUID
        REFERENCES consultations(id) ON DELETE SET NULL,
    procedure_id        UUID NOT NULL
        REFERENCES radiology_procedures(id) ON DELETE RESTRICT,
    order_number        VARCHAR(50) NOT NULL,
    order_date          TIMESTAMPTZ DEFAULT NOW(),
    scheduled_date      TIMESTAMPTZ,
    priority            VARCHAR(20) DEFAULT 'normal',
    clinical_indication TEXT,
    status              VARCHAR(20) DEFAULT 'ordered'
        CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    performed_by        UUID
        REFERENCES users(id) ON DELETE SET NULL,
    performed_at        TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, order_number)
);

-- ---------------------------------------------------------------------------
-- radiology_reports
-- ---------------------------------------------------------------------------
CREATE TABLE radiology_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radiology_order_id  UUID NOT NULL UNIQUE
        REFERENCES radiology_orders(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    findings            TEXT,
    impression          TEXT,
    recommendation      TEXT,
    reported_by         UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    reported_at         TIMESTAMPTZ DEFAULT NOW(),
    approved_by         UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    status              VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'finalized', 'approved', 'amended')),
    attachments         JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
