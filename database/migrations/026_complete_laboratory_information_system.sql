-- ============================================================================
-- ASRTAVA Hospital Management System
-- Migration: 026_complete_laboratory_information_system.sql
-- Description: Complete enterprise schema for Laboratory Information System (LIS),
--              Pathology, Specimen Lifecycle, Analyzer Results Staging,
--              Microbiology AST, Histopathology & Quality Control (Westgard).
-- ============================================================================

-- 1. Laboratory Departments
CREATE TABLE IF NOT EXISTS lis_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL, -- 'BIOCHEM', 'HAEMAT', 'MICROBIO', 'HISTOPATH', 'IMMUNO'
    name VARCHAR(100) NOT NULL,
    head_of_department_id UUID REFERENCES users(id),
    location_room VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Granular Laboratory Test Parameters & Bio-Reference Ranges
CREATE TABLE IF NOT EXISTS lis_test_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES lis_departments(id) ON DELETE CASCADE,
    parameter_code VARCHAR(50) NOT NULL, -- e.g. 'K_POTASSIUM', 'HB_HEMOGLOBIN'
    parameter_name VARCHAR(100) NOT NULL,
    unit_of_measure VARCHAR(30) NOT NULL, -- 'mmol/L', 'g/dL', 'mg/dL'
    loinc_code VARCHAR(30),
    methodology VARCHAR(100),
    ref_range_male_min NUMERIC(8,2),
    ref_range_male_max NUMERIC(8,2),
    ref_range_female_min NUMERIC(8,2),
    ref_range_female_max NUMERIC(8,2),
    critical_low NUMERIC(8,2),
    critical_high NUMERIC(8,2),
    turnaround_target_mins INT DEFAULT 120,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Test Profiles & Panels
CREATE TABLE IF NOT EXISTS lis_test_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    profile_code VARCHAR(50) NOT NULL, -- 'CBC_DIFF', 'LIPID_PROFILE', 'LFT'
    profile_name VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES lis_departments(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lis_test_profile_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES lis_test_profiles(id) ON DELETE CASCADE,
    parameter_id UUID NOT NULL REFERENCES lis_test_parameters(id) ON DELETE CASCADE,
    display_order INT DEFAULT 1
);

