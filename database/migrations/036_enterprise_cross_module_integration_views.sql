-- ASRTAVA Master Enterprise Cross-Module Integration Views
-- Migration: 036_enterprise_cross_module_integration_views.sql

-- 1. Master Patient 360-Degree Longitudinal View
CREATE OR REPLACE VIEW view_patient_longitudinal_summary AS
SELECT 
    p.id AS patient_id,
    p.patient_number AS uhid,
    p.hospital_id AS tenant_id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.gender,
    p.date_of_birth,
    COUNT(DISTINCT a.id) AS total_opd_encounters,
    COUNT(DISTINCT i.admission_key) AS total_ipd_admissions,
    COALESCE(SUM(f.gross_billed), 0.00) AS lifetime_billed_revenue
FROM patients p
LEFT JOIN appointments a ON a.patient_id = p.id AND a.hospital_id = p.hospital_id
LEFT JOIN edw_fact_ipd_admissions i ON i.patient_key = p.id
LEFT JOIN edw_fact_financial_daily f ON f.tenant_id = p.hospital_id::text
GROUP BY p.id, p.patient_number, p.hospital_id, p.first_name, p.last_name, p.gender, p.date_of_birth;

-- 2. Master Hospital Operational Real-Time Telemetry View
CREATE OR REPLACE VIEW view_hospital_realtime_telemetry AS
SELECT
    t.hospital_id AS tenant_id,
    COALESCE(SUM(CASE WHEN b.status = 'occupied' THEN 1 ELSE 0 END), 0) AS active_inpatient_census,
    COALESCE(SUM(CASE WHEN b.status = 'available' THEN 1 ELSE 0 END), 0) AS available_beds_count,
    COALESCE(SUM(CASE WHEN b.status = 'cleaning' THEN 1 ELSE 0 END), 0) AS pending_cleaning_beds_count,
    COUNT(b.id) AS total_beds_count
FROM (SELECT DISTINCT hospital_id FROM patients) t
LEFT JOIN beds b ON b.hospital_id = t.hospital_id
GROUP BY t.hospital_id;

-- 3. Master Financial Reconciliation Summary View
CREATE OR REPLACE VIEW view_financial_reconciliation_summary AS
SELECT
    tenant_id,
    SUM(gross_billed) AS total_gross_billed,
    SUM(discounts_allowed) AS total_discounts,
    SUM(net_billed) AS total_net_billed,
    SUM(cash_collected) AS total_cash_collected,
    SUM(tpa_collected) AS total_tpa_collected,
    SUM(ar_outstanding) AS total_ar_balance,
    CASE 
        WHEN SUM(gross_billed) - SUM(discounts_allowed) = SUM(net_billed) THEN TRUE 
        ELSE FALSE 
    END AS is_mathematically_balanced
FROM edw_fact_financial_daily
GROUP BY tenant_id;

