-- ============================================================
-- ASRTAVA HMS - Migration 024: Advanced Pharmacy Management,
-- E-Prescriptions, Drug Inventory, Batch Tracking & Medication Safety
-- ============================================================

-- 1. Comprehensive Drug Master Catalog (Formulary, LASA, Cold-Chain, Schedule)
CREATE TABLE IF NOT EXISTS drug_master_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    tall_man_name VARCHAR(255), -- e.g. predniSONE vs predniSOLONE for LASA defense
    dosage_form VARCHAR(50) NOT NULL CHECK (dosage_form IN (
        'tablet', 'capsule', 'syrup', 'suspension', 'injection_vial', 'injection_ampoule',
        'iv_infusion', 'ointment', 'cream', 'gel', 'eye_drops', 'ear_drops', 'nasal_spray',
        'inhaler', 'respules', 'powder', 'suppository', 'patch', 'other'
    )),
    strength VARCHAR(100) NOT NULL, -- e.g. '500 mg', '10 mg/5 mL'
    administration_route VARCHAR(50) NOT NULL CHECK (administration_route IN (
        'oral', 'iv', 'im', 'subcutaneous', 'intradermal', 'topical', 'inhalation',
        'ophthalmic', 'otic', 'nasal', 'sublingual', 'buccal', 'rectal', 'vaginal', 'other'
    )),
    unit_of_measurement VARCHAR(30) DEFAULT 'tablet',
    pack_size INT DEFAULT 10 CHECK (pack_size > 0),
    manufacturer VARCHAR(255) NOT NULL,
    therapeutic_category VARCHAR(150), -- e.g. 'Cardiovascular', 'Antimicrobial'
    atc_code VARCHAR(30), -- Anatomical Therapeutic Chemical code
    hsn_code VARCHAR(20) DEFAULT '3004', -- Standard Indian GST HSN for medicaments
    storage_condition VARCHAR(50) DEFAULT 'ROOM_TEMP' CHECK (storage_condition IN (
        'ROOM_TEMP', 'COLD_CHAIN_2_8C', 'FREEZER_MINUS_20C', 'COOL_DRY_PROTECT_LIGHT'
    )),
    target_temp_min_celsius NUMERIC(4, 1) DEFAULT 15.0,
    target_temp_max_celsius NUMERIC(4, 1) DEFAULT 25.0,
    regulatory_schedule VARCHAR(30) DEFAULT 'SCHEDULE_H' CHECK (regulatory_schedule IN (
        'OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'NARCOTIC_NDPS', 'CONTROLLED'
    )),
    is_narcotic BOOLEAN DEFAULT FALSE,
    is_high_alert BOOLEAN DEFAULT FALSE, -- Institute for Safe Medication Practices (ISMP) high alert
    is_lasa BOOLEAN DEFAULT FALSE, -- Look-Alike Sound-Alike
    formulary_status VARCHAR(50) DEFAULT 'FORMULARY_OPEN' CHECK (formulary_status IN (
        'FORMULARY_OPEN', 'RESTRICTED_ANTIMICROBIAL', 'SPECIALIST_ONLY', 'NON_FORMULARY_SPECIAL_ORDER'
    )),
    requires_prescription BOOLEAN DEFAULT TRUE,
    requires_double_signoff BOOLEAN DEFAULT FALSE,
    reorder_level INT DEFAULT 100 CHECK (reorder_level >= 0),
    maximum_stock_level INT DEFAULT 1000 CHECK (maximum_stock_level >= reorder_level),
    barcode_gtin VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, item_code)
);

-- 2. Drug Active Ingredients (Normalized for Chemical Cross-Referencing)
CREATE TABLE IF NOT EXISTS drug_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL, -- e.g. 'Paracetamol', 'Amoxicillin'
    strength_amount NUMERIC(10, 3) NOT NULL,
    strength_unit VARCHAR(30) NOT NULL, -- 'mg', 'g', 'mcg', 'IU', 'mL'
    is_primary_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Generic & Alternative Brand Equivalence Mapping
CREATE TABLE IF NOT EXISTS drug_substitutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    primary_drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE CASCADE,
    substitute_drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE CASCADE,
    substitution_type VARCHAR(50) DEFAULT 'GENERIC_EQUIVALENT' CHECK (substitution_type IN (
        'GENERIC_EQUIVALENT', 'THERAPEUTIC_ALTERNATIVE', 'BIOSIMILAR', 'STRICT_NO_SUBSTITUTION'
    )),
    is_hospital_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, primary_drug_id, substitute_drug_id)
);

