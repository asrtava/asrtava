-- ============================================================================
-- ASRTAVA Hospital Management System
-- 014_inventory.sql - Inventory & Procurement Management
-- ============================================================================

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    gst_number      VARCHAR(20),
    payment_terms   VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add deferred FK from pharmacy_batches -> suppliers
ALTER TABLE pharmacy_batches
    ADD CONSTRAINT fk_pharmacy_batches_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- inventory_items
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50),
    category        VARCHAR(100),
    unit            VARCHAR(50),
    minimum_stock   INT DEFAULT 0,
    current_stock   INT DEFAULT 0,
    reorder_level   INT DEFAULT 0,
    unit_price      DECIMAL(10,2),
    location        VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, code)
);

-- ---------------------------------------------------------------------------
-- purchase_orders
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    supplier_id         UUID NOT NULL
        REFERENCES suppliers(id) ON DELETE RESTRICT,
    order_number        VARCHAR(50) NOT NULL,
    order_date          DATE DEFAULT CURRENT_DATE,
    expected_delivery   DATE,
    status              VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'approved', 'partially_received',
                          'received', 'cancelled')),
    subtotal            DECIMAL(12,2),
    tax                 DECIMAL(12,2),
    total               DECIMAL(12,2),
    notes               TEXT,
    created_by          UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_by         UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, order_number)
);

-- ---------------------------------------------------------------------------
-- purchase_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id   UUID NOT NULL
        REFERENCES purchase_orders(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    item_type           VARCHAR(20)
        CHECK (item_type IN ('medicine', 'inventory')),
    item_id             UUID NOT NULL,
    quantity            INT NOT NULL,
    unit_price          DECIMAL(10,2) NOT NULL,
    tax                 DECIMAL(10,2) DEFAULT 0,
    total               DECIMAL(10,2) NOT NULL,
    received_quantity   INT DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- goods_receipts
-- ---------------------------------------------------------------------------
CREATE TABLE goods_receipts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id   UUID NOT NULL
        REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    receipt_number      VARCHAR(50) NOT NULL,
    receipt_date        DATE DEFAULT CURRENT_DATE,
    received_by         UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, receipt_number)
);

-- ---------------------------------------------------------------------------
-- stock_adjustments
-- ---------------------------------------------------------------------------
CREATE TABLE stock_adjustments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    item_type           VARCHAR(20)
        CHECK (item_type IN ('medicine', 'inventory')),
    item_id             UUID NOT NULL,
    adjustment_type     VARCHAR(20)
        CHECK (adjustment_type IN ('increase', 'decrease', 'correction')),
    quantity            INT NOT NULL,
    reason              TEXT NOT NULL,
    adjusted_by         UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    approved_by         UUID
        REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
