-- ============================================================
-- ASRTAVA HMS - Migration 009: Laboratory & Radiology Diagnostics
-- ============================================================

CREATE TABLE IF NOT EXISTS lab_test_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    test_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'biochemistry' CHECK (department IN ('biochemistry', 'hematology', 'microbiology', 'pathology', 'immunology', 'histopathology')),
    specimen_type VARCHAR(50) NOT NULL CHECK (specimen_type IN ('blood', 'serum', 'plasma', 'urine', 'stool', 'csf', 'sputum', 'swab', 'biopsy', 'other')),
    default_container_color VARCHAR(30) DEFAULT 'purple',
    standard_fee DECIMAL(10,2) NOT NULL CHECK (standard_fee >= 0.00),
    reference_range_male TEXT,
    reference_range_female TEXT,
    reference_range_pediatric TEXT,
    measurement_unit VARCHAR(50), -- e.g. mg/dL, /mcL, g/dL
    turnaround_time_hours INT DEFAULT 24 CHECK (turnaround_time_hours > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, test_code)
);

CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ordering_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    order_status VARCHAR(30) DEFAULT 'ordered' CHECK (order_status IN ('ordered', 'sample_collected', 'processing', 'completed', 'cancelled')),
    clinical_notes TEXT,
    ordered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, order_number)
);

CREATE TABLE IF NOT EXISTS lab_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES lab_test_catalog(id) ON DELETE RESTRICT,
    item_status VARCHAR(30) DEFAULT 'pending' CHECK (item_status IN ('pending', 'sample_collected', 'in_analysis', 'result_entered', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_specimens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    barcode_number VARCHAR(100) NOT NULL,
    specimen_type VARCHAR(50) NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    collected_by_user_id UUID REFERENCES users(id),
    received_at_lab TIMESTAMPTZ,
    rejection_reason TEXT,
    UNIQUE (hospital_id, barcode_number)
);

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    lab_order_item_id UUID NOT NULL UNIQUE REFERENCES lab_order_items(id) ON DELETE CASCADE,
    quantitative_value TEXT,
    qualitative_value TEXT,
    is_abnormal BOOLEAN DEFAULT FALSE,
    is_critical_panic_value BOOLEAN DEFAULT FALSE,
    technologist_remarks TEXT,
    entered_by_tech_id UUID REFERENCES users(id),
    entered_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by_pathologist_id UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radiology_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    procedure_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    modality VARCHAR(30) NOT NULL CHECK (modality IN ('xray', 'ct', 'mri', 'ultrasound', 'mammography', 'fluoroscopy', 'pet_ct', 'dexa')),
    standard_fee DECIMAL(10,2) NOT NULL CHECK (standard_fee >= 0.00),
    preparation_instructions TEXT, -- e.g. Fasting 6 hours
    duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, procedure_code)
);

CREATE TABLE IF NOT EXISTS radiology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ordering_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES radiology_procedures(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    modality VARCHAR(30) NOT NULL,
    priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    status VARCHAR(30) DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'exam_completed', 'reported', 'cancelled')),
    clinical_history TEXT,
    scheduled_at TIMESTAMPTZ,
    exam_completed_at TIMESTAMPTZ,
    performed_by_technologist_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, order_number)
);

CREATE TABLE IF NOT EXISTS radiology_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    radiology_order_id UUID NOT NULL UNIQUE REFERENCES radiology_orders(id) ON DELETE CASCADE,
    clinical_indication TEXT,
    technique_description TEXT,
    imaging_findings TEXT NOT NULL,
    impression_summary TEXT NOT NULL,
    recommendations TEXT,
    pacs_dicom_study_uid VARCHAR(255), -- PACS / DICOM Study Instance UID pointer
    attachment_urls JSONB DEFAULT '[]',
    reported_by_radiologist_id UUID NOT NULL REFERENCES users(id),
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'finalized' CHECK (status IN ('draft', 'finalized', 'amended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

