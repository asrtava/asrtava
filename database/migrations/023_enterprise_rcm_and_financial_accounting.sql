-- ============================================================
-- ASRTAVA HMS - Migration 023: Enterprise Revenue Cycle Management (RCM) & Financial Accounting
-- Chart of Accounts, Double-Entry General Ledger, Journal Vouchers, Tariffs, Packages,
-- Accounts Receivable, Accounts Payable, GST Management & Cashier Shift Reconciliation
-- ============================================================

-- ------------------------------------------------------------
-- 1. Financial Fiscal Periods
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_fiscal_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    period_code VARCHAR(50) NOT NULL, -- e.g. 'FY2026-Q1', 'FY2026-APR'
    period_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    closed_at TIMESTAMPTZ,
    closed_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_fiscal_period UNIQUE (hospital_id, period_code)
);

-- ------------------------------------------------------------
-- 2. Chart of Accounts (COA)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    account_code VARCHAR(50) NOT NULL, -- e.g. '1001', '1002', '1201', '2001', '4001'
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    is_reconciliation_account BOOLEAN DEFAULT FALSE,
    is_system_standard BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_account_code UNIQUE (hospital_id, account_code)
);

-- ------------------------------------------------------------
-- 3. General Ledger Journal Vouchers (Double-Entry Header)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    fiscal_period_id UUID REFERENCES financial_fiscal_periods(id) ON DELETE SET NULL,
    entry_number VARCHAR(50) NOT NULL, -- e.g. 'JV-2026-0001'
    posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN (
        'PATIENT_INVOICE',
        'PAYMENT_RECEIPT',
        'PATIENT_REFUND',
        'VENDOR_BILL',
        'VENDOR_PAYMENT',
        'CASHIER_SETTLEMENT',
        'DEPRECIATION',
        'INTER_BRANCH_TRANSFER',
        'MANUAL_JOURNAL'
    )),
    reference_id VARCHAR(100), -- Invoice ID, Payment ID, PO ID, etc.
    narration TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'POSTED' CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED')),
    total_debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_debit >= 0.00),
    total_credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_credit >= 0.00),
    is_balanced BOOLEAN DEFAULT TRUE,
    posted_by_user_id UUID REFERENCES users(id),
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_journal_balance CHECK (total_debit = total_credit),
    CONSTRAINT uq_hospital_journal_num UNIQUE (hospital_id, entry_number)
);

-- ------------------------------------------------------------
-- 4. Journal Entry Split Lines
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    debit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0.00),
    credit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0.00),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    cost_center VARCHAR(100),
    memo VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- ------------------------------------------------------------
-- 5. Tariff Master Catalog & Versioned Pricing
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tariff_master_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    service_code VARCHAR(50) NOT NULL, -- e.g. 'OPD-CONS-GEN', 'IPD-ICU-BED', 'LAB-CBC', 'RAD-CT-CHEST'
    service_name VARCHAR(200) NOT NULL,
    service_category VARCHAR(50) NOT NULL CHECK (service_category IN (
        'consultation',
        'nursing',
        'bed_charge',
        'icu_bed',
        'laboratory',
        'radiology',
        'pharmacy',
        'operation_theatre',
        'emergency',
        'equipment',
        'dialysis',
        'ambulance'
    )),
    base_rate NUMERIC(12, 2) NOT NULL CHECK (base_rate >= 0.00),
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (gst_rate IN (0.00, 5.00, 12.00, 18.00, 28.00)),
    hsn_sac_code VARCHAR(20) DEFAULT '999312', -- Standard Indian SAC for specialized medical services
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_tariff_service UNIQUE (hospital_id, service_code, effective_from)
);

-- ------------------------------------------------------------
-- 6. Bundled Hospital Service Packages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    package_code VARCHAR(50) NOT NULL,
    package_name VARCHAR(200) NOT NULL,
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN (
        'health_checkup',
        'maternity_normal',
        'maternity_cesarean',
        'cataract_surgery',
        'cardiac_angioplasty',
        'joint_replacement',
        'general_surgery'
    )),
    package_rate NUMERIC(12, 2) NOT NULL CHECK (package_rate >= 0.00),
    validity_days INT DEFAULT 30,
    maximum_stay_days INT DEFAULT 3,
    included_services JSONB NOT NULL, -- e.g. [{"serviceCode": "OPD-CONS-GEN", "quantity": 2}, {"serviceCode": "LAB-CBC", "quantity": 1}]
    excluded_services JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_package UNIQUE (hospital_id, package_code)
);

