-- ============================================================
-- ASRTAVA HMS - Migration 031: Complete HRMS & Workforce Management
-- Module: Complete HR Management, Employee Records, Recruitment,
-- Attendance, Payroll, Leave, Rostering & Credentials
-- ============================================================

-- 1. Designations & Job Grades
CREATE TABLE IF NOT EXISTS hr_designations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    job_grade VARCHAR(20) DEFAULT 'GRADE_B',
    min_experience_years INT DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, code)
);

-- 2. Employee Master Record
CREATE TABLE IF NOT EXISTS hr_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) DEFAULT 'OTHER',
    date_of_birth DATE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation_id UUID REFERENCES hr_designations(id) ON DELETE SET NULL,
    employment_type VARCHAR(30) DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONSULTANT', 'TRAINEE', 'CONTRACTOR')),
    employment_status VARCHAR(30) DEFAULT 'PROBATION' CHECK (employment_status IN ('PROBATION', 'ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'RETIRED')),
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    confirmation_date DATE,
    reporting_manager_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
    work_location VARCHAR(100) DEFAULT 'Main Campus',
    cost_center_code VARCHAR(50) DEFAULT 'CC-GEN',
    base_monthly_salary DECIMAL(12,2) DEFAULT 0.00 CHECK (base_monthly_salary >= 0.00),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(30),
    pan_number VARCHAR(20),
    aadhaar_masked VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, employee_number)
);

-- 3. Employee Documents Vault
CREATE TABLE IF NOT EXISTS hr_employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ID_PROOF', 'DEGREE_CERTIFICATE', 'REGISTRATION_LICENSE', 'EXPERIENCE_LETTER', 'BACKGROUND_CHECK', 'CONTRACT')),
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    verification_status VARCHAR(30) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Job Requisitions (ATS)
CREATE TABLE IF NOT EXISTS hr_job_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requisition_number VARCHAR(50) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    designation_id UUID NOT NULL REFERENCES hr_designations(id) ON DELETE CASCADE,
    vacancies_count INT DEFAULT 1 CHECK (vacancies_count > 0),
    job_description TEXT NOT NULL,
    required_qualification VARCHAR(255) NOT NULL,
    min_experience_years INT DEFAULT 0,
    budget_ctc_max DECIMAL(12,2) DEFAULT 0.00,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'OPEN', 'FULFILLED', 'CANCELLED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, requisition_number)
);

-- 5. Candidates & Applications
CREATE TABLE IF NOT EXISTS hr_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    current_organization VARCHAR(150),
    experience_years DECIMAL(4,1) DEFAULT 0.0,
    qualification VARCHAR(255),
    resume_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requisition_id UUID NOT NULL REFERENCES hr_job_requisitions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES hr_candidates(id) ON DELETE CASCADE,
    stage VARCHAR(30) DEFAULT 'APPLIED' CHECK (stage IN ('APPLIED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED', 'OFFER_ISSUED', 'OFFER_ACCEPTED', 'REJECTED', 'WITHDRAWN', 'JOINED')),
    expected_ctc DECIMAL(12,2) DEFAULT 0.00,
    offered_ctc DECIMAL(12,2) DEFAULT 0.00,
    joining_date DATE,
    status_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (requisition_id, candidate_id)
);

-- 6. Interview Evaluations
CREATE TABLE IF NOT EXISTS hr_interview_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES hr_applications(id) ON DELETE CASCADE,
    interviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_round VARCHAR(50) DEFAULT 'CLINICAL_COMPETENCY' CHECK (interview_round IN ('SCREENING', 'CLINICAL_COMPETENCY', 'TECHNICAL', 'HR_ROUND', 'MANAGEMENT')),
    score INT DEFAULT 3 CHECK (score BETWEEN 1 AND 5),
    recommendation VARCHAR(20) DEFAULT 'HOLD' CHECK (recommendation IN ('SELECT', 'HOLD', 'REJECT')),
    notes TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Biometric Attendance Devices
CREATE TABLE IF NOT EXISTS hr_attendance_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    device_code VARCHAR(50) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'BIOMETRIC_FINGERPRINT' CHECK (device_type IN ('BIOMETRIC_FINGERPRINT', 'FACIAL_RECOGNITION', 'RFID_CARD', 'MOBILE_GEOFENCE')),
    ip_address VARCHAR(45),
    port INT DEFAULT 4370,
    location_area VARCHAR(100),
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, device_code)
);

