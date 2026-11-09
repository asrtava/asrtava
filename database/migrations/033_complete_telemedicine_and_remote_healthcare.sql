-- ============================================================
-- ASRTAVA HMS - Migration 033: Complete Telemedicine, Video Consultations,
-- Remote Patient Monitoring (RPM), Patient Engagement & Digital Healthcare
-- ============================================================

-- 0. Ensure Organizations Table and Security Context Functions Exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION current_organization_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_organization_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_hospital_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_hospital_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Telemedicine Services Catalog
CREATE TABLE IF NOT EXISTS tele_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    service_code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    consultation_mode VARCHAR(30) NOT NULL CHECK (consultation_mode IN ('VIDEO', 'AUDIO', 'CHAT', 'HYBRID')),
    duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    base_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (base_fee >= 0),
    follow_up_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (follow_up_fee >= 0),
    gst_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_rate_percent >= 0),
    cancellation_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cancellation_fee >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, service_code)
);

-- 2. Doctor Teleconsultation Profiles & Eligibility
CREATE TABLE IF NOT EXISTS tele_doctor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    is_teleconsult_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    supported_modes TEXT[] DEFAULT ARRAY['VIDEO', 'AUDIO']::TEXT[],
    languages_spoken TEXT[] DEFAULT ARRAY['English', 'Hindi']::TEXT[],
    teleconsult_fee NUMERIC(10,2) NOT NULL DEFAULT 800.00 CHECK (teleconsult_fee >= 0),
    max_daily_virtual_slots INT NOT NULL DEFAULT 20 CHECK (max_daily_virtual_slots > 0),
    verified_credentials_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, doctor_id)
);

-- 3. Telemedicine Appointments & Virtual Rooms
CREATE TABLE IF NOT EXISTS tele_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    appointment_number VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    service_id UUID REFERENCES tele_services(id) ON DELETE SET NULL,
    consultation_mode VARCHAR(30) NOT NULL DEFAULT 'VIDEO' CHECK (consultation_mode IN ('VIDEO', 'AUDIO', 'CHAT', 'HYBRID')),
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    virtual_room_id VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED', 'EXEMPT')),
    payment_reference VARCHAR(100),
    total_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_fee >= 0),
    chief_complaint TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, appointment_number),
    CONSTRAINT valid_tele_time CHECK (end_time > start_time)
);

