-- ============================================================================
-- ASRTAVA Hospital Management System
-- 017_billing.sql - Billing, Payments & Financial Transactions
-- ============================================================================

-- ---------------------------------------------------------------------------
-- tax_configurations
-- ---------------------------------------------------------------------------
CREATE TABLE tax_configurations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    rate            DECIMAL(5,2) NOT NULL,
    tax_type        VARCHAR(20)
        CHECK (tax_type IN ('gst', 'cgst', 'sgst', 'igst', 'service_tax', 'other')),
    is_default      BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
CREATE TABLE invoices (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id             UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id              UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    admission_id            UUID
        REFERENCES admissions(id) ON DELETE SET NULL,
    invoice_number          VARCHAR(50) NOT NULL,
    invoice_date            DATE DEFAULT CURRENT_DATE,
    due_date                DATE,
    invoice_type            VARCHAR(30)
        CHECK (invoice_type IN ('opd', 'ipd', 'pharmacy', 'lab', 'radiology', 'general')),
    subtotal                DECIMAL(12,2) NOT NULL,
    discount_amount         DECIMAL(12,2) DEFAULT 0,
    discount_percentage     DECIMAL(5,2),
    tax_amount              DECIMAL(12,2) DEFAULT 0,
    total_amount            DECIMAL(12,2) NOT NULL,
    paid_amount             DECIMAL(12,2) DEFAULT 0,
    balance_amount          DECIMAL(12,2),
    payment_status          VARCHAR(20) DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue',
                                  'cancelled', 'refunded')),
    notes                   TEXT,
    created_by              UUID
        REFERENCES users(id) ON DELETE SET NULL,
    cancelled_by            UUID
        REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, invoice_number)
);

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID NOT NULL
        REFERENCES invoices(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    item_type           VARCHAR(30)
        CHECK (item_type IN ('consultation', 'procedure', 'medicine', 'lab_test',
                             'radiology', 'room_charge', 'bed_charge', 'nursing',
                             'service', 'other')),
    item_description    VARCHAR(255) NOT NULL,
    reference_id        UUID,
    quantity            DECIMAL(10,2) DEFAULT 1,
    unit_price          DECIMAL(10,2) NOT NULL,
    discount            DECIMAL(10,2) DEFAULT 0,
    tax_rate            DECIMAL(5,2) DEFAULT 0,
    tax_amount          DECIMAL(10,2) DEFAULT 0,
    total               DECIMAL(12,2) NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id             UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    invoice_id              UUID NOT NULL
        REFERENCES invoices(id) ON DELETE RESTRICT,
    patient_id              UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    payment_number          VARCHAR(50) NOT NULL,
    payment_date            TIMESTAMPTZ DEFAULT NOW(),
    amount                  DECIMAL(12,2) NOT NULL,
    payment_method          VARCHAR(30)
        CHECK (payment_method IN ('cash', 'card', 'upi', 'net_banking', 'cheque',
                                  'insurance', 'wallet', 'other')),
    transaction_reference   VARCHAR(100),
    notes                   TEXT,
    received_by             UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, payment_number)
);

-- ---------------------------------------------------------------------------
-- refunds
-- ---------------------------------------------------------------------------
CREATE TABLE refunds (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id             UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    payment_id              UUID NOT NULL
        REFERENCES payments(id) ON DELETE RESTRICT,
    invoice_id              UUID NOT NULL
        REFERENCES invoices(id) ON DELETE RESTRICT,
    patient_id              UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    refund_number           VARCHAR(50) NOT NULL,
    refund_date             TIMESTAMPTZ DEFAULT NOW(),
    amount                  DECIMAL(12,2) NOT NULL,
    reason                  TEXT NOT NULL,
    refund_method           VARCHAR(30),
    transaction_reference   VARCHAR(100),
    status                  VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
    requested_by            UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    approved_by             UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    processed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, refund_number)
);

-- ---------------------------------------------------------------------------
-- financial_transactions - Ledger of all financial movements
-- ---------------------------------------------------------------------------
CREATE TABLE financial_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    transaction_type    VARCHAR(30)
        CHECK (transaction_type IN ('payment', 'refund', 'adjustment', 'write_off')),
    reference_type      VARCHAR(30),
    reference_id        UUID,
    amount              DECIMAL(12,2) NOT NULL,
    description         TEXT,
    performed_by        UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