-- 8. Attendance Punch Event Logs
CREATE TABLE IF NOT EXISTS hr_attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    device_id UUID REFERENCES hr_attendance_devices(id) ON DELETE SET NULL,
    log_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    punch_type VARCHAR(30) DEFAULT 'CHECK_IN' CHECK (punch_type IN ('CHECK_IN', 'CHECK_OUT', 'BREAK_IN', 'BREAK_OUT')),
    source VARCHAR(30) DEFAULT 'DEVICE' CHECK (source IN ('DEVICE', 'WEB_PORTAL', 'MOBILE', 'MANUAL_OVERRIDE')),
    verification_mode VARCHAR(30) DEFAULT 'FINGERPRINT',
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Attendance Corrections
CREATE TABLE IF NOT EXISTS hr_attendance_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    requested_check_in TIMESTAMPTZ,
    requested_check_out TIMESTAMPTZ,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Shift Templates & Duty Rostering
CREATE TABLE IF NOT EXISTS hr_shift_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    shift_code VARCHAR(30) NOT NULL,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    is_night_shift BOOLEAN DEFAULT FALSE,
    is_on_call BOOLEAN DEFAULT FALSE,
    color_code VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, shift_code)
);

CREATE TABLE IF NOT EXISTS hr_duty_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    shift_template_id UUID NOT NULL REFERENCES hr_shift_templates(id) ON DELETE CASCADE,
    roster_date DATE NOT NULL,
    shift_role VARCHAR(30) DEFAULT 'PRIMARY' CHECK (shift_role IN ('PRIMARY', 'RELIEVER', 'SUPERVISOR', 'ON_CALL')),
    is_swap BOOLEAN DEFAULT FALSE,
    original_employee_id UUID REFERENCES hr_employees(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, employee_id, roster_date)
);

-- 11. Leave Types & Dynamic Balances
CREATE TABLE IF NOT EXISTS hr_leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    annual_quota_days INT NOT NULL DEFAULT 12,
    is_carry_forward BOOLEAN DEFAULT FALSE,
    max_carry_forward_days INT DEFAULT 0,
    is_encashable BOOLEAN DEFAULT FALSE,
    requires_proof BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, code)
);

CREATE TABLE IF NOT EXISTS hr_leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE CASCADE,
    year INT NOT NULL,
    opening_balance DECIMAL(5,1) DEFAULT 0.0,
    accrued DECIMAL(5,1) DEFAULT 0.0,
    used DECIMAL(5,1) DEFAULT 0.0,
    closing_balance DECIMAL(5,1) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS hr_leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1) NOT NULL DEFAULT 1.0,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Salary Structures & Monthly Payroll
CREATE TABLE IF NOT EXISTS hr_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL UNIQUE REFERENCES hr_employees(id) ON DELETE CASCADE,
    basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    hra_allowance DECIMAL(12,2) DEFAULT 0.00,
    conveyance_allowance DECIMAL(12,2) DEFAULT 0.00,
    medical_allowance DECIMAL(12,2) DEFAULT 0.00,
    special_allowance DECIMAL(12,2) DEFAULT 0.00,
    night_shift_allowance DECIMAL(12,2) DEFAULT 0.00,
    gross_salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pf_applicable BOOLEAN DEFAULT TRUE,
    esi_applicable BOOLEAN DEFAULT FALSE,
    pt_applicable BOOLEAN DEFAULT TRUE,
    tds_monthly DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_payroll_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    batch_code VARCHAR(50) NOT NULL,
    period_month VARCHAR(7) NOT NULL, -- e.g. '2026-11'
    total_employees INT DEFAULT 0,
    total_gross DECIMAL(14,2) DEFAULT 0.00,
    total_deductions DECIMAL(14,2) DEFAULT 0.00,
    total_net_payable DECIMAL(14,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CALCULATED', 'VERIFIED', 'APPROVED', 'POSTED_TO_GL', 'DISBURSED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    gl_journal_voucher_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, batch_code)
);

CREATE TABLE IF NOT EXISTS hr_payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES hr_payroll_batches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    period_month VARCHAR(7) NOT NULL,
    working_days INT DEFAULT 30,
    present_days INT DEFAULT 30,
    paid_leave_days INT DEFAULT 0,
    unpaid_leave_days INT DEFAULT 0,
    basic_earned DECIMAL(12,2) DEFAULT 0.00,
    hra_earned DECIMAL(12,2) DEFAULT 0.00,
    allowances_earned DECIMAL(12,2) DEFAULT 0.00,
    gross_earned DECIMAL(12,2) DEFAULT 0.00,
    pf_deduction DECIMAL(12,2) DEFAULT 0.00,
    esi_deduction DECIMAL(12,2) DEFAULT 0.00,
    pt_deduction DECIMAL(12,2) DEFAULT 0.00,
    tds_deduction DECIMAL(12,2) DEFAULT 0.00,
    total_deductions DECIMAL(12,2) DEFAULT 0.00,
    net_payable DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'APPROVED', 'PAID')),
    payment_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, employee_id, period_month)
);

