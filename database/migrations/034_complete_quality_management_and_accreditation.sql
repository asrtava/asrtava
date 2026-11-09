-- ============================================================
-- ASRTAVA HMS - Migration 034: Complete Quality Management, Infection Control,
-- Patient Safety, Incident Reporting, Clinical Governance & Accreditation
-- ============================================================

-- 0. Ensure Organizations Table Exists
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Incident & Adverse Event Reports
CREATE TABLE IF NOT EXISTS qm_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    incident_number VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('PATIENT_FALL', 'MEDICATION_ERROR', 'DIAGNOSTIC_ERROR', 'SURGICAL_SAFETY', 'EQUIPMENT_FAILURE', 'INFECTION_EVENT', 'NEAR_MISS', 'STAFF_INJURY', 'COMMUNICATION_FAILURE')),
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('SENTINEL', 'SERIOUS_ADVERSE', 'MINOR_ADVERSE', 'NEAR_MISS', 'HAZARDOUS_CONDITION')),
    incident_date TIMESTAMPTZ NOT NULL,
    location_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    location_ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    reported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL,
    immediate_action_taken TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'UNDER_INVESTIGATION', 'RCA_IN_PROGRESS', 'CAPA_PENDING', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, incident_number)
);

-- 2. Incident Investigations
CREATE TABLE IF NOT EXISTS qm_incident_investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES qm_incidents(id) ON DELETE CASCADE,
    lead_investigator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investigation_notes TEXT NOT NULL,
    witness_statements TEXT,
    timeline_summary TEXT,
    contributing_factors TEXT,
    investigation_started_at TIMESTAMPTZ DEFAULT NOW(),
    investigation_completed_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ESCALATED'))
);

-- 3. Root Cause Analysis (5-Whys & Fishbone)
CREATE TABLE IF NOT EXISTS qm_root_cause_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES qm_incidents(id) ON DELETE CASCADE,
    methodology VARCHAR(50) NOT NULL DEFAULT 'FIVE_WHYS' CHECK (methodology IN ('FIVE_WHYS', 'FISHBONE_ISHIKAWA', 'BARRIER_ANALYSIS')),
    problem_statement TEXT NOT NULL,
    why_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
    fishbone_categories JSONB,
    root_cause_conclusion TEXT NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Corrective and Preventive Actions (CAPA)
CREATE TABLE IF NOT EXISTS qm_capa_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES qm_incidents(id) ON DELETE SET NULL,
    action_number VARCHAR(50) NOT NULL,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('CORRECTIVE', 'PREVENTIVE')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    assigned_to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    target_completion_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    verification_criteria TEXT NOT NULL,
    is_verified_effective BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED_CLOSED', 'OVERDUE')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, action_number)
);

-- 5. Hospital-Acquired Infection (HAI) Surveillance
CREATE TABLE IF NOT EXISTS qm_hai_surveillance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    infection_type VARCHAR(50) NOT NULL CHECK (infection_type IN ('CAUTI', 'CLABSI', 'VAP', 'SSI', 'HOSPITAL_ACQUIRED_COVID')),
    detected_date DATE NOT NULL,
    device_exposure_days INT NOT NULL DEFAULT 1 CHECK (device_exposure_days > 0),
    causative_organism VARCHAR(100),
    antimicrobial_resistance VARCHAR(100),
    surveillance_classification VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED_HAI',
    investigated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    outcome VARCHAR(50) DEFAULT 'RESOLVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Hand Hygiene Audits (WHO 5 Moments)
CREATE TABLE IF NOT EXISTS qm_hand_hygiene_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    audit_date DATE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    auditor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunities_observed INT NOT NULL CHECK (opportunities_observed > 0),
    compliant_actions INT NOT NULL CHECK (compliant_actions >= 0),
    compliance_percentage NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((compliant_actions::numeric / opportunities_observed::numeric) * 100, 2)) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medication Safety Events & Pharmacovigilance
CREATE TABLE IF NOT EXISTS qm_medication_safety_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('WRONG_DOSE', 'WRONG_ROUTE', 'WRONG_PATIENT', 'WRONG_DRUG', 'OMITTED_DOSE', 'ADVERSE_DRUG_REACTION')),
    drug_name VARCHAR(150) NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'NEAR_MISS' CHECK (severity IN ('NEAR_MISS', 'NO_HARM', 'TEMPORARY_HARM', 'LIFE_THREATENING')),
    immediate_reversal_action TEXT,
    outcome VARCHAR(100),
    reported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Clinical Audits
CREATE TABLE IF NOT EXISTS qm_clinical_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    audit_title VARCHAR(200) NOT NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN ('SURGICAL_SAFETY', 'CLINICAL_DOCUMENTATION', 'ANTIBIOTIC_STEWARDSHIP', 'NURSING_CARE_PLAN', 'DISCHARGE_SUMMARY')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    sample_size INT NOT NULL CHECK (sample_size > 0),
    compliant_records INT NOT NULL CHECK (compliant_records >= 0),
    compliance_rate_percent NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((compliant_records::numeric / sample_size::numeric) * 100, 2)) STORED,
    auditor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Patient Complaints & Grievance Management
CREATE TABLE IF NOT EXISTS qm_patient_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    complaint_number VARCHAR(50) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('CLINICAL_CARE', 'STAFF_CONDUCT', 'BILLING_DISPUTE', 'WAIT_TIME', 'CLEANLINESS', 'PHARMACY_DELAY')),
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'INVESTIGATING', 'RESOLVED', 'ESCALATED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(hospital_id, complaint_number)
);

