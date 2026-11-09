-- ============================================================================
-- ASRTAVA Hospital Management System
-- 013_pharmacy.sql - Pharmacy & Medicine Management
-- ============================================================================

-- ---------------------------------------------------------------------------
-- medicine_categories
-- ---------------------------------------------------------------------------
CREATE TABLE medicine_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, name)
);

-- ---------------------------------------------------------------------------
-- medicines
-- ---------------------------------------------------------------------------
CREATE TABLE medicines (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id             UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    category_id             UUID
        REFERENCES medicine_categories(id) ON DELETE SET NULL,
    name                    VARCHAR(255) NOT NULL,
    generic_name            VARCHAR(255),
    brand                   VARCHAR(255),
    manufacturer            VARCHAR(255),
    composition             TEXT,
    medicine_type           VARCHAR(30)
        CHECK (medicine_type IN ('tablet', 'capsule', 'syrup', 'injection', 'cream',
                                 'drops', 'inhaler', 'powder', 'gel', 'ointment', 'other')),
    strength                VARCHAR(100),
    unit                    VARCHAR(50),
    hsn_code                VARCHAR(20),
    requires_prescription   BOOLEAN DEFAULT true,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Add deferred FK from prescription_items -> medicines
ALTER TABLE prescription_items
    ADD CONSTRAINT fk_prescription_items_medicine
    FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- pharmacy_batches
-- ---------------------------------------------------------------------------
CREATE TABLE pharmacy_batches (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id         UUID NOT NULL
        REFERENCES medicines(id) ON DELETE CASCADE,
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    batch_number        VARCHAR(100) NOT NULL,
    manufacturing_date  DATE,
    expiry_date         DATE NOT NULL,
    purchase_price      DECIMAL(10,2) NOT NULL,
    selling_price       DECIMAL(10,2) NOT NULL,
    mrp                 DECIMAL(10,2),
    quantity_received   INT NOT NULL,
    quantity_available  INT NOT NULL,
    supplier_id         UUID,   -- FK added after suppliers table is created
    received_date       DATE DEFAULT CURRENT_DATE,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, medicine_id, batch_number)
);

-- ---------------------------------------------------------------------------
-- stock_movements
-- ---------------------------------------------------------------------------
CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id     UUID NOT NULL
        REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id        UUID
        REFERENCES pharmacy_batches(id) ON DELETE SET NULL,
    movement_type   VARCHAR(30)
        CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment',
                                 'transfer', 'expired', 'damage')),
    quantity        INT NOT NULL,
    reference_type  VARCHAR(50),
    reference_id    UUID,
    notes           TEXT,
    performed_by    UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- pharmacy_sales
-- ---------------------------------------------------------------------------
CREATE TABLE pharmacy_sales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id      UUID
        REFERENCES patients(id) ON DELETE SET NULL,
    prescription_id UUID
        REFERENCES prescriptions(id) ON DELETE SET NULL,
    sale_number     VARCHAR(50) NOT NULL,
    sale_date       TIMESTAMPTZ DEFAULT NOW(),
    subtotal        DECIMAL(12,2) NOT NULL,
    discount        DECIMAL(12,2) DEFAULT 0,
    tax             DECIMAL(12,2) DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL,
    payment_status  VARCHAR(20) DEFAULT 'pending',
    payment_method  VARCHAR(30),
    sold_by         UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (hospital_id, sale_number)
);

-- ---------------------------------------------------------------------------
-- pharmacy_sale_items
-- ---------------------------------------------------------------------------
CREATE TABLE pharmacy_sale_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id         UUID NOT NULL
        REFERENCES pharmacy_sales(id) ON DELETE CASCADE,
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id     UUID NOT NULL
        REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id        UUID NOT NULL
        REFERENCES pharmacy_batches(id) ON DELETE RESTRICT,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    discount        DECIMAL(10,2) DEFAULT 0,
    tax             DECIMAL(10,2) DEFAULT 0,
    total           DECIMAL(10,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
