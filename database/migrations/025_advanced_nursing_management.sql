-- ============================================================================
-- ASRTAVA Hospital Management System
-- Migration: 025_advanced_nursing_management.sql
-- Description: Complete enterprise schema for Advanced Nursing Management,
--              Patient Monitoring, Bedside Care, eMAR, Vitals (NEWS2),
--              Wound Care, Fluid Balance, SBAR Handovers & Safety Incidents.
-- ============================================================================

-- 1. Nursing Shifts Roster
CREATE TABLE IF NOT EXISTS nursing_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    shift_code VARCHAR(20) NOT NULL, -- 'MORNING', 'EVENING', 'NIGHT', 'GENERAL'
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    handover_grace_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patient Nursing Assignments & Acuity
CREATE TABLE IF NOT EXISTS nursing_patient_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    nurse_user_id UUID NOT NULL REFERENCES users(id),
    shift_id UUID REFERENCES nursing_shifts(id),
    assigned_by_user_id UUID REFERENCES users(id),
    assignment_role VARCHAR(20) DEFAULT 'PRIMARY' CHECK (assignment_role IN ('PRIMARY', 'SECONDARY', 'BUDDY', 'SUPERVISOR')),
    acuity_level VARCHAR(20) DEFAULT 'MODERATE' CHECK (acuity_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    reassignment_reason VARCHAR(255)
);

-- 3. Nursing Assessment Templates
CREATE TABLE IF NOT EXISTS nursing_assessment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    template_code VARCHAR(50) NOT NULL, -- 'BRADEN_SCALE', 'MORSE_FALL', 'GCS_NEURO', 'MUST_NUTRITION', 'PAIN_NRS'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    scoring_rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Patient Clinical Assessments & Scoring
CREATE TABLE IF NOT EXISTS nursing_patient_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    template_code VARCHAR(50) NOT NULL,
    assessed_by_nurse_id UUID NOT NULL REFERENCES users(id),
    assessment_data JSONB NOT NULL,
    calculated_score NUMERIC(5,2) NOT NULL,
    risk_tier VARCHAR(20) NOT NULL CHECK (risk_tier IN ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'CRITICAL')),
    clinical_findings TEXT,
    recommended_interventions JSONB,
    assessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Expanded Vital Sign Observations & NEWS2 Scoring
CREATE TABLE IF NOT EXISTS patient_vital_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_by_nurse_id UUID NOT NULL REFERENCES users(id),
    systolic_bp INT NOT NULL,
    diastolic_bp INT NOT NULL,
    heart_rate INT NOT NULL,
    respiratory_rate INT NOT NULL,
    temperature_celsius NUMERIC(4,1) NOT NULL,
    spo2_percent INT NOT NULL,
    is_supplemental_o2 BOOLEAN DEFAULT false,
    o2_flow_liters_min NUMERIC(4,1) DEFAULT 0,
    pain_score INT DEFAULT 0 CHECK (pain_score BETWEEN 0 AND 10),
    blood_glucose_mg_dl NUMERIC(5,1),
    consciousness_level VARCHAR(20) DEFAULT 'ALERT' CHECK (consciousness_level IN ('ALERT', 'VOICE', 'PAIN', 'UNRESPONSIVE')),
    news2_score INT NOT NULL DEFAULT 0,
    news2_risk_category VARCHAR(20) DEFAULT 'LOW' CHECK (news2_risk_category IN ('LOW', 'MEDIUM', 'HIGH')),
    monitoring_frequency_minutes INT DEFAULT 240,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Nursing Clinical Observation Alerts
CREATE TABLE IF NOT EXISTS nursing_observation_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    observation_id UUID NOT NULL REFERENCES patient_vital_observations(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    alert_severity VARCHAR(20) NOT NULL CHECK (alert_severity IN ('WARNING', 'URGENT', 'EMERGENCY_MET')),
    trigger_reason VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'DELIVERED' CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'FAILED')),
    acknowledged_by_user_id UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    action_taken_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Doctor Orders Nursing Acknowledgement & Execution
