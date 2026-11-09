-- ============================================================
-- ASRTAVA HMS - Migration 010: Invoicing, Payments, Ledger & Refunds
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL, -- Nullable for OPD invoices
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    billing_category VARCHAR(30) DEFAULT 'opd' CHECK (billing_category IN ('opd', 'ipd', 'pharmacy', 'diagnostic', 'emergency', 'package')),
    gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (gross_amount >= 0.00),
    discount_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    net_payable DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (net_payable >= 0.00),
    total_paid DECIMAL(12,2) DEFAULT 0.00 CHECK (total_paid >= 0.00),
    outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded', 'written_off')),
    notes TEXT,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    service_type VARCHAR(30) NOT NULL CHECK (service_type IN ('consultation', 'procedure', 'bed_charge', 'medicine', 'lab_test', 'radiology', 'nursing', 'equipment', 'other')),
    service_description VARCHAR(255) NOT NULL,
    service_reference_id UUID, -- Optional foreign key pointer to consultation, test, procedure, etc.
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0.00),
    unit_rate DECIMAL(10,2) NOT NULL CHECK (unit_rate >= 0.00),
    discount_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (discount_rate BETWEEN 0.00 AND 100.00),
    tax_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (tax_rate >= 0.00),
    line_total DECIMAL(12,2) NOT NULL CHECK (line_total >= 0.00),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    payment_receipt_number VARCHAR(50) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0.00),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'upi', 'card', 'net_banking', 'cheque', 'tpa_insurance', 'wallet', 'other')),
    transaction_reference_id VARCHAR(100), -- Bank / Gateway / UTR reference ID
    idempotency_key VARCHAR(100), -- Prevents double-processing identical payment requests
    payment_timestamp TIMESTAMPTZ DEFAULT NOW(),
    cashier_user_id UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, payment_receipt_number),
    UNIQUE (hospital_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    refund_number VARCHAR(50) NOT NULL,
    refund_amount DECIMAL(12,2) NOT NULL CHECK (refund_amount > 0.00),
    reason_category VARCHAR(50) NOT NULL CHECK (reason_category IN ('overpayment', 'cancelled_service', 'billing_error', 'patient_discharge_adjustment')),
    justification TEXT NOT NULL,
    refund_status VARCHAR(30) DEFAULT 'pending_approval' CHECK (refund_status IN ('pending_approval', 'approved', 'disbursed', 'rejected')),
    requested_by_user_id UUID NOT NULL REFERENCES users(id),
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, refund_number)
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('invoice_charge', 'payment_receipt', 'refund_payout', 'tax_payable', 'discount_write_off')),
    reference_document_type VARCHAR(50) NOT NULL,
    reference_document_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    entry_side VARCHAR(10) NOT NULL CHECK (entry_side IN ('debit', 'credit')),
    account_code VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