-- 4. Specimen Lifecycle & Accessioning
CREATE TABLE IF NOT EXISTS lis_specimens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    accession_number VARCHAR(50) NOT NULL UNIQUE,
    barcode_string VARCHAR(100) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE,
    specimen_type VARCHAR(50) NOT NULL, -- 'WHOLE_BLOOD', 'SERUM', 'URINE', 'CSF', 'TISSUE'
    container_type VARCHAR(50) NOT NULL, -- 'EDTA_LAVENDER', 'SST_GOLD', 'CITRATE_BLUE', 'FLUORIDE_GREY'
    collection_time TIMESTAMPTZ,
    collected_by_user_id UUID REFERENCES users(id),
    received_time TIMESTAMPTZ,
    received_by_user_id UUID REFERENCES users(id),
    specimen_condition VARCHAR(30) DEFAULT 'ACCEPTABLE' CHECK (specimen_condition IN ('ACCEPTABLE', 'HEMOLYZED', 'LIPEMIC', 'ICTERIC', 'CLOTTED', 'INSUFFICIENT_VOLUME', 'LEAKING')),
    processing_status VARCHAR(30) DEFAULT 'COLLECTED' CHECK (processing_status IN ('COLLECTION_PENDING', 'COLLECTED', 'RECEIVED', 'IN_PROCESS', 'TESTED', 'AUTHORIZED', 'REJECTED', 'DISPOSED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Specimen Rejection & Recollection Log
CREATE TABLE IF NOT EXISTS lis_specimen_rejections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE,
    rejection_reason VARCHAR(100) NOT NULL,
    rejected_by_user_id UUID NOT NULL REFERENCES users(id),
    recollection_requested BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Laboratory Test Results & Abnormality Flagging
CREATE TABLE IF NOT EXISTS lis_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE,
    parameter_id UUID NOT NULL REFERENCES lis_test_parameters(id) ON DELETE CASCADE,
    numeric_value NUMERIC(10,3),
    text_value VARCHAR(255),
    abnormality_flag VARCHAR(20) DEFAULT 'NORMAL' CHECK (abnormality_flag IN ('NORMAL', 'ABNORMAL_HIGH', 'ABNORMAL_LOW', 'CRITICAL_PANIC')),
    validation_status VARCHAR(30) DEFAULT 'ENTERED' CHECK (validation_status IN ('ENTERED', 'TECHNICALLY_VALIDATED', 'PATHOLOGIST_AUTHORIZED', 'AMENDED')),
    delta_check_flag VARCHAR(20) DEFAULT 'STABLE' CHECK (delta_check_flag IN ('STABLE', 'SIGNIFICANT_RISE', 'SIGNIFICANT_DROP')),
    technologist_user_id UUID REFERENCES users(id),
    pathologist_user_id UUID REFERENCES users(id),
    authorized_at TIMESTAMPTZ,
    is_amended BOOLEAN DEFAULT false,
    amendment_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Critical / Panic Value Alerts
CREATE TABLE IF NOT EXISTS lis_critical_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    result_id UUID NOT NULL REFERENCES lis_test_results(id) ON DELETE CASCADE,
    clinician_notified_id UUID REFERENCES users(id),
    notification_channel VARCHAR(30) NOT NULL, -- 'TELEPHONE_READ_BACK', 'IN_APP_BROADCAST', 'SMS_URGENT'
    notified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    clinical_action_taken TEXT
);

-- 8. Microbiology Cultures & Colony Growth
CREATE TABLE IF NOT EXISTS lis_microbiology_cultures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE,
    organism_isolated VARCHAR(100),
    colony_count_cfu_ml VARCHAR(50),
    growth_status VARCHAR(30) DEFAULT 'PENDING_INCUBATION' CHECK (growth_status IN ('NO_GROWTH', 'GROWTH_OBSERVED', 'CONTAMINATED', 'PENDING_INCUBATION')),
    gram_stain_result VARCHAR(100),
    preliminary_report_released_at TIMESTAMPTZ,
    final_report_released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Antimicrobial Susceptibility Testing (AST)
CREATE TABLE IF NOT EXISTS lis_antimicrobial_susceptibilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    culture_id UUID NOT NULL REFERENCES lis_microbiology_cultures(id) ON DELETE CASCADE,
    antibiotic_name VARCHAR(100) NOT NULL,
    mic_value VARCHAR(30),
    susceptibility_interpretation VARCHAR(20) NOT NULL CHECK (susceptibility_interpretation IN ('SENSITIVE', 'INTERMEDIATE', 'RESISTANT')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Histopathology & Cytology Cases
CREATE TABLE IF NOT EXISTS lis_histopathology_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    biopsy_number VARCHAR(50) NOT NULL UNIQUE,
    specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE,
    tissue_site VARCHAR(100) NOT NULL,
    gross_description TEXT NOT NULL,
    cassette_count INT DEFAULT 1,
    microscopic_findings TEXT NOT NULL,
    pathologic_diagnosis TEXT NOT NULL,
    reporting_pathologist_id UUID NOT NULL REFERENCES users(id),
    authorized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Internal Quality Control (IQC) & Westgard Rules
CREATE TABLE IF NOT EXISTS lis_qc_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    control_lot_number VARCHAR(50) NOT NULL,
    parameter_id UUID NOT NULL REFERENCES lis_test_parameters(id) ON DELETE CASCADE,
    target_mean NUMERIC(8,2) NOT NULL,
    standard_deviation NUMERIC(8,2) NOT NULL,
    measured_value NUMERIC(8,2) NOT NULL,
    z_score NUMERIC(5,2) NOT NULL,
    westgard_violation VARCHAR(20), -- '1_2S', '1_3S', '2_2S', 'R_4S', '10_X'
    run_status VARCHAR(30) NOT NULL CHECK (run_status IN ('IN_CONTROL', 'WARNING', 'OUT_OF_CONTROL_REJECT')),
    corrective_action TEXT,
    run_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Reagent Lots & Expiry Tracking
CREATE TABLE IF NOT EXISTS lis_reagent_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    reagent_name VARCHAR(100) NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    current_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (current_status IN ('ACTIVE', 'EXPIRED_QUARANTINED', 'DEPLETED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE lis_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_test_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_test_profile_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_specimens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_specimen_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_critical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_microbiology_cultures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_antimicrobial_susceptibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_histopathology_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_qc_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lis_reagent_lots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HIGH-PERFORMANCE COMPOSITE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_lis_dept_hosp ON lis_departments(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lis_param_dept ON lis_test_parameters(hospital_id, department_id, parameter_code);
CREATE INDEX IF NOT EXISTS idx_lis_specimens_accession ON lis_specimens(hospital_id, accession_number);
CREATE INDEX IF NOT EXISTS idx_lis_specimens_patient ON lis_specimens(hospital_id, patient_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_lis_results_specimen ON lis_test_results(hospital_id, specimen_id, validation_status);
CREATE INDEX IF NOT EXISTS idx_lis_results_abnormality ON lis_test_results(hospital_id, abnormality_flag);
CREATE INDEX IF NOT EXISTS idx_lis_critical_alerts_hosp ON lis_critical_alerts(hospital_id, notified_at);
CREATE INDEX IF NOT EXISTS idx_lis_microbio_specimen ON lis_microbiology_cultures(hospital_id, specimen_id);
CREATE INDEX IF NOT EXISTS idx_lis_histopath_biopsy ON lis_histopathology_cases(hospital_id, biopsy_number);
CREATE INDEX IF NOT EXISTS idx_lis_qc_param_date ON lis_qc_measurements(hospital_id, parameter_id, run_at);
CREATE INDEX IF NOT EXISTS idx_lis_reagents_lot ON lis_reagent_lots(hospital_id, lot_number, expiry_date);