CREATE TABLE IF NOT EXISTS nursing_doctor_orders_acknowledgement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    order_category VARCHAR(30) NOT NULL CHECK (order_category IN ('MEDICATION', 'LABORATORY', 'RADIOLOGY', 'NURSING_PROCEDURE', 'DIET', 'ACTIVITY', 'FLUID_MANAGEMENT')),
    order_reference_id UUID,
    order_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'STAT')),
    ordered_by_doctor_id UUID NOT NULL REFERENCES users(id),
    acknowledged_by_nurse_id UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    execution_status VARCHAR(20) DEFAULT 'PENDING' CHECK (execution_status IN ('PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'HELD_ISSUE', 'DISCONTINUED')),
    completed_at TIMESTAMPTZ,
    execution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Advanced Nursing Care Plans
CREATE TABLE IF NOT EXISTS nursing_care_plans_advanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    nursing_diagnosis VARCHAR(255) NOT NULL,
    related_to VARCHAR(255),
    as_evidenced_by VARCHAR(255),
    measurable_goals TEXT NOT NULL,
    planned_interventions JSONB NOT NULL,
    frequency_hours INT DEFAULT 4,
    created_by_nurse_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNDER_REVIEW', 'ACHIEVED', 'DISCONTINUED')),
    evaluation_notes TEXT,
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Comprehensive Fluid Intake, Output & Balance
CREATE TABLE IF NOT EXISTS nursing_fluid_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_by_nurse_id UUID NOT NULL REFERENCES users(id),
    entry_time TIMESTAMPTZ NOT NULL,
    oral_intake_ml NUMERIC(7,2) DEFAULT 0,
    iv_fluid_intake_ml NUMERIC(7,2) DEFAULT 0,
    enteral_intake_ml NUMERIC(7,2) DEFAULT 0,
    blood_products_intake_ml NUMERIC(7,2) DEFAULT 0,
    urine_output_ml NUMERIC(7,2) DEFAULT 0,
    surgical_drain_output_ml NUMERIC(7,2) DEFAULT 0,
    vomitus_output_ml NUMERIC(7,2) DEFAULT 0,
    blood_loss_output_ml NUMERIC(7,2) DEFAULT 0,
    total_intake_ml NUMERIC(7,2) GENERATED ALWAYS AS (oral_intake_ml + iv_fluid_intake_ml + enteral_intake_ml + blood_products_intake_ml) STORED,
    total_output_ml NUMERIC(7,2) GENERATED ALWAYS AS (urine_output_ml + surgical_drain_output_ml + vomitus_output_ml + blood_loss_output_ml) STORED,
    net_balance_ml NUMERIC(7,2) GENERATED ALWAYS AS ((oral_intake_ml + iv_fluid_intake_ml + enteral_intake_ml + blood_products_intake_ml) - (urine_output_ml + surgical_drain_output_ml + vomitus_output_ml + blood_loss_output_ml)) STORED,
    notes VARCHAR(255)
);

-- 10. Wound Care, Staging & Dressing Management
CREATE TABLE IF NOT EXISTS nursing_wound_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessed_by_nurse_id UUID NOT NULL REFERENCES users(id),
    wound_identifier VARCHAR(50) NOT NULL, -- e.g. 'WOUND-01-SACRUM'
    anatomical_location VARCHAR(100) NOT NULL,
    wound_staging VARCHAR(30) NOT NULL CHECK (wound_staging IN ('STAGE_I', 'STAGE_II', 'STAGE_III', 'STAGE_IV', 'UNSTAGEABLE', 'DEEP_TISSUE_INJURY', 'SURGICAL_INCISION', 'LACERATION')),
    length_cm NUMERIC(4,1) NOT NULL,
    width_cm NUMERIC(4,1) NOT NULL,
    depth_cm NUMERIC(4,1) NOT NULL,
    exudate_amount VARCHAR(20) DEFAULT 'MODERATE' CHECK (exudate_amount IN ('NONE', 'SCANT', 'SMALL', 'MODERATE', 'HEAVY')),
    exudate_type VARCHAR(20) DEFAULT 'SEROUS' CHECK (exudate_type IN ('SEROUS', 'SANGUINEOUS', 'SEROSANGUINEOUS', 'PURULENT')),
    granulation_percent INT DEFAULT 0,
    slough_percent INT DEFAULT 0,
    eschar_percent INT DEFAULT 0,
    dressing_type_applied VARCHAR(100) NOT NULL,
    next_change_due TIMESTAMPTZ NOT NULL,
    healing_status VARCHAR(20) DEFAULT 'IMPROVING' CHECK (healing_status IN ('IMPROVING', 'STATIC', 'DETERIORATING')),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bedside Tasks & Procedure Scheduler
CREATE TABLE IF NOT EXISTS nursing_bedside_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    task_category VARCHAR(50) NOT NULL CHECK (task_category IN ('CATHETER_CARE', 'IV_LINE_MAINTENANCE', 'DRESSING_CHANGE', 'SPECIMEN_COLLECTION', 'POSITION_TURNING', 'BLOOD_GLUCOSE_CHECK', 'HYGIENE', 'AMBULATION')),
    task_description VARCHAR(255) NOT NULL,
    priority VARCHAR(20) DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'STAT')),
    due_time TIMESTAMPTZ NOT NULL,
    assigned_nurse_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OMITTED')),
    completed_by_nurse_id UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. SBAR Shift Handover Protocol
