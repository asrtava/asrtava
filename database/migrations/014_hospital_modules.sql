-- ============================================================
-- ASRTAVA HMS - Migration 014: Hospital Modules & Interconnected Workflows
-- ============================================================

-- 1. Patient Record Merges & Duplicate Prevention Audit
CREATE TABLE IF NOT EXISTS patient_merges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    source_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    target_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    merge_reason TEXT NOT NULL,
    matched_criteria JSONB DEFAULT '{}', -- e.g. {"phone_matched": true, "name_similarity": 0.94}
    approved_by_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('requested', 'approved', 'completed', 'reversed')),
    reversal_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clinical Notes Amendments (Preserving Immutable Medical Records)
CREATE TABLE IF NOT EXISTS consultation_amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    amendment_number INT NOT NULL DEFAULT 1,
    amended_by_user_id UUID NOT NULL REFERENCES users(id),
    amendment_reason TEXT NOT NULL,
    previous_clinical_notes TEXT,
    amended_clinical_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Operation Theatres (OT) & Surgical Scheduling
CREATE TABLE IF NOT EXISTS operation_theatres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL,
    floor VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, code)
);

CREATE TABLE IF NOT EXISTS ot_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    operation_theatre_id UUID NOT NULL REFERENCES operation_theatres(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
    lead_surgeon_id UUID NOT NULL REFERENCES doctors(id),
    anesthetist_id UUID REFERENCES doctors(id),
    procedure_name VARCHAR(255) NOT NULL,
    procedure_code VARCHAR(50),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pre_op', 'in_progress', 'recovery', 'completed', 'cancelled', 'postponed')),
    pre_op_checklist JSONB DEFAULT '{"consent_verified": true, "site_marked": true, "anesthesia_cleared": true}',
    operative_findings TEXT,
    post_op_orders TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emergency Department (ED) Triage & Fast-Track Admissions
CREATE TABLE IF NOT EXISTS emergency_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    emergency_number VARCHAR(50) NOT NULL,
    triage_level VARCHAR(30) NOT NULL CHECK (triage_level IN ('level_1_resuscitation', 'level_2_emergent', 'level_3_urgent', 'level_4_less_urgent', 'level_5_non_urgent')),
    chief_complaint TEXT NOT NULL,
    triage_vitals JSONB DEFAULT '{}', -- e.g. {"bp": "140/90", "hr": 110, "spo2": 92, "temp": 101.2}
    assigned_doctor_id UUID REFERENCES doctors(id),
    arrival_mode VARCHAR(50) DEFAULT 'walk_in' CHECK (arrival_mode IN ('walk_in', 'ambulance', 'police_referral', 'hospital_transfer')),
    arrival_time TIMESTAMPTZ DEFAULT NOW(),
    disposition VARCHAR(30) DEFAULT 'in_er' CHECK (disposition IN ('in_er', 'admitted_ipd', 'transferred_icu', 'transferred_ot', 'discharged', 'lama', 'deceased')),
    disposition_time TIMESTAMPTZ,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, emergency_number)
);

-- 5. Nursing Intake/Output & Clinical Care Plans
CREATE TABLE IF NOT EXISTS nursing_intake_output (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_time TIMESTAMPTZ DEFAULT NOW(),
    intake_oral_ml INT DEFAULT 0,
    intake_iv_fluid_ml INT DEFAULT 0,
    intake_tube_feeding_ml INT DEFAULT 0,
    output_urine_ml INT DEFAULT 0,
    output_drain_ml INT DEFAULT 0,
    output_vomitus_ml INT DEFAULT 0,
    net_fluid_balance_ml INT GENERATED ALWAYS AS ((intake_oral_ml + intake_iv_fluid_ml + intake_tube_feeding_ml) - (output_urine_ml + output_drain_ml + output_vomitus_ml)) STORED,
    recorded_by_nurse_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nursing_shift_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('morning', 'evening', 'night')),
    handover_date DATE DEFAULT CURRENT_DATE,
    outgoing_nurse_id UUID NOT NULL REFERENCES users(id),
    incoming_nurse_id UUID NOT NULL REFERENCES users(id),
    census_occupied INT NOT NULL DEFAULT 0,
    census_vacant INT NOT NULL DEFAULT 0,
    critical_patients_notes TEXT,
    pending_tasks TEXT,
    handover_confirmed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nursing_care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    nursing_diagnosis VARCHAR(255) NOT NULL,
    expected_outcome TEXT NOT NULL,
    interventions TEXT NOT NULL,
    evaluation TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'met', 'revised', 'discontinued')),
    created_by_nurse_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Centralized Event-Driven Notifications Log
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('in_app', 'sms', 'email', 'whatsapp', 'push')),
    event_type VARCHAR(50) NOT NULL, -- e.g. 'appointment_confirmed', 'lab_report_ready', 'critical_vitals_alert'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    external_provider_message_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Centralized Document Management
CREATE TABLE IF NOT EXISTS hospital_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    document_category VARCHAR(50) NOT NULL CHECK (document_category IN ('clinical_summary', 'lab_report', 'radiology_dicom', 'prescription', 'id_proof', 'consent_form', 'insurance_preauth', 'discharge_summary')),
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_size_bytes BIGINT DEFAULT 0,
    uploaded_by_user_id UUID REFERENCES users(id),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Staff Attendance, Leave Approvals & Payroll
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'on_leave', 'half_day', 'holiday')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, user_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS staff_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('casual', 'sick', 'earned', 'maternity', 'conference', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by_user_id UUID REFERENCES users(id),
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pay_period_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g. 2026-11)
    basic_salary DECIMAL(12,2) NOT NULL CHECK (basic_salary >= 0.00),
    hra_allowance DECIMAL(12,2) DEFAULT 0.00 CHECK (hra_allowance >= 0.00),
    medical_allowance DECIMAL(12,2) DEFAULT 0.00 CHECK (medical_allowance >= 0.00),
    special_allowance DECIMAL(12,2) DEFAULT 0.00 CHECK (special_allowance >= 0.00),
    provident_fund_deduction DECIMAL(12,2) DEFAULT 0.00 CHECK (provident_fund_deduction >= 0.00),
    professional_tax_deduction DECIMAL(12,2) DEFAULT 0.00 CHECK (professional_tax_deduction >= 0.00),
    income_tax_tds DECIMAL(12,2) DEFAULT 0.00 CHECK (income_tax_tds >= 0.00),
    net_salary DECIMAL(12,2) GENERATED ALWAYS AS ((basic_salary + hra_allowance + medical_allowance + special_allowance) - (provident_fund_deduction + professional_tax_deduction + income_tax_tds)) STORED,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'hold')),
    payment_mode VARCHAR(30) DEFAULT 'bank_transfer',
    transaction_ref VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, employee_user_id, pay_period_month)
);

-- ============================================================
-- Indexes for Concurrency & Query Optimization
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ot_schedules_time ON ot_schedules(hospital_id, operation_theatre_id, scheduled_start, scheduled_end);
CREATE INDEX IF NOT EXISTS idx_emergency_admissions_triage ON emergency_admissions(hospital_id, triage_level, disposition);
CREATE INDEX IF NOT EXISTS idx_nursing_io_admission ON nursing_intake_output(hospital_id, admission_id, record_time);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(hospital_id, recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_hospital_docs_patient ON hospital_documents(hospital_id, patient_id, document_category);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll_runs(hospital_id, employee_user_id, pay_period_month);

