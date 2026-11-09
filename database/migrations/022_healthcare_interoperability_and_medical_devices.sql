-- ============================================================
-- ASRTAVA HMS - Migration 022: Healthcare Interoperability & Medical Device Integration
-- Comprehensive schema for HL7, FHIR, DICOM PACS/MWL, LIS Analyzers, Medical Devices,
-- Insurance Claims (NHCX), ABDM Ecosystem, and Clinical Terminology Mapping
-- ============================================================

-- ------------------------------------------------------------
-- 1. Medical Devices & Analyzer Equipment Registry
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    device_name VARCHAR(150) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    device_category VARCHAR(50) NOT NULL CHECK (device_category IN (
        'hematology_analyzer',
        'biochemistry_analyzer',
        'immunoassay_analyzer',
        'blood_gas_analyzer',
        'urinalysis_analyzer',
        'ecg_machine',
        'patient_vital_monitor',
        'ventilator',
        'infusion_pump',
        'radiology_modality'
    )),
    protocol_type VARCHAR(50) NOT NULL CHECK (protocol_type IN (
        'hl7_v2',
        'astm_1394',
        'serial_rs232',
        'tcp_socket',
        'rest_webhook',
        'dicom_mwl',
        'proprietary_api'
    )),
    ip_address VARCHAR(45),
    port_number INT,
    serial_baud_rate INT,
    assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'standby', 'offline', 'error', 'maintenance')),
    last_communication_at TIMESTAMPTZ,
    last_calibration_date DATE,
    firmware_version VARCHAR(50),
    is_auto_approve_enabled BOOLEAN DEFAULT FALSE, -- Clinical safety: false enforces pathologist/technician sign-off
    config_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_device_serial UNIQUE (hospital_id, serial_number)
);

