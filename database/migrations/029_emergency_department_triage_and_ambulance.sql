-- Migration: 029_emergency_department_triage_and_ambulance.sql
-- Description: Emergency Department, ESI 5-Level Triage, Trauma Resuscitation, Ambulance Dispatch, Mobile PCR & Critical Care Workflows
-- Tenant Isolation: Row-Level Security (RLS) on hospital_id

CREATE TABLE IF NOT EXISTS ed_encounters (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_number VARCHAR(32) NOT NULL,
    patient_id VARCHAR(64) NOT NULL,
    is_unknown_identity BOOLEAN NOT NULL DEFAULT false,
    temporary_uhid VARCHAR(32),
    arrival_mode VARCHAR(32) NOT NULL DEFAULT 'WALK_IN', -- WALK_IN, AMBULANCE, POLICE_BRING_IN, HELICOPTER
    arrival_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    presenting_complaint TEXT NOT NULL,
    is_medico_legal BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(32) NOT NULL DEFAULT 'TRIAGING', -- TRIAGING, IN_ZONE, OBSERVING, ADMITTED, DISCHARGED
    branch_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ed_triage_records (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_id VARCHAR(64) NOT NULL REFERENCES ed_encounters(id) ON DELETE CASCADE,
    triaged_by_user_id VARCHAR(64) NOT NULL,
    triaged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    esi_level INTEGER NOT NULL CHECK (esi_level BETWEEN 1 AND 5), -- 1: Resuscitation, 2: Emergent, 3: Urgent, 4: Less Urgent, 5: Non-urgent
    assigned_zone VARCHAR(32) NOT NULL, -- RED_RESUS, YELLOW_ACUTE, GREEN_FAST_TRACK
    heart_rate INTEGER NOT NULL,
    systolic_bp INTEGER NOT NULL,
    diastolic_bp INTEGER NOT NULL,
    respiratory_rate INTEGER NOT NULL,
    spo2_percent INTEGER NOT NULL,
    gcs_score INTEGER NOT NULL CHECK (gcs_score BETWEEN 3 AND 15),
    temperature_celsius NUMERIC(4, 1),
    pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
    triage_notes TEXT
);

CREATE TABLE IF NOT EXISTS ed_trauma_activations (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_id VARCHAR(64) NOT NULL REFERENCES ed_encounters(id) ON DELETE CASCADE,
    activation_type VARCHAR(64) NOT NULL, -- TRAUMA_TEAM_CODE_RED, CODE_BLUE_CARDIAC_ARREST, STROKE_CODE, STEMI_CODE
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    team_leader_id VARCHAR(64) NOT NULL,
    response_time_seconds INTEGER,
    outcome VARCHAR(64) DEFAULT 'IN_PROGRESS'
);

CREATE TABLE IF NOT EXISTS ed_resuscitation_checklists (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_id VARCHAR(64) NOT NULL REFERENCES ed_encounters(id) ON DELETE CASCADE,
    airway_status VARCHAR(32) NOT NULL, -- PATENT, THREATENED, INTUBATED_ETT
    c_spine_immobilized BOOLEAN NOT NULL DEFAULT true,
    breathing_status VARCHAR(32) NOT NULL, -- NORMAL, TACHYPNEIC, TENSION_PNEUMOTHORAX, ASSISTED_VENTILATION
    bilateral_breath_sounds BOOLEAN NOT NULL DEFAULT true,
    circulation_pulse VARCHAR(32) NOT NULL, -- PALPABLE, WEAK_THREADY, CARDIAC_ARREST
    iv_access_gauge VARCHAR(32) NOT NULL, -- TWO_LARGE_BORE_16G, CENTRAL_LINE, IO_NEEDLE
    disability_gcs INTEGER NOT NULL,
    pupils_reactive BOOLEAN NOT NULL DEFAULT true,
    exposure_hypothermia_prevention BOOLEAN NOT NULL DEFAULT true,
    fast_scan_positive BOOLEAN NOT NULL DEFAULT false,
    massive_transfusion_activated BOOLEAN NOT NULL DEFAULT false,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ed_stat_orders (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_id VARCHAR(64) NOT NULL REFERENCES ed_encounters(id) ON DELETE CASCADE,
    order_type VARCHAR(32) NOT NULL, -- IMAGING_STAT, LAB_STAT, BLOOD_CROSSMATCH_STAT, PHARMACY_STAT
    order_details TEXT NOT NULL,
    is_stat_override BOOLEAN NOT NULL DEFAULT true,
    clinical_override_reason VARCHAR(256) NOT NULL DEFAULT 'Emergency Life-Threatening Crisis - Cashier Clearance Bypassed',
    ordered_by_user_id VARCHAR(64) NOT NULL,
    ordered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(32) NOT NULL DEFAULT 'DISPATCHED'
);

CREATE TABLE IF NOT EXISTS ed_medico_legal_cases (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_id VARCHAR(64) NOT NULL REFERENCES ed_encounters(id) ON DELETE CASCADE,
    mlc_number VARCHAR(32) NOT NULL,
    incident_type VARCHAR(64) NOT NULL, -- RTA_ROAD_TRAFFIC_ACCIDENT, ASSAULT, POISONING, BURNS, WORKPLACE_INJURY, FIREARM
    injury_description TEXT NOT NULL,
    police_station_name VARCHAR(128) NOT NULL,
    police_intimation_number VARCHAR(64),
    police_constable_name VARCHAR(128),
    intimation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ambulance_fleet (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    vehicle_number VARCHAR(32) NOT NULL,
    ambulance_type VARCHAR(32) NOT NULL, -- ALS_ADVANCED_LIFE_SUPPORT, BLS_BASIC_LIFE_SUPPORT, ICU_MOBILE, NEONATAL
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, DISPATCHED, ON_SCENE, EN_ROUTE_HOSPITAL, MAINTENANCE
    driver_name VARCHAR(128),
    paramedic_name VARCHAR(128),
    gps_latitude NUMERIC(10, 6),
    gps_longitude NUMERIC(10, 6),
    last_telemetry_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ambulance_trips (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    ambulance_id VARCHAR(64) NOT NULL REFERENCES ambulance_fleet(id) ON DELETE RESTRICT,
    trip_number VARCHAR(32) NOT NULL,
    call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dispatch_timestamp TIMESTAMP WITH TIME ZONE,
    on_scene_timestamp TIMESTAMP WITH TIME ZONE,
    arrival_at_hospital_timestamp TIMESTAMP WITH TIME ZONE,
    caller_name VARCHAR(128) NOT NULL,
    caller_phone VARCHAR(32) NOT NULL,
    pickup_location TEXT NOT NULL,
    patient_name VARCHAR(128),
    encounter_id VARCHAR(64) REFERENCES ed_encounters(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DISPATCHED'
);

CREATE TABLE IF NOT EXISTS ambulance_pcr_records (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    trip_id VARCHAR(64) NOT NULL REFERENCES ambulance_trips(id) ON DELETE CASCADE,
    paramedic_user_id VARCHAR(64) NOT NULL,
    chief_complaint TEXT NOT NULL,
    initial_vitals JSONB NOT NULL,
    administered_prehospital_drugs JSONB DEFAULT '[]'::jsonb,
    transmission_to_ed_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ed_observation_beds (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    bed_number VARCHAR(32) NOT NULL,
    zone VARCHAR(32) NOT NULL, -- RED, YELLOW, GREEN
    encounter_id VARCHAR(64) REFERENCES ed_encounters(id) ON DELETE SET NULL,
    occupied_since TIMESTAMP WITH TIME ZONE,
    max_holding_hours INTEGER NOT NULL DEFAULT 6,
    is_occupied BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS ed_dispositions (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    encounter_id VARCHAR(64) NOT NULL REFERENCES ed_encounters(id) ON DELETE CASCADE,
    disposition_type VARCHAR(32) NOT NULL, -- ICU_ADMISSION, EMERGENCY_OT, INPATIENT_WARD, DISCHARGED, LAMA_AGAINST_MEDICAL_ADVICE, MORTUARY
    disposition_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    authorized_by_doctor_id VARCHAR(64) NOT NULL,
    destination_unit VARCHAR(64),
    discharge_summary TEXT
);

-- Row Level Security (RLS) Policies
ALTER TABLE ed_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_triage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_trauma_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_resuscitation_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_stat_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_medico_legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_pcr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_observation_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_dispositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ed_encounters ON ed_encounters
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_triage_records ON ed_triage_records
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_trauma_activations ON ed_trauma_activations
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_resuscitation_checklists ON ed_resuscitation_checklists
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_stat_orders ON ed_stat_orders
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_medico_legal_cases ON ed_medico_legal_cases
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ambulance_fleet ON ambulance_fleet
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ambulance_trips ON ambulance_trips
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ambulance_pcr_records ON ambulance_pcr_records
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_observation_beds ON ed_observation_beds
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ed_dispositions ON ed_dispositions
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

-- Composite Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ed_encounters_status ON ed_encounters(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_ed_triage_esi ON ed_triage_records(hospital_id, esi_level, assigned_zone);
CREATE INDEX IF NOT EXISTS idx_ambulance_fleet_status ON ambulance_fleet(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_ed_stat_orders_encounter ON ed_stat_orders(hospital_id, encounter_id);

