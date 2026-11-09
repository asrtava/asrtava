-- ============================================================================
-- ASRTAVA Hospital Management System
-- Migration: 027_advanced_ris_pacs_and_dicom_imaging.sql
-- Description: Complete enterprise schema for Radiology Information System (RIS),
--              PACS, DICOM Modalities, Modality Worklists, Pre-imaging Screening,
--              Structured Reporting, Critical Findings & Contrast Administration.
-- ============================================================================

-- 1. Modality Stations & AE Titles
CREATE TABLE IF NOT EXISTS ris_modalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    modality_code VARCHAR(30) NOT NULL, -- 'CT01_SOMATOM', 'MRI01_MAGNETOM', 'XR01_DIGITAL'
    modality_type VARCHAR(20) NOT NULL CHECK (modality_type IN ('CT', 'MR', 'XR', 'US', 'MG', 'FL', 'NM', 'DX')),
    name VARCHAR(100) NOT NULL,
    ae_title VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    port_number INT NOT NULL DEFAULT 104,
    location_room VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Imaging Procedure Master
CREATE TABLE IF NOT EXISTS ris_procedure_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    procedure_code VARCHAR(50) NOT NULL, -- e.g. 'CT_BRAIN_NC', 'MRI_LUMBAR_GAD', 'XR_CHEST_PA'
    procedure_name VARCHAR(100) NOT NULL,
    modality_type VARCHAR(20) NOT NULL CHECK (modality_type IN ('CT', 'MR', 'XR', 'US', 'MG', 'FL', 'NM', 'DX')),
    body_region VARCHAR(50) NOT NULL, -- 'HEAD_NECK', 'CHEST', 'ABDOMEN_PELVIS', 'SPINE', 'EXTREMITIES'
    contrast_requirement VARCHAR(30) DEFAULT 'NONE' CHECK (contrast_requirement IN ('NONE', 'IV_IODINATED', 'IV_GADOLINIUM', 'ORAL', 'RECTAL')),
    expected_duration_mins INT DEFAULT 30,
    preparation_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Radiology Imaging Orders
