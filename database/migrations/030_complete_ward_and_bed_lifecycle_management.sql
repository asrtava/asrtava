-- Migration: 030_complete_ward_and_bed_lifecycle_management.sql
-- Description: Complete Hospital Infrastructure Hierarchy, Bed Lifecycle, IPD Admission Requests, Transfers, Housekeeping Turnover & Discharge Planning
-- Tenant Isolation: Row-Level Security (RLS) on hospital_id

CREATE TABLE IF NOT EXISTS ward_buildings (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    building_code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    total_floors INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    branch_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_floors (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    building_id VARCHAR(64) NOT NULL REFERENCES ward_buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_name VARCHAR(64) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_departments (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    department_code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    specialty VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_units (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    floor_id VARCHAR(64) NOT NULL REFERENCES ward_floors(id) ON DELETE RESTRICT,
    department_id VARCHAR(64) NOT NULL REFERENCES ward_departments(id) ON DELETE RESTRICT,
    ward_code VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    ward_type VARCHAR(64) NOT NULL, -- GENERAL, PRIVATE, SEMI_PRIVATE, ICU, HDU, PEDIATRIC, MATERNITY, ISOLATION, SURGICAL, MEDICAL, DAY_CARE
    capacity INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_rooms (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    ward_id VARCHAR(64) NOT NULL REFERENCES ward_units(id) ON DELETE CASCADE,
    room_number VARCHAR(32) NOT NULL,
    room_type VARCHAR(64) NOT NULL DEFAULT 'STANDARD', -- SINGLE, DOUBLE, FOUR_BED, ISOLATION_NEGATIVE_PRESSURE, SUITE
    daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_ac BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_beds (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    room_id VARCHAR(64) NOT NULL REFERENCES ward_rooms(id) ON DELETE CASCADE,
    ward_id VARCHAR(64) NOT NULL REFERENCES ward_units(id) ON DELETE CASCADE,
    bed_number VARCHAR(32) NOT NULL,
    bed_category VARCHAR(64) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(32) NOT NULL DEFAULT 'available', -- available, reserved, occupied, cleaning_required, cleaning_in_progress, maintenance, blocked, out_of_service
    gender_restriction VARCHAR(16) NOT NULL DEFAULT 'ANY', -- ANY, MALE_ONLY, FEMALE_ONLY
    has_oxygen BOOLEAN NOT NULL DEFAULT true,
    has_ventilator BOOLEAN NOT NULL DEFAULT false,
    has_cardiac_monitor BOOLEAN NOT NULL DEFAULT false,
    is_isolation BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_bed_reservations (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    bed_id VARCHAR(64) NOT NULL REFERENCES ward_beds(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL,
    reserved_by_user_id VARCHAR(64) NOT NULL,
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' -- ACTIVE, EXPIRED, CANCELLED, CONVERTED_TO_ADMISSION
);

CREATE TABLE IF NOT EXISTS ward_admission_requests (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64) NOT NULL,
    requesting_doctor_id VARCHAR(64) NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'OPD', -- OPD, EMERGENCY, DIRECT, TRANSFER, EXTERNAL_REFERRAL
    priority VARCHAR(32) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, URGENT, STAT_EMERGENCY
    required_ward_type VARCHAR(64) NOT NULL,
    required_bed_type VARCHAR(64) NOT NULL DEFAULT 'STANDARD',
    diagnosis TEXT NOT NULL,
    isolation_required BOOLEAN NOT NULL DEFAULT false,
    special_equipment_notes VARCHAR(256),
    status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, WAITLISTED, CANCELLED, ADMITTED
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_ipd_admissions (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    admission_number VARCHAR(32) NOT NULL,
    patient_id VARCHAR(64) NOT NULL,
    request_id VARCHAR(64) REFERENCES ward_admission_requests(id) ON DELETE SET NULL,
    admitting_doctor_id VARCHAR(64) NOT NULL,
    assigned_bed_id VARCHAR(64) NOT NULL REFERENCES ward_beds(id) ON DELETE RESTRICT,
    assigned_ward_id VARCHAR(64) NOT NULL REFERENCES ward_units(id) ON DELETE RESTRICT,
    admission_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_discharge_date DATE,
    initial_diagnosis TEXT NOT NULL,
    admission_status VARCHAR(32) NOT NULL DEFAULT 'ADMITTED', -- ADMITTED, TRANSFERRED, DISCHARGED
    is_medico_legal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_patient_transfers (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    admission_id VARCHAR(64) NOT NULL REFERENCES ward_ipd_admissions(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL,
    from_bed_id VARCHAR(64) NOT NULL REFERENCES ward_beds(id) ON DELETE RESTRICT,
    to_bed_id VARCHAR(64) NOT NULL REFERENCES ward_beds(id) ON DELETE RESTRICT,
    from_ward_id VARCHAR(64) NOT NULL REFERENCES ward_units(id) ON DELETE RESTRICT,
    to_ward_id VARCHAR(64) NOT NULL REFERENCES ward_units(id) ON DELETE RESTRICT,
    transfer_reason TEXT NOT NULL,
    requested_by_doctor_id VARCHAR(64) NOT NULL,
    approved_by_user_id VARCHAR(64),
    sending_nurse_id VARCHAR(64),
    receiving_nurse_id VARCHAR(64),
    transfer_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    handover_notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED'
);

CREATE TABLE IF NOT EXISTS ward_housekeeping_tasks (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    bed_id VARCHAR(64) NOT NULL REFERENCES ward_beds(id) ON DELETE CASCADE,
    room_id VARCHAR(64) NOT NULL REFERENCES ward_rooms(id) ON DELETE CASCADE,
    task_type VARCHAR(32) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, TERMINAL, ISOLATION, DEEP_CLEANING, MAINTENANCE_RELATED
    assigned_staff_id VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, REJECTED
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cleaning_notes TEXT
);

CREATE TABLE IF NOT EXISTS ward_cleaning_inspections (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    task_id VARCHAR(64) NOT NULL REFERENCES ward_housekeeping_tasks(id) ON DELETE CASCADE,
    bed_id VARCHAR(64) NOT NULL REFERENCES ward_beds(id) ON DELETE CASCADE,
    inspected_by_supervisor_id VARCHAR(64) NOT NULL,
    inspection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    rejection_reason VARCHAR(256),
    bed_released_to_available BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ward_discharge_plans (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    admission_id VARCHAR(64) NOT NULL REFERENCES ward_ipd_admissions(id) ON DELETE CASCADE,
    estimated_discharge_date DATE NOT NULL,
    barriers_identified TEXT,
    pending_consultations VARCHAR(256),
    meds_reconciled BOOLEAN NOT NULL DEFAULT false,
    transport_arranged BOOLEAN NOT NULL DEFAULT false,
    home_care_required BOOLEAN NOT NULL DEFAULT false,
    readiness_status VARCHAR(32) NOT NULL DEFAULT 'IN_PLANNING', -- IN_PLANNING, MEDICALLY_STABLE, PENDING_CLEARANCE, CLEARED_FOR_DISCHARGE
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ward_visitor_passes (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    admission_id VARCHAR(64) NOT NULL REFERENCES ward_ipd_admissions(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL,
    visitor_name VARCHAR(128) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    id_proof_number VARCHAR(64),
    pass_number VARCHAR(32) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    issued_by_user_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) Policies
ALTER TABLE ward_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_bed_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_admission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_patient_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_cleaning_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_discharge_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_visitor_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ward_buildings ON ward_buildings
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_floors ON ward_floors
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_departments ON ward_departments
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_units ON ward_units
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_rooms ON ward_rooms
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_beds ON ward_beds
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_bed_reservations ON ward_bed_reservations
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_admission_requests ON ward_admission_requests
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_ipd_admissions ON ward_ipd_admissions
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_patient_transfers ON ward_patient_transfers
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_housekeeping_tasks ON ward_housekeeping_tasks
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_cleaning_inspections ON ward_cleaning_inspections
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_discharge_plans ON ward_discharge_plans
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

CREATE POLICY tenant_isolation_ward_visitor_passes ON ward_visitor_passes
    USING (hospital_id::text = CURRENT_SETTING('app.current_hospital_id', true));

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ward_beds_status ON ward_beds(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_ward_beds_ward ON ward_beds(hospital_id, ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_admissions_patient ON ward_ipd_admissions(hospital_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_ward_housekeeping_status ON ward_housekeeping_tasks(hospital_id, status);
CREATE INDEX IF NOT EXISTS idx_ward_reservations_bed ON ward_bed_reservations(hospital_id, bed_id, status);