-- 4. Clinical Drug-Drug Interaction (DDI) Knowledge Base
CREATE TABLE IF NOT EXISTS clinical_drug_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_a VARCHAR(255) NOT NULL,
    ingredient_b VARCHAR(255) NOT NULL,
    severity VARCHAR(30) NOT NULL CHECK (severity IN (
        'CRITICAL_BLOCK', 'MAJOR_WARNING', 'MODERATE_MONITOR', 'MINOR_INFORMATIONAL'
    )),
    clinical_effect TEXT NOT NULL,
    mechanism_action TEXT,
    management_guidance TEXT,
    reference_source VARCHAR(100) DEFAULT 'CDSS_KNOWLEDGE_BASE_V2',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (ingredient_a, ingredient_b)
);

-- 5. Clinician Safety Alert Review & Documented Override Log
CREATE TABLE IF NOT EXISTS clinical_alert_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'DRUG_ALLERGY', 'DRUG_DRUG_INTERACTION', 'DUPLICATE_THERAPY',
        'DOSE_RANGE_EXCEEDED', 'CONTRAINDICATION', 'HIGH_ALERT_LASA'
    )),
    severity VARCHAR(30) NOT NULL,
    alert_summary TEXT NOT NULL,
    override_reason_category VARCHAR(50) NOT NULL CHECK (override_reason_category IN (
        'BENEFIT_OUTWEIGHS_RISK', 'PATIENT_PREVIOUSLY_TOLERATED', 'DOSAGE_ADJUSTED_FOR_ORGAN_FUNCTION',
        'CO_PRESCRIBED_PROTECTIVE_AGENT', 'PALLIATIVE_CARE_INTENT', 'EMERGENCY_LIFE_SAVING'
    )),
    clinician_justification TEXT NOT NULL,
    overridden_by_user_id UUID NOT NULL REFERENCES users(id),
    overridden_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Prescription Version History & Amendment Tracking
CREATE TABLE IF NOT EXISTS prescription_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    amendment_reason TEXT NOT NULL,
    snapshot_payload JSONB NOT NULL,
    amended_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, prescription_id, version_number)
);

-- 7. Pharmacist Verification Queue (Clinical Gate Before Dispensing)
CREATE TABLE IF NOT EXISTS pharmacy_verification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) DEFAULT 'PENDING_REVIEW' CHECK (verification_status IN (
        'PENDING_REVIEW', 'VERIFIED_APPROVED', 'REJECTED_CLINICAL_QUERY',
        'CLARIFICATION_REQUIRED', 'SUBSTITUTION_REQUIRED'
    )),
    pharmacist_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    clinical_pharmacist_notes TEXT,
    pharmacist_action_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, prescription_id)
);

-- 8. Drug Substitutions at Dispensing Counter
CREATE TABLE IF NOT EXISTS pharmacy_dispense_substitutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    dispensing_id UUID NOT NULL REFERENCES pharmacy_dispensings(id) ON DELETE CASCADE,
    prescribed_drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE RESTRICT,
    dispensed_drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE RESTRICT,
    substitution_reason VARCHAR(100) NOT NULL, -- e.g. 'Prescribed brand out of stock; bioequivalent generic dispensed'
    patient_consented BOOLEAN DEFAULT TRUE,
    authorized_by_pharmacist_id UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Inpatient Electronic Medication Administration Records (eMAR)
CREATE TABLE IF NOT EXISTS inpatient_emar_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    prescription_item_id UUID REFERENCES prescription_items(id) ON DELETE SET NULL,
    drug_id UUID REFERENCES drug_master_catalog(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES pharmacy_batches(id) ON DELETE RESTRICT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    administered_time TIMESTAMPTZ,
    administration_status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (administration_status IN (
        'SCHEDULED', 'ADMINISTERED', 'OMITTED', 'REFUSED', 'DELAYED', 'HELD'
    )),
    omission_reason VARCHAR(100), -- 'Patient NPO for surgery', 'Patient refused dose', 'Vitals outside safe parameter'
    administering_nurse_id UUID REFERENCES users(id),
    cosigning_nurse_id UUID REFERENCES users(id), -- Mandatory dual-signoff for high-alert/narcotic
    recorded_vital_pulse INT,
    recorded_vital_bp_systolic INT,
    recorded_vital_bp_diastolic INT,
    nursing_clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Cold-Chain Storage Temperature Monitoring & Excursion Logging
CREATE TABLE IF NOT EXISTS cold_chain_temperature_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    storage_unit_code VARCHAR(50) NOT NULL, -- e.g. 'FRIDGE-MAIN-01', 'VACCINE-VAULT-02'
    location_name VARCHAR(100) NOT NULL,
    temperature_celsius NUMERIC(4, 2) NOT NULL,
    target_min_celsius NUMERIC(4, 2) DEFAULT 2.00,
    target_max_celsius NUMERIC(4, 2) DEFAULT 8.00,
    is_excursion BOOLEAN DEFAULT FALSE,
    excursion_duration_minutes INT DEFAULT 0,
    quarantine_triggered BOOLEAN DEFAULT FALSE,
    remediated_at TIMESTAMPTZ,
    reviewed_by_pharmacist_id UUID REFERENCES users(id),
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Manufacturer & Regulatory Product Recall Records
CREATE TABLE IF NOT EXISTS product_recalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    recall_reference_number VARCHAR(100) NOT NULL,
    drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    recall_class VARCHAR(30) NOT NULL CHECK (recall_class IN (
        'CLASS_I_LIFE_THREATENING', 'CLASS_II_TEMPORARY_HEALTH_HAZARD', 'CLASS_III_MINOR_DEFECT'
    )),
    recall_reason TEXT NOT NULL,
    manufacturer_notice_date DATE NOT NULL,
    quarantined_quantity INT NOT NULL DEFAULT 0,
    affected_patients_identified INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'ACTIVE_QUARANTINE' CHECK (status IN (
        'ACTIVE_QUARANTINE', 'RETURNED_TO_MANUFACTURER', 'DISPOSED_DESTROYED', 'CLOSED_VERIFIED'
    )),
    authorized_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, recall_reference_number)
);

