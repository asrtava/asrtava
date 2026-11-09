-- Migration: 028_operation_theatre_and_perioperative_care.sql
-- Description: Operation Theatre Suite, Multi-Resource Conflict Scheduling, WHO Surgical Safety Checklists, Anaesthesia Charting, Sponge/Instrument Counts & PACU Aldrete Recovery
-- Tenant Isolation: Row-Level Security (RLS) on hospital_id

CREATE TABLE IF NOT EXISTS ot_theatres (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    theatre_number VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    specialty VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
    is_laminar_airflow BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    branch_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_surgery_requests (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64) NOT NULL,
    requesting_surgeon_id VARCHAR(64) NOT NULL,
    proposed_procedure VARCHAR(256) NOT NULL,
    preop_diagnosis VARCHAR(256) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'ELECTIVE', -- ELECTIVE, URGENT, STAT_EMERGENCY
    estimated_duration_mins INTEGER NOT NULL DEFAULT 60,
    requested_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_schedules (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) REFERENCES ot_surgery_requests(id) ON DELETE SET NULL,
    theatre_id VARCHAR(64) NOT NULL REFERENCES ot_theatres(id) ON DELETE RESTRICT,
    patient_id VARCHAR(64) NOT NULL,
    primary_surgeon_id VARCHAR(64) NOT NULL,
    assistant_surgeon_id VARCHAR(64),
    anaesthetist_id VARCHAR(64) NOT NULL,
    scrub_nurse_id VARCHAR(64),
    circulating_nurse_id VARCHAR(64),
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_THEATRE, IN_SURGERY, RECOVERY, COMPLETED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_preop_assessments (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL,
    anaesthetist_id VARCHAR(64) NOT NULL,
    asa_class VARCHAR(16) NOT NULL, -- ASA_I, ASA_II, ASA_III, ASA_IV, ASA_V, ASA_VI, ASA_E
    mallampati_score VARCHAR(8) NOT NULL, -- I, II, III, IV
    fasting_hours_solid INTEGER NOT NULL,
    fasting_hours_clear_fluids INTEGER NOT NULL,
    airway_assessment VARCHAR(256),
    is_cleared_for_surgery BOOLEAN NOT NULL DEFAULT true,
    rejection_reason VARCHAR(256),
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_surgical_consents (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL,
    procedure_name VARCHAR(256) NOT NULL,
    risks_disclosed TEXT NOT NULL,
    patient_signed BOOLEAN NOT NULL DEFAULT true,
    guardian_signed BOOLEAN NOT NULL DEFAULT false,
    witness_name VARCHAR(128) NOT NULL,
    consent_signature_hash VARCHAR(128) NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_who_checklists (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    -- Sign-In Phase (Before Induction)
    sign_in_completed BOOLEAN NOT NULL DEFAULT false,
    sign_in_timestamp TIMESTAMP WITH TIME ZONE,
    sign_in_verified_by VARCHAR(64),
    patient_identity_confirmed BOOLEAN NOT NULL DEFAULT false,
    site_marked BOOLEAN NOT NULL DEFAULT false,
    pulse_oximeter_operating BOOLEAN NOT NULL DEFAULT false,
    known_allergy_checked BOOLEAN NOT NULL DEFAULT false,
    airway_aspiration_risk BOOLEAN NOT NULL DEFAULT false,
    anticipated_blood_loss_ml INTEGER NOT NULL DEFAULT 0,
    -- Time-Out Phase (Before Incision)
    time_out_completed BOOLEAN NOT NULL DEFAULT false,
    time_out_timestamp TIMESTAMP WITH TIME ZONE,
    time_out_verified_by VARCHAR(64),
    team_members_introduced BOOLEAN NOT NULL DEFAULT false,
    antibiotic_given_within_60m BOOLEAN NOT NULL DEFAULT false,
    critical_events_reviewed BOOLEAN NOT NULL DEFAULT false,
    imaging_displayed BOOLEAN NOT NULL DEFAULT false,
    -- Sign-Out Phase (Before Patient Leaves Room)
    sign_out_completed BOOLEAN NOT NULL DEFAULT false,
    sign_out_timestamp TIMESTAMP WITH TIME ZONE,
    sign_out_verified_by VARCHAR(64),
    procedure_name_recorded BOOLEAN NOT NULL DEFAULT false,
    counts_reconciled BOOLEAN NOT NULL DEFAULT false,
    specimen_labeled BOOLEAN NOT NULL DEFAULT false,
    equipment_problems_noted BOOLEAN NOT NULL DEFAULT false,
    recovery_concerns_discussed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_anaesthesia_records (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    anaesthetist_id VARCHAR(64) NOT NULL,
    anaesthesia_type VARCHAR(32) NOT NULL, -- GENERAL, SPINAL, EPIDURAL, REGIONAL, LOCAL, MAC
    airway_type VARCHAR(32) NOT NULL, -- ETT, LMA, MASK, TRACHEOSTOMY, NONE
    induction_timestamp TIMESTAMP WITH TIME ZONE,
    extubation_timestamp TIMESTAMP WITH TIME ZONE,
    complications_noted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_intraop_vitals (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    heart_rate INTEGER NOT NULL,
    systolic_bp INTEGER NOT NULL,
    diastolic_bp INTEGER NOT NULL,
    spo2_percent INTEGER NOT NULL,
    etco2_mmhg INTEGER,
    temperature_celsius NUMERIC(4, 1),
    administered_drugs JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS ot_surgical_counts (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    count_category VARCHAR(32) NOT NULL, -- SPONGES_GAUZE, SHARPS_NEEDLES, SURGICAL_INSTRUMENTS
    initial_count INTEGER NOT NULL,
    intraop_added_count INTEGER NOT NULL DEFAULT 0,
    closing_count INTEGER NOT NULL,
    is_count_correct BOOLEAN NOT NULL,
    discrepancy_action_taken VARCHAR(256),
    scrub_nurse_id VARCHAR(64) NOT NULL,
    circulating_nurse_id VARCHAR(64) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ot_pacu_records (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    schedule_id UUID NOT NULL REFERENCES ot_schedules(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL,
    admission_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    discharge_timestamp TIMESTAMP WITH TIME ZONE,
    assigned_nurse_id VARCHAR(64) NOT NULL,
    discharge_destination VARCHAR(32), -- SURGICAL_WARD, ICU, HDU, DAY_CARE_LOUNGE, HOME
    discharge_physician_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'IN_RECOVERY'
);

CREATE TABLE IF NOT EXISTS ot_aldrete_scores (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    pacu_record_id VARCHAR(64) NOT NULL REFERENCES ot_pacu_records(id) ON DELETE CASCADE,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    activity_score INTEGER NOT NULL CHECK (activity_score BETWEEN 0 AND 2),
    respiration_score INTEGER NOT NULL CHECK (respiration_score BETWEEN 0 AND 2),
    circulation_score INTEGER NOT NULL CHECK (circulation_score BETWEEN 0 AND 2),
    consciousness_score INTEGER NOT NULL CHECK (consciousness_score BETWEEN 0 AND 2),
    o2_saturation_score INTEGER NOT NULL CHECK (o2_saturation_score BETWEEN 0 AND 2),
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 10),
    evaluated_by_user_id VARCHAR(64) NOT NULL
);

-- Row Level Security (RLS) Policies
ALTER TABLE ot_theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_surgery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_preop_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_surgical_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_who_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_anaesthesia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_intraop_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_surgical_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_pacu_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_aldrete_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ot_theatres ON ot_theatres
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_surgery_requests ON ot_surgery_requests
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_schedules ON ot_schedules
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_preop_assessments ON ot_preop_assessments
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_surgical_consents ON ot_surgical_consents
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_who_checklists ON ot_who_checklists
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_anaesthesia_records ON ot_anaesthesia_records
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_intraop_vitals ON ot_intraop_vitals
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_surgical_counts ON ot_surgical_counts
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_pacu_records ON ot_pacu_records
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ot_aldrete_scores ON ot_aldrete_scores
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ot_schedules_theatre ON ot_schedules(hospital_id, operation_theatre_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_ot_schedules_surgeon ON ot_schedules(hospital_id, lead_surgeon_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_ot_schedules_anaesthetist ON ot_schedules(hospital_id, anesthetist_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_ot_pacu_records_status ON ot_pacu_records(hospital_id, status);