-- 10. Hospital Risk Register
CREATE TABLE IF NOT EXISTS qm_risk_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    risk_title VARCHAR(200) NOT NULL,
    risk_category VARCHAR(50) NOT NULL CHECK (risk_category IN ('CLINICAL', 'OPERATIONAL', 'FINANCIAL', 'INFO_SECURITY', 'ENVIRONMENTAL', 'INFECTION_CONTROL')),
    likelihood_score INT NOT NULL CHECK (likelihood_score BETWEEN 1 AND 5),
    impact_score INT NOT NULL CHECK (impact_score BETWEEN 1 AND 5),
    inherent_risk_score INT GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
    existing_controls TEXT NOT NULL,
    mitigation_plan TEXT NOT NULL,
    risk_owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MITIGATED', 'ACCEPTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Quality Indicators & Performance Measurement
CREATE TABLE IF NOT EXISTS qm_quality_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    indicator_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    numerator_definition TEXT NOT NULL,
    denominator_definition TEXT NOT NULL,
    measurement_unit VARCHAR(30) NOT NULL DEFAULT 'RATE_PER_1000',
    target_benchmark NUMERIC(8,2) NOT NULL,
    current_value NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    reporting_period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    is_within_target BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, indicator_code)
);

-- 12. Accreditation Frameworks & Standards Mapping (NABH / NABL)
CREATE TABLE IF NOT EXISTS qm_accreditation_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    framework_name VARCHAR(50) NOT NULL CHECK (framework_name IN ('NABH_5TH_EDITION', 'NABL_ISO_15189', 'JCI_7TH_EDITION')),
    clause_number VARCHAR(50) NOT NULL,
    chapter_title VARCHAR(150) NOT NULL,
    requirement_description TEXT NOT NULL,
    evidence_document_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    compliance_status VARCHAR(30) NOT NULL DEFAULT 'PARTIALLY_COMPLIANT' CHECK (compliance_status IN ('COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE')),
    responsible_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, framework_name, clause_number)
);

-- 13. Controlled Documents (Policies, SOPs, Clinical Guidelines)
CREATE TABLE IF NOT EXISTS qm_controlled_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    document_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('POLICY', 'SOP', 'CLINICAL_GUIDELINE', 'QUALITY_MANUAL', 'WORK_INSTRUCTION')),
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    effective_date DATE NOT NULL,
    review_date DATE NOT NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SUPERSEDED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, document_number, version)
);

-- 14. Mock Inspections & Accreditation Readiness
CREATE TABLE IF NOT EXISTS qm_mock_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    inspection_title VARCHAR(200) NOT NULL,
    target_framework VARCHAR(50) NOT NULL,
    inspection_date DATE NOT NULL,
    lead_assessor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_clauses_checked INT NOT NULL CHECK (total_clauses_checked > 0),
    compliant_clauses INT NOT NULL CHECK (compliant_clauses >= 0),
    readiness_percentage NUMERIC(5,2) GENERATED ALWAYS AS (ROUND((compliant_clauses::numeric / total_clauses_checked::numeric) * 100, 2)) STORED,
    major_non_conformities_count INT NOT NULL DEFAULT 0,
    capa_action_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compound Indexes for Fast Analytics & Regulatory Audits
CREATE INDEX IF NOT EXISTS idx_qm_incidents_dept ON qm_incidents(hospital_id, location_department_id, severity, status);
CREATE INDEX IF NOT EXISTS idx_qm_capa_status ON qm_capa_actions(hospital_id, status, target_completion_date);
CREATE INDEX IF NOT EXISTS idx_qm_hai_patient ON qm_hai_surveillance(hospital_id, infection_type, detected_date);
CREATE INDEX IF NOT EXISTS idx_qm_complaints_status ON qm_patient_complaints(hospital_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_qm_accreditation_clause ON qm_accreditation_standards(hospital_id, framework_name, compliance_status);

-- Enable PostgreSQL Row-Level Security (RLS)
ALTER TABLE qm_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_incident_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_root_cause_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_capa_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_hai_surveillance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_hand_hygiene_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_medication_safety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_clinical_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_patient_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_risk_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_quality_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_accreditation_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_controlled_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE qm_mock_inspections ENABLE ROW LEVEL SECURITY;

-- Standard Multi-Tenant Isolation Policies
CREATE POLICY qm_incidents_tenant_isolation ON qm_incidents
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_incident_investigations_tenant_isolation ON qm_incident_investigations
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_root_cause_analyses_tenant_isolation ON qm_root_cause_analyses
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_capa_actions_tenant_isolation ON qm_capa_actions
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_hai_surveillance_tenant_isolation ON qm_hai_surveillance
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_hand_hygiene_audits_tenant_isolation ON qm_hand_hygiene_audits
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_medication_safety_events_tenant_isolation ON qm_medication_safety_events
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_clinical_audits_tenant_isolation ON qm_clinical_audits
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_patient_complaints_tenant_isolation ON qm_patient_complaints
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_risk_register_tenant_isolation ON qm_risk_register
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_quality_indicators_tenant_isolation ON qm_quality_indicators
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_accreditation_standards_tenant_isolation ON qm_accreditation_standards
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_controlled_documents_tenant_isolation ON qm_controlled_documents
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY qm_mock_inspections_tenant_isolation ON qm_mock_inspections
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