CREATE TABLE IF NOT EXISTS nursing_sbar_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES nursing_shifts(id),
    outgoing_nurse_id UUID NOT NULL REFERENCES users(id),
    incoming_nurse_id UUID NOT NULL REFERENCES users(id),
    census_occupied_beds INT NOT NULL,
    census_vacant_beds INT NOT NULL,
    situation_summary TEXT NOT NULL,
    background_summary TEXT NOT NULL,
    assessment_summary TEXT NOT NULL,
    recommendations_summary TEXT NOT NULL,
    critical_patients JSONB,
    pending_tasks JSONB,
    outgoing_signed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    incoming_acknowledged_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ACKNOWLEDGED_SIGNED'))
);

-- 13. ICU & High-Dependency Flowsheet Telemetry
CREATE TABLE IF NOT EXISTS nursing_icu_flowsheet (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    recorded_by_nurse_id UUID NOT NULL REFERENCES users(id),
    ventilator_mode VARCHAR(50),
    fio2_percent INT,
    peep_cmh2o NUMERIC(4,1),
    tidal_volume_ml INT,
    arterial_line_bp VARCHAR(20),
    cvp_mmhg NUMERIC(4,1),
    inotrope_infusions JSONB,
    sedation_infusions JSONB,
    pupil_right_size_mm NUMERIC(3,1),
    pupil_right_reaction VARCHAR(20),
    pupil_left_size_mm NUMERIC(3,1),
    pupil_left_reaction VARCHAR(20),
    gcs_eye INT,
    gcs_verbal INT,
    gcs_motor INT,
    total_gcs INT GENERATED ALWAYS AS (COALESCE(gcs_eye,0) + COALESCE(gcs_verbal,0) + COALESCE(gcs_motor,0)) STORED,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. Patient Safety & Incident Reporting Ledger
CREATE TABLE IF NOT EXISTS patient_safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    incident_number VARCHAR(50) NOT NULL UNIQUE,
    incident_category VARCHAR(50) NOT NULL CHECK (incident_category IN ('PATIENT_FALL', 'MEDICATION_INCIDENT', 'NEAR_MISS', 'ID_ERROR', 'PRESSURE_INJURY_ACQUIRED', 'EQUIPMENT_MALFUNCTION', 'IV_EXTRAVASATION', 'CLINICAL_DETERIORATION')),
    severity_index VARCHAR(20) NOT NULL CHECK (severity_index IN ('CAT_A_NO_HARM', 'CAT_B_NEAR_MISS', 'CAT_C_MONITORING_REQUIRED', 'CAT_D_TEMPORARY_HARM', 'CAT_E_PERMANENT_HARM', 'CAT_F_SENTINEL_EVENT')),
    patient_id UUID REFERENCES patients(id),
    admission_id UUID REFERENCES admissions(id),
    ward_id UUID REFERENCES wards(id),
    incident_time TIMESTAMPTZ NOT NULL,
    reported_by_user_id UUID NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    immediate_actions_taken TEXT NOT NULL,
    physician_notified_id UUID REFERENCES users(id),
    investigation_status VARCHAR(20) DEFAULT 'LOGGED' CHECK (investigation_status IN ('LOGGED', 'UNDER_INVESTIGATION', 'RCA_COMPLETED', 'CLOSED_CORRECTIVE_ACTION')),
    rca_findings TEXT,
    corrective_preventive_action TEXT,
    closed_by_user_id UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    is_immutable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Patient Discharge Education & Instructions
CREATE TABLE IF NOT EXISTS patient_discharge_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    educated_by_nurse_id UUID NOT NULL REFERENCES users(id),
    topics_covered JSONB NOT NULL,
    patient_understanding_verified BOOLEAN DEFAULT true,
    caregiver_name VARCHAR(100),
    caregiver_relationship VARCHAR(50),
    follow_up_instructions TEXT NOT NULL,
    emergency_contact_given VARCHAR(50) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE nursing_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_patient_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_vital_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_observation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_doctor_orders_acknowledgement ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_care_plans_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_fluid_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_wound_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_bedside_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_sbar_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nursing_icu_flowsheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_discharge_education ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HIGH-PERFORMANCE COMPOSITE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_nursing_shifts_hosp ON nursing_shifts(hospital_id, is_active);
CREATE INDEX IF NOT EXISTS idx_nurse_assign_hosp_ward ON nursing_patient_assignments(hospital_id, ward_id, is_active);
CREATE INDEX IF NOT EXISTS idx_nurse_assign_nurse ON nursing_patient_assignments(hospital_id, nurse_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_nurse_assign_patient ON nursing_patient_assignments(hospital_id, patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_assessments_adm ON nursing_patient_assessments(hospital_id, admission_id, template_code);
CREATE INDEX IF NOT EXISTS idx_vitals_adm_time ON patient_vital_observations(hospital_id, admission_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_vitals_news2 ON patient_vital_observations(hospital_id, news2_score, recorded_at);
CREATE INDEX IF NOT EXISTS idx_obs_alerts_adm ON nursing_observation_alerts(hospital_id, admission_id, alert_severity);
CREATE INDEX IF NOT EXISTS idx_dr_orders_ack_adm ON nursing_doctor_orders_acknowledgement(hospital_id, admission_id, execution_status);
CREATE INDEX IF NOT EXISTS idx_care_plans_adm ON nursing_care_plans_advanced(hospital_id, admission_id, status);
CREATE INDEX IF NOT EXISTS idx_fluid_adm_time ON nursing_fluid_balance(hospital_id, admission_id, entry_time);
CREATE INDEX IF NOT EXISTS idx_wounds_adm ON nursing_wound_assessments(hospital_id, admission_id, wound_identifier);
CREATE INDEX IF NOT EXISTS idx_tasks_adm_status ON nursing_bedside_tasks(hospital_id, admission_id, status, due_time);
CREATE INDEX IF NOT EXISTS idx_sbar_ward_time ON nursing_sbar_handovers(hospital_id, ward_id, outgoing_signed_at);
CREATE INDEX IF NOT EXISTS idx_icu_adm_time ON nursing_icu_flowsheet(hospital_id, admission_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_safety_inc_hosp ON patient_safety_incidents(hospital_id, incident_category, severity_index);
CREATE INDEX IF NOT EXISTS idx_discharge_edu_adm ON patient_discharge_education(hospital_id, admission_id);