CREATE TABLE IF NOT EXISTS ris_imaging_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ordering_doctor_id UUID NOT NULL REFERENCES users(id),
    procedure_id UUID NOT NULL REFERENCES ris_procedure_master(id) ON DELETE RESTRICT,
    priority VARCHAR(20) DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'STAT')),
    clinical_indication TEXT NOT NULL,
    relevant_diagnosis VARCHAR(255),
    requires_contrast BOOLEAN DEFAULT false,
    order_status VARCHAR(30) DEFAULT 'SUBMITTED' CHECK (order_status IN ('SUBMITTED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'ACQUISITION_COMPLETED', 'REPORTED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Modality Appointment Scheduling
CREATE TABLE IF NOT EXISTS ris_imaging_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES ris_imaging_orders(id) ON DELETE CASCADE,
    modality_id UUID NOT NULL REFERENCES ris_modalities(id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    radiographer_user_id UUID REFERENCES users(id),
    appointment_status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (appointment_status IN ('SCHEDULED', 'PATIENT_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Pre-Imaging Patient Screening Checklist
CREATE TABLE IF NOT EXISTS ris_patient_screenings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES ris_imaging_appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    egfr_value NUMERIC(5,2),
    is_contrast_allergy_history BOOLEAN DEFAULT false,
    is_pacemaker_or_ferrous_implant BOOLEAN DEFAULT false,
    is_pregnant BOOLEAN DEFAULT false,
    fasting_hours_completed INT DEFAULT 0,
    screening_notes TEXT,
    cleared_for_scan BOOLEAN DEFAULT true,
    screened_by_user_id UUID NOT NULL REFERENCES users(id),
    screened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PACS Studies Index
CREATE TABLE IF NOT EXISTS pacs_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    study_instance_uid VARCHAR(128) NOT NULL UNIQUE,
    accession_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    order_id UUID REFERENCES ris_imaging_orders(id) ON DELETE SET NULL,
    study_date DATE NOT NULL,
    study_time TIME NOT NULL,
    study_description VARCHAR(255) NOT NULL,
    modality VARCHAR(20) NOT NULL,
    total_series INT DEFAULT 1,
    total_instances INT DEFAULT 1,
    storage_uri VARCHAR(512) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. PACS Series Index
CREATE TABLE IF NOT EXISTS pacs_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID NOT NULL REFERENCES pacs_studies(id) ON DELETE CASCADE,
    series_instance_uid VARCHAR(128) NOT NULL UNIQUE,
    series_number INT NOT NULL,
    modality VARCHAR(20) NOT NULL,
    body_part_examined VARCHAR(50),
    series_description VARCHAR(255),
    slice_thickness_mm NUMERIC(5,2)
);

-- 8. PACS Instances Metadata
CREATE TABLE IF NOT EXISTS pacs_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES pacs_series(id) ON DELETE CASCADE,
    sop_instance_uid VARCHAR(128) NOT NULL UNIQUE,
    instance_number INT NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    window_center INT,
    window_width INT
);

-- 9. Structured Radiology Reports
CREATE TABLE IF NOT EXISTS ris_radiology_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    study_id UUID NOT NULL REFERENCES pacs_studies(id) ON DELETE CASCADE,
    reporting_radiologist_id UUID NOT NULL REFERENCES users(id),
    technique_notes TEXT NOT NULL,
    comparison_notes TEXT,
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    recommendations TEXT,
    report_status VARCHAR(20) DEFAULT 'DRAFT' CHECK (report_status IN ('DRAFT', 'PRELIMINARY', 'AUTHORIZED', 'AMENDED')),
    authorized_at TIMESTAMPTZ,
    is_amended BOOLEAN DEFAULT false,
    amendment_reason TEXT,
    digital_signature_hash VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Critical Imaging Finding Escalation
CREATE TABLE IF NOT EXISTS ris_critical_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES ris_radiology_reports(id) ON DELETE CASCADE,
    critical_condition VARCHAR(100) NOT NULL, -- 'INTRACRANIAL_HEMORRHAGE', 'TENSION_PNEUMOTHORAX', 'AORTIC_DISSECTION', 'PULMONARY_EMBOLISM'
    clinician_notified_id UUID REFERENCES users(id),
    notification_channel VARCHAR(30) NOT NULL, -- 'TELEPHONE_READ_BACK', 'DIRECT_IN_PERSON'
    notified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_back_confirmed BOOLEAN DEFAULT true,
    action_notes TEXT
);

-- 11. Contrast Media Administration Log
CREATE TABLE IF NOT EXISTS ris_contrast_administrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES ris_imaging_appointments(id) ON DELETE CASCADE,
    contrast_name VARCHAR(100) NOT NULL, -- 'Omnipaque 350', 'Gadovist 1.0'
    batch_lot_number VARCHAR(50) NOT NULL,
    volume_administered_ml NUMERIC(5,1) NOT NULL,
    flow_rate_ml_sec NUMERIC(4,1) DEFAULT 2.0,
    injection_site VARCHAR(50) NOT NULL,
    administered_by_user_id UUID NOT NULL REFERENCES users(id),
    adverse_reaction_observed BOOLEAN DEFAULT false,
    adverse_reaction_notes TEXT,
    administered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE ris_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_procedure_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_imaging_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_imaging_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_patient_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacs_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_critical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ris_contrast_administrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HIGH-PERFORMANCE COMPOSITE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ris_modalities_hosp ON ris_modalities(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ris_procedures_mod ON ris_procedure_master(hospital_id, modality_type);
CREATE INDEX IF NOT EXISTS idx_ris_orders_patient ON ris_imaging_orders(hospital_id, patient_id, order_status);
CREATE INDEX IF NOT EXISTS idx_ris_appts_modality_time ON ris_imaging_appointments(hospital_id, modality_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_pacs_studies_accession ON pacs_studies(hospital_id, accession_number);
CREATE INDEX IF NOT EXISTS idx_pacs_studies_uid ON pacs_studies(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_ris_reports_study ON ris_radiology_reports(hospital_id, study_id, report_status);
CREATE INDEX IF NOT EXISTS idx_ris_critical_hosp ON ris_critical_findings(hospital_id, notified_at);
CREATE INDEX IF NOT EXISTS idx_ris_contrast_appt ON ris_contrast_administrations(hospital_id, appointment_id);

