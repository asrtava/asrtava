-- ============================================================================
-- ASRTAVA Hospital Management System
-- 015_laboratory.sql - Laboratory Management
-- ============================================================================

-- ---------------------------------------------------------------------------
-- lab_test_catalog
-- ---------------------------------------------------------------------------
CREATE TABLE lab_test_catalog (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    test_name       VARCHAR(255) NOT NULL,
    test_code       VARCHAR(50),
    category        VARCHAR(100),
    department      VARCHAR(100) DEFAULT 'Laboratory',
    sample_type     VARCHAR(50),
    description     TEXT,
    normal_range    TEXT,
    unit            VARCHAR(50),
    price           DECIMAL(10,2),
    turnaround_time VARCHAR(50),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, test_code)
);

-- ---------------------------------------------------------------------------
-- lab_orders
-- ---------------------------------------------------------------------------
CREATE TABLE lab_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID NOT NULL
        REFERENCES doctors(id) ON DELETE RESTRICT,
    consultation_id UUID
        REFERENCES consultations(id) ON DELETE SET NULL,
    order_number    VARCHAR(50) NOT NULL,
    order_date      TIMESTAMPTZ DEFAULT NOW(),
    priority        VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('normal', 'urgent', 'stat')),
    status          VARCHAR(20) DEFAULT 'ordered'
        CHECK (status IN ('ordered', 'sample_collected', 'processing', 'completed', 'cancelled')),
    clinical_notes  TEXT,
    ordered_by      UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, order_number)
);

-- ---------------------------------------------------------------------------
-- lab_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE lab_order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id        UUID NOT NULL
        REFERENCES lab_orders(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    test_id             UUID NOT NULL
        REFERENCES lab_test_catalog(id) ON DELETE RESTRICT,
    status              VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'sample_collected', 'processing', 'completed', 'cancelled')),
    sample_id           VARCHAR(50),
    sample_collected_at TIMESTAMPTZ,
    sample_collected_by UUID
        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- lab_results
-- ---------------------------------------------------------------------------
CREATE TABLE lab_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_item_id   UUID NOT NULL
        REFERENCES lab_order_items(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    result_value        TEXT,
    unit                VARCHAR(50),
    normal_range        TEXT,
    is_abnormal         BOOLEAN DEFAULT false,
    remarks             TEXT,
    result_entered_by   UUID
        REFERENCES users(id) ON DELETE SET NULL,
    result_entered_at   TIMESTAMPTZ,
    approved_by         UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    status              VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'entered', 'approved', 'rejected')),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
