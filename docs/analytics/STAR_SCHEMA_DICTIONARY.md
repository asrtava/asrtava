# Enterprise Data Warehouse Star Schema Data Dictionary

## Dimension Tables

### 1. `edw_dim_date`
- `date_key`: INT (Primary Key, YYYYMMDD, e.g. 20261109)
- `calendar_date`: DATE (ISO 8601 date)
- `calendar_year`: INT (e.g. 2026)
- `calendar_quarter`: INT (1-4)
- `calendar_month`: INT (1-12)
- `month_name`: VARCHAR (e.g. 'Nov')
- `day_of_week`: INT (0=Sunday, 6=Saturday)
- `is_weekend`: BOOLEAN

### 2. `edw_dim_patient`
- `patient_key`: UUID (Primary Key)
- `tenant_id`: VARCHAR (Hospital Tenant Identifier)
- `pseudonym_hash`: VARCHAR(128) (HMAC-SHA256 salted hash of tenant + patient UHID)
- `gender`: VARCHAR ('MALE', 'FEMALE', 'OTHER')
- `age_group`: VARCHAR ('0-12', '13-18', '19-35', '36-50', '51-65', '65+')
- `city`: VARCHAR
- `state`: VARCHAR

### 3. `edw_dim_doctor`
- `doctor_key`: UUID (Primary Key)
- `tenant_id`: VARCHAR
- `doctor_id`: VARCHAR (Operational clinician identifier)
- `doctor_name`: VARCHAR
- `department_code`: VARCHAR
- `specialty`: VARCHAR
- `designation`: VARCHAR

### 4. `edw_dim_department`
- `department_key`: UUID (Primary Key)
- `tenant_id`: VARCHAR
- `department_code`: VARCHAR
- `department_name`: VARCHAR
- `department_type`: VARCHAR ('CLINICAL', 'DIAGNOSTIC', 'SURGICAL', 'ADMINISTRATIVE')

## Fact Tables

### 1. `edw_fact_opd_encounters`
- Granularity: One row per outpatient consultation
- Measures: `wait_time_minutes`, `consult_duration_minutes`, `fee_amount`, `is_no_show`

### 2. `edw_fact_ipd_admissions`
- Granularity: One row per inpatient admission episode
- Measures: `length_of_stay_days`, `total_charges`, `lace_risk_score`, `readmitted_within_30d`, `mortality_flag`

### 3. `edw_fact_financial_daily`
- Granularity: One row per tenant per calendar date
- Measures: `gross_billed`, `discounts_allowed`, `net_billed`, `cash_collected`, `tpa_collected`, `ar_outstanding`, `clean_claims_submitted`