-- 4. Virtual Waiting Room State Tracking
CREATE TABLE IF NOT EXISTS tele_waiting_room_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    tele_appointment_id UUID NOT NULL REFERENCES tele_appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    queue_position INT NOT NULL DEFAULT 1,
    joined_waiting_room_at TIMESTAMPTZ DEFAULT NOW(),
    doctor_admitted_at TIMESTAMPTZ,
    consultation_started_at TIMESTAMPTZ,
    consultation_ended_at TIMESTAMPTZ,
    device_check_passed BOOLEAN NOT NULL DEFAULT TRUE,
    connection_readiness VARCHAR(30) DEFAULT 'READY' CHECK (connection_readiness IN ('TESTING', 'READY', 'POOR_NETWORK', 'FAILED')),
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'DOCTOR_READY', 'PATIENT_CONNECTED', 'IN_CONSULTATION', 'COMPLETED', 'ABANDONED')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Secure WebRTC Video & Audio Sessions
CREATE TABLE IF NOT EXISTS tele_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    tele_appointment_id UUID NOT NULL REFERENCES tele_appointments(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'WEBRTC_INTERNAL',
    media_room_id VARCHAR(100) NOT NULL,
    is_recorded BOOLEAN NOT NULL DEFAULT FALSE,
    recording_consent_granted BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    termination_reason VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Teleconsultation Informed Consents
CREATE TABLE IF NOT EXISTS tele_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tele_appointment_id UUID REFERENCES tele_appointments(id) ON DELETE SET NULL,
    consent_type VARCHAR(50) NOT NULL DEFAULT 'TELEHEALTH_GENERAL',
    consent_version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    signed_by_name VARCHAR(150) NOT NULL,
    relationship_to_patient VARCHAR(50) DEFAULT 'SELF',
    digital_signature_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. In-Consultation Secure Messaging & Attachments
CREATE TABLE IF NOT EXISTS tele_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    tele_appointment_id UUID NOT NULL REFERENCES tele_appointments(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    attachment_url TEXT,
    attachment_type VARCHAR(50),
    attachment_name VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Teleconsultation Clinical Documentation & Orders
CREATE TABLE IF NOT EXISTS tele_clinical_encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    tele_appointment_id UUID NOT NULL REFERENCES tele_appointments(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    subjective_notes TEXT,
    objective_notes TEXT,
    assessment_notes TEXT,
    plan_notes TEXT,
    icd10_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    investigation_order_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    requires_in_person_follow_up BOOLEAN NOT NULL DEFAULT FALSE,
    referral_type VARCHAR(50) DEFAULT 'NONE' CHECK (referral_type IN ('NONE', 'OPD_IN_PERSON', 'EMERGENCY', 'SPECIALIST', 'INPATIENT_ADMISSION')),
    referral_notes TEXT,
    is_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Remote Patient Monitoring (RPM) Care Plans
CREATE TABLE IF NOT EXISTS rpm_care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    managing_doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    plan_name VARCHAR(150) NOT NULL,
    condition_category VARCHAR(50) NOT NULL CHECK (condition_category IN ('HYPERTENSION', 'DIABETES', 'CARDIAC', 'POST_OP', 'COPD', 'MATERNITY', 'GENERAL_MONITORING')),
    target_metrics TEXT[] DEFAULT ARRAY['BLOOD_PRESSURE', 'HEART_RATE']::TEXT[],
    schedule_frequency VARCHAR(50) NOT NULL DEFAULT 'TWICE_DAILY',
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RPM Clinical Threshold Rules
CREATE TABLE IF NOT EXISTS rpm_threshold_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    condition_category VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    normal_min NUMERIC(8,2) NOT NULL,
    normal_max NUMERIC(8,2) NOT NULL,
    critical_low NUMERIC(8,2),
    critical_high NUMERIC(8,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. RPM Vital Sign Measurements
CREATE TABLE IF NOT EXISTS rpm_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    care_plan_id UUID REFERENCES rpm_care_plans(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('SYSTOLIC_BP', 'DIASTOLIC_BP', 'BLOOD_GLUCOSE', 'SPO2', 'HEART_RATE', 'TEMPERATURE', 'WEIGHT')),
    value NUMERIC(8,2) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    secondary_value NUMERIC(8,2),
    data_source VARCHAR(50) NOT NULL DEFAULT 'MANUAL_PATIENT' CHECK (data_source IN ('MANUAL_PATIENT', 'VERIFIED_DEVICE', 'MOBILE_BLUETOOTH', 'CLINICAL_STAFF')),
    device_identifier VARCHAR(100),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    alert_severity VARCHAR(30) DEFAULT 'NORMAL' CHECK (alert_severity IN ('NORMAL', 'WARNING', 'CRITICAL')),
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    clinical_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RPM Clinical Alerts & Escalation Queue
CREATE TABLE IF NOT EXISTS rpm_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    measurement_id UUID NOT NULL REFERENCES rpm_measurements(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    severity VARCHAR(30) NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('WARNING', 'CRITICAL', 'EMERGENCY')),
    alert_message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UNACKNOWLEDGED' CHECK (status IN ('UNACKNOWLEDGED', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED')),
    acknowledged_by_user_id UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    escalation_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Patient Education Content Repository
CREATE TABLE IF NOT EXISTS patient_education_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    summary TEXT NOT NULL,
    content_html TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')),
    author_doctor_id UUID REFERENCES doctors(id),
    approved_by_user_id UUID REFERENCES users(id),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compound Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tele_appt_lookup ON tele_appointments(hospital_id, scheduled_date, doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_tele_appt_patient ON tele_appointments(hospital_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_tele_waiting_room_status ON tele_waiting_room_entries(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_tele_sessions_token ON tele_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_rpm_meas_patient ON rpm_measurements(hospital_id, patient_id, metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_status ON rpm_alerts(hospital_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_edu_category ON patient_education_articles(hospital_id, category, status);

-- Enable PostgreSQL Row-Level Security (RLS)
ALTER TABLE tele_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_waiting_room_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tele_clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpm_care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpm_threshold_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpm_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rpm_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_education_articles ENABLE ROW LEVEL SECURITY;

-- Standard Multi-Tenant Isolation Policies
CREATE POLICY tele_services_tenant_isolation ON tele_services
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_doctor_profiles_tenant_isolation ON tele_doctor_profiles
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_appointments_tenant_isolation ON tele_appointments
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_waiting_room_tenant_isolation ON tele_waiting_room_entries
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_sessions_tenant_isolation ON tele_sessions
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_consents_tenant_isolation ON tele_consents
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_messages_tenant_isolation ON tele_messages
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY tele_clinical_encounters_tenant_isolation ON tele_clinical_encounters
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY rpm_care_plans_tenant_isolation ON rpm_care_plans
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY rpm_threshold_rules_tenant_isolation ON rpm_threshold_rules
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY rpm_measurements_tenant_isolation ON rpm_measurements
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY rpm_alerts_tenant_isolation ON rpm_alerts
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());

CREATE POLICY patient_education_tenant_isolation ON patient_education_articles
    FOR ALL USING (organization_id = CURRENT_ORGANIZATION_ID() AND hospital_id = CURRENT_HOSPITAL_ID());