-- 13. Professional Credentials & Licensing Alerts
CREATE TABLE IF NOT EXISTS hr_professional_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    credential_type VARCHAR(50) NOT NULL CHECK (credential_type IN ('MEDICAL_COUNCIL_REG', 'NURSING_COUNCIL_REG', 'PHARMACY_COUNCIL_REG', 'AERB_RADIATION_SAFETY', 'BLS_ACLS', 'SPECIALTY_BOARD')),
    license_number VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'EXPIRED', 'REJECTED')),
    verified_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Training Programs & Mandatory Certifications
CREATE TABLE IF NOT EXISTS hr_training_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    program_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'CLINICAL_SAFETY' CHECK (category IN ('CLINICAL_SAFETY', 'INFECTION_CONTROL', 'FIRE_SAFETY', 'PATIENT_RIGHTS', 'TECHNICAL')),
    duration_hours DECIMAL(4,1) DEFAULT 4.0,
    validity_months INT DEFAULT 12,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_training_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES hr_training_programs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    score_percentage DECIMAL(5,2) DEFAULT 100.00,
    certificate_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PASSED' CHECK (status IN ('ATTENDED', 'PASSED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Employee Separation & Exit Clearance
CREATE TABLE IF NOT EXISTS hr_separations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    resignation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_relieving_date DATE NOT NULL,
    notice_period_days INT DEFAULT 30,
    reason TEXT NOT NULL,
    separation_type VARCHAR(30) DEFAULT 'RESIGNATION' CHECK (separation_type IN ('RESIGNATION', 'RETIREMENT', 'TERMINATION', 'ABSCONDING')),
    clinical_handover_cleared BOOLEAN DEFAULT FALSE,
    assets_returned BOOLEAN DEFAULT FALSE,
    department_clearance BOOLEAN DEFAULT FALSE,
    finance_settled BOOLEAN DEFAULT FALSE,
    final_settlement_amount DECIMAL(12,2) DEFAULT 0.00,
    access_revoked BOOLEAN DEFAULT FALSE,
    access_revoked_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'IN_CLEARANCE', 'SETTLED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security (RLS) & Indexes
-- ============================================================
ALTER TABLE hr_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_job_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_duty_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payroll_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_professional_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_separations ENABLE ROW LEVEL SECURITY;

CREATE POLICY hr_designations_isolation_policy ON hr_designations USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_employees_isolation_policy ON hr_employees USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_employee_documents_isolation_policy ON hr_employee_documents USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_job_requisitions_isolation_policy ON hr_job_requisitions USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_candidates_isolation_policy ON hr_candidates USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_applications_isolation_policy ON hr_applications USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_interview_evaluations_isolation_policy ON hr_interview_evaluations USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_attendance_devices_isolation_policy ON hr_attendance_devices USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_attendance_logs_isolation_policy ON hr_attendance_logs USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_attendance_corrections_isolation_policy ON hr_attendance_corrections USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_shift_templates_isolation_policy ON hr_shift_templates USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_duty_rosters_isolation_policy ON hr_duty_rosters USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_leave_types_isolation_policy ON hr_leave_types USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_leave_balances_isolation_policy ON hr_leave_balances USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_leave_applications_isolation_policy ON hr_leave_applications USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_salary_structures_isolation_policy ON hr_salary_structures USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_payroll_batches_isolation_policy ON hr_payroll_batches USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_payslips_isolation_policy ON hr_payslips USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_professional_credentials_isolation_policy ON hr_professional_credentials USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_training_programs_isolation_policy ON hr_training_programs USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_training_attendees_isolation_policy ON hr_training_attendees USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY hr_separations_isolation_policy ON hr_separations USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_hr_employees_dept ON hr_employees(hospital_id, department_id, employment_status);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_logs_emp ON hr_attendance_logs(hospital_id, employee_id, log_timestamp);
CREATE INDEX IF NOT EXISTS idx_hr_duty_rosters_date ON hr_duty_rosters(hospital_id, roster_date, department_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_applications_emp ON hr_leave_applications(hospital_id, employee_id, status);
CREATE INDEX IF NOT EXISTS idx_hr_payslips_batch ON hr_payslips(hospital_id, batch_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_credentials_exp ON hr_professional_credentials(hospital_id, expiry_date, verification_status);