-- ------------------------------------------------------------
-- 2. Device Raw Telemetry & Diagnostic Packets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_telemetry_packets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES medical_devices(id) ON DELETE CASCADE,
    packet_format VARCHAR(30) NOT NULL, -- 'astm_1394', 'hl7_oru', 'raw_json', 'modbus'
    raw_payload TEXT NOT NULL,
    parsed_readings JSONB NOT NULL, -- e.g. [{"analyte": "WBC", "value": "7.8", "unit": "10^3/uL", "flag": "NORMAL"}]
    specimen_barcode VARCHAR(100),
    matched_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    matched_order_id UUID REFERENCES lab_orders(id) ON DELETE SET NULL,
    matching_confidence NUMERIC(3, 2) DEFAULT 0.00,
    processing_status VARCHAR(30) DEFAULT 'received' CHECK (processing_status IN (
        'received',
        'validated',
        'mapped',
        'flagged_panic',
        'pending_approval',
        'approved_clinical',
        'rejected'
    )),
    has_panic_values BOOLEAN DEFAULT FALSE,
    panic_escalated_at TIMESTAMPTZ,
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. DICOM Modality Worklist (MWL) & Scanner Queues
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dicom_modality_worklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    radiology_order_id UUID REFERENCES radiology_orders(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    accession_number VARCHAR(100) NOT NULL,
    modality VARCHAR(20) NOT NULL CHECK (modality IN ('CR', 'DX', 'CT', 'MR', 'US', 'XA', 'NM', 'MG', 'PET')),
    scheduled_station_aet VARCHAR(50) NOT NULL,
    scheduled_procedure_step_id VARCHAR(100) NOT NULL,
    scheduled_procedure_description VARCHAR(255) NOT NULL,
    scheduled_datetime TIMESTAMPTZ NOT NULL,
    performing_physician VARCHAR(150),
    step_status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (step_status IN ('SCHEDULED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'DISCONTINUED')),
    quarantine_status VARCHAR(30) DEFAULT 'CLEAR' CHECK (quarantine_status IN ('CLEAR', 'AMBIGUOUS_MATCH', 'MANUAL_RECONCILIATION_REQUIRED')),
    quarantine_reason TEXT,
    reconciled_by_user_id UUID REFERENCES users(id),
    reconciled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_mwl_accession UNIQUE (hospital_id, accession_number)
);

-- ------------------------------------------------------------
-- 4. Clinical Terminology & Code Concept Mappings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS terminology_concept_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL for universal system-wide clinical standard
    source_system VARCHAR(50) NOT NULL, -- 'LOCAL_LAB', 'HOSPITAL_CHARGE', 'ICD_10', 'SNOMED_CT', 'LOINC', 'UCUM', 'ATC'
    source_code VARCHAR(100) NOT NULL,
    source_display VARCHAR(255) NOT NULL,
    target_system VARCHAR(50) NOT NULL, -- 'LOINC', 'SNOMED_CT', 'ICD_10', 'UCUM', 'ATC', 'RxNorm'
    target_code VARCHAR(100) NOT NULL,
    target_display VARCHAR(255) NOT NULL,
    equivalence VARCHAR(30) DEFAULT 'equivalent' CHECK (equivalence IN ('equivalent', 'equal', 'wider', 'subsumes', 'narrower', 'specializes', 'inexact', 'unmatched')),
    is_active BOOLEAN DEFAULT TRUE,
    mapping_version VARCHAR(20) DEFAULT '2026.1',
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_term_mapping UNIQUE (hospital_id, source_system, source_code, target_system)
);

-- ------------------------------------------------------------
-- 5. Insurance Claims, Pre-Authorizations & NHCX Framework
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_payers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL for national platform directory
    payer_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'STAR_HEALTH', 'HDFC_ERGO', 'ICICI_LOMBARD', 'PMJAY_NHCX', 'MD_INDIA_TPA'
    payer_name VARCHAR(150) NOT NULL,
    payer_type VARCHAR(50) NOT NULL CHECK (payer_type IN ('private_insurer', 'government_scheme', 'third_party_administrator', 'corporate_sponsor')),
    integration_protocol VARCHAR(50) NOT NULL CHECK (integration_protocol IN ('nhcx_fhir', 'irda_portal', 'edi_837', 'rest_api', 'manual_portal')),
    api_endpoint_url VARCHAR(255),
    eligibility_endpoint_url VARCHAR(255),
    preauth_endpoint_url VARCHAR(255),
    claim_submission_endpoint_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_preauth_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES insurance_payers(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ipd_admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
    policy_number VARCHAR(100) NOT NULL,
    tpa_member_id VARCHAR(100),
    diagnosis_icd10 VARCHAR(50) NOT NULL,
    proposed_treatment VARCHAR(255) NOT NULL,
    estimated_cost NUMERIC(12, 2) NOT NULL,
    requested_amount NUMERIC(12, 2) NOT NULL,
    approved_amount NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'query_raised', 'approved', 'rejected', 'cancelled')),
    payer_reference_number VARCHAR(100),
    query_details TEXT,
    rejection_reason TEXT,
    denial_code VARCHAR(50),
    submitted_at TIMESTAMPTZ,
    decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_claim_filings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    preauth_request_id UUID REFERENCES insurance_preauth_requests(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES insurance_payers(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    claim_type VARCHAR(30) DEFAULT 'cashless' CHECK (claim_type IN ('cashless', 'reimbursement')),
    total_billed_amount NUMERIC(12, 2) NOT NULL,
    claimed_amount NUMERIC(12, 2) NOT NULL,
    adjudicated_amount NUMERIC(12, 2) DEFAULT 0.00,
    deductible_amount NUMERIC(12, 2) DEFAULT 0.00,
    copay_amount NUMERIC(12, 2) DEFAULT 0.00,
    settlement_status VARCHAR(30) DEFAULT 'filed' CHECK (settlement_status IN ('filed', 'acknowledged', 'under_adjudication', 'approved_settled', 'disputed', 'rejected')),
    external_claim_id VARCHAR(100),
    nhcx_bundle_id VARCHAR(100),
    remittance_reference VARCHAR(100),
    settlement_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. Dead-Letter Queue (DLQ) & Message Recovery
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integration_dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    source_subsystem VARCHAR(50) NOT NULL, -- 'HL7_V2', 'FHIR_R4', 'DICOM_PACS', 'LIS_ANALYZER', 'DEVICE_PACKET', 'INSURANCE_CLAIM'
    message_identifier VARCHAR(150) NOT NULL,
    payload TEXT NOT NULL,
    error_category VARCHAR(50) NOT NULL, -- 'SYNTAX_ERROR', 'VALIDATION_FAILED', 'PATIENT_NOT_FOUND', 'TIMEOUT', 'AUTH_FAILURE', 'REJECTED_BY_DOWNSTREAM'
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'replayed_success', 'abandoned', 'quarantined')),
    replayed_by_user_id UUID REFERENCES users(id),
    replayed_at TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. India Ecosystem (ABDM / NHCX) Telemetry & Milestone Ledger
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abdm_milestone_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    milestone_code VARCHAR(30) NOT NULL CHECK (milestone_code IN ('M1_ABHA_CREATION', 'M2_HIP_SHARE', 'M3_HIU_VIEW', 'NHCX_CLAIM')),
    transaction_id VARCHAR(100) NOT NULL,
    abha_address VARCHAR(100),
    consent_id VARCHAR(100),
    status VARCHAR(30) NOT NULL CHECK (status IN ('REQUESTED', 'OTP_SENT', 'VERIFIED', 'SHARED', 'FAILED')),
    request_payload JSONB,
    response_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. Row-Level Security (RLS) Enablement
-- ------------------------------------------------------------
ALTER TABLE medical_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_telemetry_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_modality_worklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_concept_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_preauth_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claim_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE abdm_milestone_events ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 9. Performance & Index Optimization
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_device_hosp_status ON medical_devices(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_status ON device_telemetry_packets(device_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_telemetry_specimen ON device_telemetry_packets(specimen_barcode);
CREATE INDEX IF NOT EXISTS idx_mwl_station ON dicom_modality_worklist(hospital_id, scheduled_station_aet, step_status);
CREATE INDEX IF NOT EXISTS idx_term_source ON terminology_concept_mappings(source_system, source_code);
CREATE INDEX IF NOT EXISTS idx_insurance_preauth_patient ON insurance_preauth_requests(hospital_id, patient_id, status);
CREATE INDEX IF NOT EXISTS idx_insurance_claim_status ON insurance_claim_filings(hospital_id, settlement_status);
CREATE INDEX IF NOT EXISTS idx_dlq_status ON integration_dead_letter_queue(hospital_id, status, error_category);
CREATE INDEX IF NOT EXISTS idx_abdm_txn ON abdm_milestone_events(transaction_id);

