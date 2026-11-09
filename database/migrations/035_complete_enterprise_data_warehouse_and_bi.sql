-- ASRTAVA Enterprise Data Warehouse (EDW), Business Intelligence & Predictive Analytics
-- Migration: 035_complete_enterprise_data_warehouse_and_bi.sql

-- Enable UUID and cryptographic extensions if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Date Dimension Table
CREATE TABLE IF NOT EXISTS edw_dim_date (
    date_key INT PRIMARY KEY, -- YYYYMMDD
    calendar_date DATE NOT NULL UNIQUE,
    calendar_year INT NOT NULL,
    calendar_quarter INT NOT NULL,
    calendar_month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week_of_year INT NOT NULL,
    day_of_month INT NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. De-Identified Patient Dimension Table
CREATE TABLE IF NOT EXISTS edw_dim_patient (
    patient_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    pseudonym_hash VARCHAR(128) NOT NULL,
    gender VARCHAR(16) NOT NULL,
    age_group VARCHAR(32) NOT NULL, -- '0-12', '13-18', '19-35', '36-50', '51-65', '65+'
    city VARCHAR(64),
    state VARCHAR(64),
    pincode VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edw_patient_pseudo UNIQUE (tenant_id, pseudonym_hash)
);

-- 3. Doctor Dimension Table
CREATE TABLE IF NOT EXISTS edw_dim_doctor (
    doctor_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64) NOT NULL,
    doctor_name VARCHAR(128) NOT NULL,
    department_code VARCHAR(32) NOT NULL,
    specialty VARCHAR(64) NOT NULL,
    designation VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edw_doctor UNIQUE (tenant_id, doctor_id)
);

-- 4. Department Dimension Table
CREATE TABLE IF NOT EXISTS edw_dim_department (
    department_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    department_code VARCHAR(32) NOT NULL,
    department_name VARCHAR(128) NOT NULL,
    department_type VARCHAR(32) NOT NULL, -- 'CLINICAL', 'DIAGNOSTIC', 'SURGICAL', 'ADMINISTRATIVE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edw_department UNIQUE (tenant_id, department_code)
);