CREATE TABLE IF NOT EXISTS patient_package_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES hospital_service_packages(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    total_package_amount NUMERIC(12, 2) NOT NULL,
    utilized_amount NUMERIC(12, 2) DEFAULT 0.00,
    remaining_balance NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. Patient Interim Billing Ledger (Charge Capture)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_billing_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
    encounter_id UUID,
    service_code VARCHAR(50) NOT NULL,
    service_description VARCHAR(255) NOT NULL,
    service_category VARCHAR(50) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0.00),
    unit_rate NUMERIC(12, 2) NOT NULL CHECK (unit_rate >= 0.00),
    discount_amount NUMERIC(12, 2) DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0.00),
    billing_status VARCHAR(30) DEFAULT 'UNBILLED' CHECK (billing_status IN ('UNBILLED', 'INVOICED', 'CANCELLED')),
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    performed_by_user_id UUID REFERENCES users(id),
    service_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. Corporate Accounts & Third-Party Receivables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corporate_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    corporate_code VARCHAR(50) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    credit_limit NUMERIC(14, 2) NOT NULL DEFAULT 500000.00,
    current_credit_exposure NUMERIC(14, 2) DEFAULT 0.00,
    credit_period_days INT DEFAULT 30,
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    gstin VARCHAR(20),
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_corp_code UNIQUE (hospital_id, corporate_code)
);

-- ------------------------------------------------------------
-- 9. Accounts Payable & Vendor Invoices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts_payable_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL, -- references suppliers/vendors
    vendor_name VARCHAR(200) NOT NULL,
    vendor_invoice_number VARCHAR(100) NOT NULL,
    purchase_order_id UUID,
    goods_receipt_id UUID,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_amount NUMERIC(14, 2) NOT NULL CHECK (subtotal_amount >= 0.00),
    tax_amount NUMERIC(14, 2) DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    total_payable NUMERIC(14, 2) NOT NULL CHECK (total_payable >= 0.00),
    total_paid NUMERIC(14, 2) DEFAULT 0.00 CHECK (total_paid >= 0.00),
    outstanding_balance NUMERIC(14, 2) NOT NULL CHECK (outstanding_balance >= 0.00),
    payment_status VARCHAR(30) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'DISPUTED')),
    matching_status VARCHAR(30) DEFAULT 'MATCHED_3WAY' CHECK (matching_status IN ('MATCHED_3WAY', 'VARIANCE_HOLD', 'UNMATCHED')),
    notes TEXT,
    approved_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_vendor_inv UNIQUE (hospital_id, vendor_name, vendor_invoice_number)
);

-- ------------------------------------------------------------
-- 10. Cashier Shift Reconciliation & Counter Audits
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cashier_shift_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    cashier_user_id UUID NOT NULL REFERENCES users(id),
    counter_number VARCHAR(20) NOT NULL DEFAULT 'COUNTER-01',
    shift_start_time TIMESTAMPTZ NOT NULL,
    shift_end_time TIMESTAMPTZ,
    opening_float NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
    cash_collected NUMERIC(12, 2) DEFAULT 0.00,
    upi_collected NUMERIC(12, 2) DEFAULT 0.00,
    card_collected NUMERIC(12, 2) DEFAULT 0.00,
    cheque_collected NUMERIC(12, 2) DEFAULT 0.00,
    refunds_disbursed NUMERIC(12, 2) DEFAULT 0.00,
    expected_closing_cash NUMERIC(12, 2) DEFAULT 0.00,
    physical_counted_cash NUMERIC(12, 2) DEFAULT 0.00,
    cash_variance NUMERIC(10, 2) DEFAULT 0.00, -- counted - expected (0 = balanced)
    variance_reason TEXT,
    supervisor_sign_off_user_id UUID REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED_BALANCED', 'CLOSED_DISCREPANCY')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 11. Bank Accounts & Settlement Reconciliation
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    book_balance NUMERIC(14, 2) DEFAULT 0.00,
    statement_balance NUMERIC(14, 2) DEFAULT 0.00,
    last_reconciled_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_hospital_bank_acc UNIQUE (hospital_id, account_number)
);

-- ------------------------------------------------------------
-- 12. Row-Level Security (RLS) Enablement
-- ------------------------------------------------------------
ALTER TABLE financial_fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariff_master_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_package_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_billing_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_shift_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 13. High-Performance Indexing
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_coa_hospital_type ON chart_of_accounts(hospital_id, account_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(hospital_id, posting_date, status);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_tariff_code ON tariff_master_catalog(hospital_id, service_code, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_ledger_status ON patient_billing_ledgers(hospital_id, patient_id, billing_status);
CREATE INDEX IF NOT EXISTS idx_ap_invoices_status ON accounts_payable_invoices(hospital_id, payment_status, due_date);
CREATE INDEX IF NOT EXISTS idx_cashier_shift_status ON cashier_shift_reconciliations(hospital_id, cashier_user_id, status);

