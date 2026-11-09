# ASRTAVA LIS Database Design Specification

**Migration Script:** `database/migrations/026_complete_laboratory_information_system.sql`  
**Database Engine:** PostgreSQL 16 Multi-AZ with Row-Level Security (RLS)  

---

## 1. Relational Entities & Schemas

### 1.1 `lis_departments`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `code VARCHAR(30) NOT NULL` (e.g. `BIOCHEM`, `HAEMAT`, `MICROBIO`, `HISTOPATH`, `IMMUNO`)
- `name VARCHAR(100) NOT NULL`
- `head_of_department_id UUID REFERENCES users(id)`
- `location_room VARCHAR(50)`
- `is_active BOOLEAN DEFAULT true`

### 1.2 `lis_test_parameters`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `department_id UUID NOT NULL REFERENCES lis_departments(id) ON DELETE CASCADE`
- `parameter_code VARCHAR(50) NOT NULL` (e.g. `K_POTASSIUM`, `HB_HEMOGLOBIN`, `CREATININE`)
- `parameter_name VARCHAR(100) NOT NULL`
- `unit_of_measure VARCHAR(30) NOT NULL` (e.g. `mmol/L`, `g/dL`, `mg/dL`)
- `loinc_code VARCHAR(30)`
- `methodology VARCHAR(100)`
- `ref_range_male_min NUMERIC(8,2)`
- `ref_range_male_max NUMERIC(8,2)`
- `ref_range_female_min NUMERIC(8,2)`
- `ref_range_female_max NUMERIC(8,2)`
- `critical_low NUMERIC(8,2)`
- `critical_high NUMERIC(8,2)`
- `turnaround_target_mins INT DEFAULT 120`

### 1.3 `lis_specimens`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `accession_number VARCHAR(50) NOT NULL UNIQUE`
- `barcode_string VARCHAR(100) NOT NULL`
- `patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE`
- `order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE`
- `specimen_type VARCHAR(50) NOT NULL` (e.g. `WHOLE_BLOOD`, `SERUM`, `URINE`, `CSF`, `TISSUE`)
- `container_type VARCHAR(50) NOT NULL` (e.g. `EDTA_LAVENDER`, `SST_GOLD`, `CITRATE_BLUE`, `FLUORIDE_GREY`)
- `collection_time TIMESTAMPTZ`
- `collected_by_user_id UUID REFERENCES users(id)`
- `received_time TIMESTAMPTZ`
- `received_by_user_id UUID REFERENCES users(id)`
- `specimen_condition VARCHAR(30) DEFAULT 'ACCEPTABLE' CHECK (specimen_condition IN ('ACCEPTABLE', 'HEMOLYZED', 'LIPEMIC', 'ICTERIC', 'CLOTTED', 'INSUFFICIENT_VOLUME', 'LEAKING'))`
- `processing_status VARCHAR(30) DEFAULT 'COLLECTED' CHECK (processing_status IN ('COLLECTION_PENDING', 'COLLECTED', 'RECEIVED', 'IN_PROCESS', 'TESTED', 'AUTHORIZED', 'REJECTED', 'DISPOSED'))`

### 1.4 `lis_specimen_rejections`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE`
- `rejection_reason VARCHAR(100) NOT NULL`
- `rejected_by_user_id UUID NOT NULL REFERENCES users(id)`
- `recollection_requested BOOLEAN DEFAULT true`
- `notes TEXT`
- `created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`

### 1.5 `lis_test_results`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE`
- `parameter_id UUID NOT NULL REFERENCES lis_test_parameters(id) ON DELETE CASCADE`
- `numeric_value NUMERIC(10,3)`
- `text_value VARCHAR(255)`
- `abnormality_flag VARCHAR(20) DEFAULT 'NORMAL' CHECK (abnormality_flag IN ('NORMAL', 'ABNORMAL_HIGH', 'ABNORMAL_LOW', 'CRITICAL_PANIC'))`
- `validation_status VARCHAR(30) DEFAULT 'ENTERED' CHECK (validation_status IN ('ENTERED', 'TECHNICALLY_VALIDATED', 'PATHOLOGIST_AUTHORIZED', 'AMENDED'))`
- `delta_check_flag VARCHAR(20) DEFAULT 'STABLE' CHECK (delta_check_flag IN ('STABLE', 'SIGNIFICANT_RISE', 'SIGNIFICANT_DROP'))`
- `technologist_user_id UUID REFERENCES users(id)`
- `pathologist_user_id UUID REFERENCES users(id)`
- `authorized_at TIMESTAMPTZ`
- `is_amended BOOLEAN DEFAULT false`
- `amendment_reason TEXT`

### 1.6 `lis_critical_alerts`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `result_id UUID NOT NULL REFERENCES lis_test_results(id) ON DELETE CASCADE`
- `clinician_notified_id UUID REFERENCES users(id)`
- `notification_channel VARCHAR(30) NOT NULL`
- `notified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`
- `acknowledged_at TIMESTAMPTZ`
- `clinical_action_taken TEXT`

### 1.7 `lis_microbiology_cultures`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE`
- `organism_isolated VARCHAR(100)`
- `colony_count_cfu_ml VARCHAR(50)`
- `growth_status VARCHAR(30) DEFAULT 'PENDING_INCUBATION' CHECK (growth_status IN ('NO_GROWTH', 'GROWTH_OBSERVED', 'CONTAMINATED', 'PENDING_INCUBATION'))`
- `gram_stain_result VARCHAR(100)`
- `preliminary_report_released_at TIMESTAMPTZ`
- `final_report_released_at TIMESTAMPTZ`

### 1.8 `lis_antimicrobial_susceptibilities`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `culture_id UUID NOT NULL REFERENCES lis_microbiology_cultures(id) ON DELETE CASCADE`
- `antibiotic_name VARCHAR(100) NOT NULL`
- `mic_value VARCHAR(30)`
- `susceptibility_interpretation VARCHAR(20) NOT NULL CHECK (susceptibility_interpretation IN ('SENSITIVE', 'INTERMEDIATE', 'RESISTANT'))`

### 1.9 `lis_histopathology_cases`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `biopsy_number VARCHAR(50) NOT NULL UNIQUE`
- `specimen_id UUID NOT NULL REFERENCES lis_specimens(id) ON DELETE CASCADE`
- `tissue_site VARCHAR(100) NOT NULL`
- `gross_description TEXT NOT NULL`
- `cassette_count INT DEFAULT 1`
- `microscopic_findings TEXT NOT NULL`
- `pathologic_diagnosis TEXT NOT NULL`
- `reporting_pathologist_id UUID NOT NULL REFERENCES users(id)`
- `authorized_at TIMESTAMPTZ`

### 1.10 `lis_qc_measurements`
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE`
- `control_lot_number VARCHAR(50) NOT NULL`
- `parameter_id UUID NOT NULL REFERENCES lis_test_parameters(id) ON DELETE CASCADE`
- `target_mean NUMERIC(8,2) NOT NULL`
- `standard_deviation NUMERIC(8,2) NOT NULL`
- `measured_value NUMERIC(8,2) NOT NULL`
- `z_score NUMERIC(5,2) NOT NULL`
- `westgard_violation VARCHAR(20)` -- '1_2S', '1_3S', '2_2S', 'R_4S', '10_X'
- `run_status VARCHAR(20) NOT NULL CHECK (run_status IN ('IN_CONTROL', 'WARNING', 'OUT_OF_CONTROL_REJECT'))`
- `run_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`

