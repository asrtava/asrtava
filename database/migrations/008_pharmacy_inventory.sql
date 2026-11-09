-- ============================================================
-- ASRTAVA HMS - Migration 008: Pharmacy & Inventory Procurement
-- ============================================================

CREATE TABLE IF NOT EXISTS medicine_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, name)
);

CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    category_id UUID REFERENCES medicine_categories(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    manufacturer VARCHAR(255),
    dosage_form VARCHAR(50) DEFAULT 'tablet' CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'powder', 'iv_fluid', 'other')),
    strength VARCHAR(100), -- e.g. 500mg
    package_unit VARCHAR(50) DEFAULT 'strip',
    units_per_package INT DEFAULT 10 CHECK (units_per_package > 0),
    is_narcotic BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT TRUE,
    reorder_level INT DEFAULT 50 CHECK (reorder_level >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, item_code)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gst_number VARCHAR(30),
    payment_terms VARCHAR(100), -- e.g. Net 30 Days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, name)
);

CREATE TABLE IF NOT EXISTS pharmacy_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    purchase_cost_per_unit DECIMAL(10,2) NOT NULL CHECK (purchase_cost_per_unit >= 0.00),
    selling_price_per_unit DECIMAL(10,2) NOT NULL CHECK (selling_price_per_unit >= 0.00),
    mrp DECIMAL(10,2) NOT NULL CHECK (mrp >= 0.00),
    initial_quantity INT NOT NULL CHECK (initial_quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0),
    damaged_quantity INT DEFAULT 0 CHECK (damaged_quantity >= 0),
    storage_bin_location VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, medicine_id, batch_number),
    CONSTRAINT valid_pricing CHECK (mrp >= selling_price_per_unit)
);

CREATE TABLE IF NOT EXISTS pharmacy_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES pharmacy_batches(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('purchase_receipt', 'dispensing', 'sales_return', 'stock_adjustment', 'expiry_write_off', 'damage_write_off', 'inter_store_transfer')),
    quantity_change INT NOT NULL, -- Positive for in, negative for out
    balance_quantity_after INT NOT NULL CHECK (balance_quantity_after >= 0),
    reference_document_type VARCHAR(50), -- e.g. 'invoice', 'prescription', 'grn'
    reference_document_id UUID,
    justification_remarks TEXT,
    performed_by_user_id UUID NOT NULL REFERENCES users(id),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_dispensings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    dispensing_number VARCHAR(50) NOT NULL,
    gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (gross_amount >= 0.00),
    discount_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    tax_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (tax_amount >= 0.00),
    net_amount DECIMAL(12,2) NOT NULL CHECK (net_amount >= 0.00),
    payment_status VARCHAR(30) DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'credit', 'cancelled')),
    dispensed_by_user_id UUID NOT NULL REFERENCES users(id),
    dispensed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, dispensing_number)
);

CREATE TABLE IF NOT EXISTS pharmacy_dispense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensing_id UUID NOT NULL REFERENCES pharmacy_dispensings(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES pharmacy_batches(id) ON DELETE RESTRICT,
    quantity_dispensed INT NOT NULL CHECK (quantity_dispensed > 0),
    unit_selling_price DECIMAL(10,2) NOT NULL,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    po_number VARCHAR(50) NOT NULL,
    po_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    total_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (total_amount >= 0.00),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'partially_received', 'completed', 'cancelled')),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    approved_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, po_number)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INT DEFAULT 0 CHECK (quantity_received >= 0),
    unit_estimated_cost DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    grn_number VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50), -- Supplier's physical invoice
    grn_date DATE DEFAULT CURRENT_DATE,
    total_received_value DECIMAL(12,2) NOT NULL,
    received_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, grn_number)
);