-- 12. Schedule X & Narcotic Double-Custody Vault Register
CREATE TABLE IF NOT EXISTS narcotic_vault_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES pharmacy_batches(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'VAULT_RECEIPT', 'WARD_DISPENSE', 'PATIENT_DISPENSE', 'WASTAGE_DESTROYED', 'SHIFT_COUNT_RECONCILIATION'
    )),
    quantity INT NOT NULL, -- Positive for addition, negative for deduction
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    primary_custodian_user_id UUID NOT NULL REFERENCES users(id),
    witness_user_id UUID NOT NULL REFERENCES users(id), -- Mandatory dual custody witness
    discrepancy_flag BOOLEAN DEFAULT FALSE,
    discrepancy_notes TEXT,
    reference_rx_or_order VARCHAR(100),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Pharmacy Purchase Requisitions (PR -> PO Approval Pipeline)
CREATE TABLE IF NOT EXISTS pharmacy_purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requisition_number VARCHAR(50) NOT NULL,
    department_source VARCHAR(100) DEFAULT 'CENTRAL_PHARMACY',
    total_estimated_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    justification TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (status IN (
        'PENDING_APPROVAL', 'APPROVED_CONVERTED_PO', 'REJECTED', 'CANCELLED'
    )),
    requested_by_user_id UUID NOT NULL REFERENCES users(id),
    approved_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, requisition_number)
);

-- 14. Requisition Items
CREATE TABLE IF NOT EXISTS pharmacy_purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES pharmacy_purchase_requisitions(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drug_master_catalog(id) ON DELETE RESTRICT,
    quantity_requested INT NOT NULL CHECK (quantity_requested > 0),
    estimated_unit_cost NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE drug_master_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_drug_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_alert_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_dispense_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inpatient_emar_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_chain_temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE narcotic_vault_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_purchase_requisition_items ENABLE ROW LEVEL SECURITY;

-- High-Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_drug_master_hosp_search ON drug_master_catalog(hospital_id, brand_name, generic_name);
CREATE INDEX IF NOT EXISTS idx_drug_master_schedule ON drug_master_catalog(hospital_id, regulatory_schedule);
CREATE INDEX IF NOT EXISTS idx_drug_master_formulary ON drug_master_catalog(hospital_id, formulary_status);
CREATE INDEX IF NOT EXISTS idx_drug_ingredients_drug ON drug_ingredients(drug_id);
CREATE INDEX IF NOT EXISTS idx_clinical_overrides_rx ON clinical_alert_overrides(hospital_id, prescription_id);
CREATE INDEX IF NOT EXISTS idx_rx_versions_rx ON prescription_versions(hospital_id, prescription_id, version_number);
CREATE INDEX IF NOT EXISTS idx_rx_verify_queue_status ON pharmacy_verification_queue(hospital_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_emar_admission_time ON inpatient_emar_records(hospital_id, admission_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_coldchain_unit_time ON cold_chain_temperature_logs(hospital_id, storage_unit_code, logged_at);
CREATE INDEX IF NOT EXISTS idx_recall_hosp_batch ON product_recalls(hospital_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_narcotic_vault_drug ON narcotic_vault_ledger(hospital_id, drug_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_pharmacy_pr_hosp_status ON pharmacy_purchase_requisitions(hospital_id, status);