-- 5. Fact: OPD Clinical Encounters
CREATE TABLE IF NOT EXISTS edw_fact_opd_encounters (
    encounter_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    date_key INT NOT NULL REFERENCES edw_dim_date(date_key),
    patient_key UUID NOT NULL REFERENCES edw_dim_patient(patient_key),
    doctor_key UUID NOT NULL REFERENCES edw_dim_doctor(doctor_key),
    department_key UUID NOT NULL REFERENCES edw_dim_department(department_key),
    wait_time_minutes INT NOT NULL DEFAULT 0,
    consult_duration_minutes INT NOT NULL DEFAULT 0,
    fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_no_show BOOLEAN NOT NULL DEFAULT FALSE,
    is_teleconsultation BOOLEAN NOT NULL DEFAULT FALSE,
    icd10_primary VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Fact: IPD Inpatient Admissions
CREATE TABLE IF NOT EXISTS edw_fact_ipd_admissions (
    admission_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    admission_date_key INT NOT NULL REFERENCES edw_dim_date(date_key),
    discharge_date_key INT REFERENCES edw_dim_date(date_key),
    patient_key UUID NOT NULL REFERENCES edw_dim_patient(patient_key),
    department_key UUID NOT NULL REFERENCES edw_dim_department(department_key),
    ward_type VARCHAR(32) NOT NULL, -- 'GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'ICU', 'HDU'
    length_of_stay_days NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    total_charges NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_emergency_admission BOOLEAN NOT NULL DEFAULT FALSE,
    lace_risk_score INT NOT NULL DEFAULT 0,
    readmitted_within_30d BOOLEAN NOT NULL DEFAULT FALSE,
    mortality_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Fact: Financial & Revenue Cycle Daily Aggregates
CREATE TABLE IF NOT EXISTS edw_fact_financial_daily (
    financial_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    date_key INT NOT NULL REFERENCES edw_dim_date(date_key),
    gross_billed NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discounts_allowed NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_billed NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cash_collected NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tpa_collected NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    ar_outstanding NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    clean_claims_submitted INT NOT NULL DEFAULT 0,
    total_claims_submitted INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edw_fin_daily UNIQUE (tenant_id, date_key)
);

-- 8. Fact: Surgical OT Operations
CREATE TABLE IF NOT EXISTS edw_fact_surgical_operations (
    operation_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    date_key INT NOT NULL REFERENCES edw_dim_date(date_key),
    patient_key UUID NOT NULL REFERENCES edw_dim_patient(patient_key),
    surgeon_key UUID NOT NULL REFERENCES edw_dim_doctor(doctor_key),
    theatre_id VARCHAR(64) NOT NULL,
    procedure_name VARCHAR(128) NOT NULL,
    scheduled_duration_min INT NOT NULL,
    actual_duration_min INT NOT NULL,
    turnaround_time_min INT NOT NULL DEFAULT 0,
    is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
    delay_reason VARCHAR(128),
    has_complication BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Fact: Emergency Department Inflow & Triage
CREATE TABLE IF NOT EXISTS edw_fact_ed_inflow (
    ed_visit_key UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    date_key INT NOT NULL REFERENCES edw_dim_date(date_key),
    patient_key UUID NOT NULL REFERENCES edw_dim_patient(patient_key),
    triage_level INT NOT NULL, -- 1=Resuscitation, 2=Emergent, 3=Urgent, 4=Less Urgent, 5=Non-Urgent
    door_to_triage_min INT NOT NULL DEFAULT 0,
    door_to_doctor_min INT NOT NULL DEFAULT 0,
    total_ed_los_min INT NOT NULL DEFAULT 0,
    disposition VARCHAR(32) NOT NULL, -- 'ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'LAMA', 'DECEASED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Predictive Analytics Real-Time Alerts
CREATE TABLE IF NOT EXISTS edw_predictive_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    alert_type VARCHAR(64) NOT NULL, -- 'BED_SURGE_PREDICTION', 'NO_SHOW_RISK', 'LACE_READMISSION_RISK', 'STOCKOUT_PREDICTION'
    target_entity_id VARCHAR(64) NOT NULL,
    target_entity_type VARCHAR(32) NOT NULL, -- 'PATIENT', 'APPOINTMENT', 'WARD', 'INVENTORY_ITEM'
    risk_score NUMERIC(5, 2) NOT NULL,
    severity VARCHAR(16) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    prediction_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by VARCHAR(64),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Daily / Monthly Historical KPI Snapshots
CREATE TABLE IF NOT EXISTS edw_kpi_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    snapshot_date DATE NOT NULL,
    alos NUMERIC(5, 2) NOT NULL,
    bor_percent NUMERIC(5, 2) NOT NULL,
    bed_turnover_rate NUMERIC(5, 2) NOT NULL,
    mortality_rate_percent NUMERIC(5, 2) NOT NULL,
    ar_days NUMERIC(5, 2) NOT NULL,
    clean_claim_rate_percent NUMERIC(5, 2) NOT NULL,
    ebitda_margin_percent NUMERIC(5, 2) NOT NULL,
    readmission_rate_30d_percent NUMERIC(5, 2) NOT NULL,
    opd_volume INT NOT NULL DEFAULT 0,
    ipd_census INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_edw_kpi_snap UNIQUE (tenant_id, snapshot_date)
);

-- 12. Scheduled Business Intelligence Reports
CREATE TABLE IF NOT EXISTS edw_scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL,
    report_title VARCHAR(128) NOT NULL,
    frequency VARCHAR(16) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY'
    recipients TEXT[] NOT NULL,
    report_format VARCHAR(16) NOT NULL DEFAULT 'PDF', -- 'PDF', 'CSV', 'EXCEL'
    filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security (RLS) Configuration
ALTER TABLE edw_dim_patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_dim_doctor ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_dim_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_fact_opd_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_fact_ipd_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_fact_financial_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_fact_surgical_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_fact_ed_inflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE edw_scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Tenants isolate their respective EDW analytical data
CREATE POLICY edw_patient_tenant_isolation ON edw_dim_patient USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_doctor_tenant_isolation ON edw_dim_doctor USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_department_tenant_isolation ON edw_dim_department USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_opd_tenant_isolation ON edw_fact_opd_encounters USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_ipd_tenant_isolation ON edw_fact_ipd_admissions USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_financial_tenant_isolation ON edw_fact_financial_daily USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_surgical_tenant_isolation ON edw_fact_surgical_operations USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_ed_tenant_isolation ON edw_fact_ed_inflow USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_alerts_tenant_isolation ON edw_predictive_alerts USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_kpi_tenant_isolation ON edw_kpi_snapshots USING (tenant_id = current_setting('app.current_tenant', true));
CREATE POLICY edw_reports_tenant_isolation ON edw_scheduled_reports USING (tenant_id = current_setting('app.current_tenant', true));

