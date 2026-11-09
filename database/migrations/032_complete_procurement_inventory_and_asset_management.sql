-- ============================================================
-- ASRTAVA HMS - Migration 032: Complete Procurement, Inventory,
-- Asset Management, Maintenance & Hospital Facility Management
-- ============================================================

-- 1. Vendors Master
CREATE TABLE IF NOT EXISTS proc_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    vendor_code VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    address TEXT,
    gstin VARCHAR(30),
    pan_number VARCHAR(20),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(30),
    payment_terms VARCHAR(100) DEFAULT 'NET_30',
    vendor_category VARCHAR(50) DEFAULT 'PHARMACEUTICAL' CHECK (vendor_category IN ('PHARMACEUTICAL', 'SURGICAL', 'BIOMEDICAL_EQUIPMENT', 'DIAGNOSTIC_REAGENTS', 'FACILITY_SUPPLIES', 'GENERAL')),
    rating DECIMAL(3,2) DEFAULT 4.50 CHECK (rating BETWEEN 1.00 AND 5.00),
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'BLACKLISTED')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, vendor_code)
);

-- 2. Warehouses & Store Locations
CREATE TABLE IF NOT EXISTS proc_warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    warehouse_type VARCHAR(50) DEFAULT 'CENTRAL_WAREHOUSE' CHECK (warehouse_type IN ('CENTRAL_WAREHOUSE', 'PHARMACY_STORE', 'LAB_STORE', 'RADIOLOGY_STORE', 'OT_STORE', 'ICU_STORE', 'WARD_STORE', 'FACILITY_STORE')),
    location_floor VARCHAR(50),
    manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, code)
);

-- 3. Master Item Catalog
CREATE TABLE IF NOT EXISTS proc_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('MEDICINE', 'SURGICAL_CONSUMABLE', 'LAB_REAGENT', 'RADIOLOGY_CONTRAST', 'BIOMEDICAL_EQUIPMENT', 'IT_ASSET', 'FACILITY_MATERIAL', 'GENERAL_SUPPLY')),
    base_uom VARCHAR(30) NOT NULL DEFAULT 'UNIT', -- e.g. Single Tablet, Piece, Vial
    purchase_uom VARCHAR(30) NOT NULL DEFAULT 'BOX', -- e.g. Box of 100
    uom_conversion_factor DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    reorder_level INT NOT NULL DEFAULT 50 CHECK (reorder_level >= 0),
    safety_stock INT NOT NULL DEFAULT 20 CHECK (safety_stock >= 0),
    min_order_qty INT NOT NULL DEFAULT 10,
    is_asset BOOLEAN DEFAULT FALSE,
    is_batch_tracked BOOLEAN DEFAULT TRUE,
    is_serial_tracked BOOLEAN DEFAULT FALSE,
    storage_temperature_celsius VARCHAR(30) DEFAULT 'ROOM_TEMP',
    hsn_sac_code VARCHAR(30) DEFAULT '3004',
    standard_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, item_code)
);

-- 4. Stock Batches & Lots
CREATE TABLE IF NOT EXISTS proc_stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES proc_items(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES proc_warehouses(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    initial_quantity DECIMAL(12,2) NOT NULL CHECK (initial_quantity >= 0),
    current_quantity DECIMAL(12,2) NOT NULL CHECK (current_quantity >= 0),
    allocated_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (allocated_quantity >= 0),
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quality_status VARCHAR(30) DEFAULT 'ACCEPTED' CHECK (quality_status IN ('ACCEPTED', 'QUARANTINED', 'EXPIRED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, warehouse_id, item_id, batch_number)
);

-- 5. Real-Time Stock Balances
CREATE TABLE IF NOT EXISTS proc_stock_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES proc_items(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES proc_warehouses(id) ON DELETE CASCADE,
    total_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_quantity >= 0),
    available_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (available_quantity >= 0),
    reserved_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (reserved_quantity >= 0),
    quarantined_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (quarantined_quantity >= 0),
    average_unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, warehouse_id, item_id)
);

-- 6. Stock Movement & Transaction Ledger
CREATE TABLE IF NOT EXISTS proc_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    movement_number VARCHAR(50) NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('PURCHASE_RECEIPT', 'STORE_ISSUE', 'DEPARTMENT_TRANSFER', 'STORE_RETURN', 'SUPPLIER_RETURN', 'DAMAGE_DISPOSAL', 'CYCLE_COUNT_ADJUSTMENT', 'CLINICAL_CONSUMPTION')),
    item_id UUID NOT NULL REFERENCES proc_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES proc_stock_batches(id) ON DELETE SET NULL,
    from_warehouse_id UUID REFERENCES proc_warehouses(id) ON DELETE SET NULL,
    to_warehouse_id UUID REFERENCES proc_warehouses(id) ON DELETE SET NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_value DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    reference_doc_type VARCHAR(50), -- e.g. 'PO', 'GRN', 'TRANSFER_REQUEST', 'PATIENT_EMAR'
    reference_doc_id VARCHAR(100),
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchase Requisitions
CREATE TABLE IF NOT EXISTS proc_purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requisition_number VARCHAR(50) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    requesting_user_id UUID NOT NULL REFERENCES users(id),
    priority VARCHAR(30) DEFAULT 'ROUTINE' CHECK (priority IN ('ROUTINE', 'URGENT', 'STAT_EMERGENCY')),
    required_by_date DATE NOT NULL,
    total_estimated_cost DECIMAL(14,2) DEFAULT 0.00,
    purpose TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PO_CREATED', 'REJECTED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, requisition_number)
);

-- 8. Vendor Quotations & RFQ Comparison
CREATE TABLE IF NOT EXISTS proc_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requisition_id UUID NOT NULL REFERENCES proc_purchase_requisitions(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES proc_vendors(id) ON DELETE CASCADE,
    quotation_number VARCHAR(50) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(14,2) NOT NULL,
    delivery_lead_days INT NOT NULL DEFAULT 7,
    warranty_months INT DEFAULT 12,
    score DECIMAL(3,1) DEFAULT 4.5,
    status VARCHAR(30) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'SELECTED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Purchase Orders
CREATE TABLE IF NOT EXISTS proc_purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES proc_vendors(id) ON DELETE CASCADE,
    requisition_id UUID REFERENCES proc_purchase_requisitions(id) ON DELETE SET NULL,
    po_number VARCHAR(50) NOT NULL,
    po_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE NOT NULL,
    total_subtotal DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    payment_terms VARCHAR(100) DEFAULT 'NET_30',
    shipping_address TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED')),
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, po_number)
);

CREATE TABLE IF NOT EXISTS proc_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES proc_purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES proc_items(id) ON DELETE RESTRICT,
    quantity_ordered DECIMAL(12,2) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    unit_price DECIMAL(12,2) NOT NULL,
    gst_rate_percent DECIMAL(5,2) DEFAULT 12.00,
    line_total DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Goods Receipt Notes (GRN) & Quality Inspection
CREATE TABLE IF NOT EXISTS proc_goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    po_id UUID NOT NULL REFERENCES proc_purchase_orders(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES proc_vendors(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES proc_warehouses(id) ON DELETE RESTRICT,
    grn_number VARCHAR(50) NOT NULL,
    vendor_delivery_challan VARCHAR(100) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_items_count INT NOT NULL DEFAULT 1,
    receiving_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'INSPECTION_PENDING' CHECK (status IN ('INSPECTION_PENDING', 'ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, grn_number)
);

CREATE TABLE IF NOT EXISTS proc_quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    grn_id UUID NOT NULL REFERENCES proc_goods_receipt_notes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES proc_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received DECIMAL(12,2) NOT NULL,
    quantity_accepted DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quantity_rejected DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    quantity_quarantined DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    inspection_notes TEXT,
    inspector_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'PASSED' CHECK (status IN ('PASSED', 'FAILED', 'PARTIALLY_PASSED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Supplier Invoices & 3-Way Matching
CREATE TABLE IF NOT EXISTS proc_supplier_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES proc_vendors(id) ON DELETE RESTRICT,
    po_id UUID NOT NULL REFERENCES proc_purchase_orders(id) ON DELETE RESTRICT,
    grn_id UUID NOT NULL REFERENCES proc_goods_receipt_notes(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal DECIMAL(14,2) NOT NULL,
    tax_amount DECIMAL(14,2) NOT NULL,
    grand_total DECIMAL(14,2) NOT NULL,
    three_way_match_status VARCHAR(30) DEFAULT 'MATCHED' CHECK (three_way_match_status IN ('MATCHED', 'PRICE_DISCREPANCY', 'QTY_DISCREPANCY', 'PENDING')),
    payment_status VARCHAR(30) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID')),
    gl_journal_voucher_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, vendor_id, invoice_number)
);

-- 12. Fixed Assets & Biomedical Equipment Master Register
CREATE TABLE IF NOT EXISTS proc_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    asset_tag VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('BIOMEDICAL_EQUIPMENT', 'IT_HARDWARE', 'HOSPITAL_FURNITURE', 'FACILITY_INFRASTRUCTURE', 'VEHICLE')),
    item_id UUID REFERENCES proc_items(id) ON DELETE SET NULL,
    serial_number VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    model VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    location_room VARCHAR(100) NOT NULL,
    purchase_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    purchase_date DATE NOT NULL,
    warranty_expiry_date DATE,
    operational_status VARCHAR(30) DEFAULT 'OPERATIONAL' CHECK (operational_status IN ('OPERATIONAL', 'MAINTENANCE_REQUIRED', 'UNDER_REPAIR', 'CALIBRATION_OVERDUE', 'DECOMMISSIONED')),
    last_calibration_date DATE,
    next_calibration_due DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, asset_tag)
);

-- 13. Preventive Maintenance Schedules & Calibration
CREATE TABLE IF NOT EXISTS proc_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES proc_assets(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) DEFAULT 'PPM_PREVENTIVE' CHECK (maintenance_type IN ('PPM_PREVENTIVE', 'CALIBRATION', 'ELECTRICAL_SAFETY', 'STATUTORY_INSPECTION')),
    frequency_days INT NOT NULL DEFAULT 90,
    last_performed_date DATE,
    next_due_date DATE NOT NULL,
    assigned_engineer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Corrective Breakdown Work Orders
CREATE TABLE IF NOT EXISTS proc_work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) NOT NULL,
    asset_id UUID NOT NULL REFERENCES proc_assets(id) ON DELETE CASCADE,
    reported_by_user_id UUID NOT NULL REFERENCES users(id),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    priority VARCHAR(30) DEFAULT 'HIGH' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL_BREAKDOWN')),
    assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    spare_parts_cost DECIMAL(12,2) DEFAULT 0.00,
    downtime_hours DECIMAL(6,2) DEFAULT 0.00,
    return_to_service_certified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_SPARE_PARTS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, work_order_number)
);

-- 15. Vendor Contracts & Warranties
CREATE TABLE IF NOT EXISTS proc_service_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES proc_vendors(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'AMC' CHECK (contract_type IN ('AMC', 'CMC', 'WARRANTY', 'FACILITY_MAINTENANCE')),
    covered_assets_count INT DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    annual_cost DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    terms TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, contract_number)
);

-- ============================================================
-- Row-Level Security (RLS) & Indexes
-- ============================================================
ALTER TABLE proc_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE proc_service_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY proc_vendors_isolation ON proc_vendors USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_warehouses_isolation ON proc_warehouses USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_items_isolation ON proc_items USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_stock_batches_isolation ON proc_stock_batches USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_stock_balances_isolation ON proc_stock_balances USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_stock_movements_isolation ON proc_stock_movements USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_purchase_requisitions_isolation ON proc_purchase_requisitions USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_quotations_isolation ON proc_quotations USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_purchase_orders_isolation ON proc_purchase_orders USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_goods_receipt_notes_isolation ON proc_goods_receipt_notes USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_quality_inspections_isolation ON proc_quality_inspections USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_supplier_invoices_isolation ON proc_supplier_invoices USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_assets_isolation ON proc_assets USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_maintenance_schedules_isolation ON proc_maintenance_schedules USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_work_orders_isolation ON proc_work_orders USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);
CREATE POLICY proc_service_contracts_isolation ON proc_service_contracts USING (hospital_id = current_setting('app.current_hospital_id', true)::uuid);

CREATE INDEX IF NOT EXISTS idx_proc_stock_batches_exp ON proc_stock_batches(hospital_id, expiry_date, quality_status);
CREATE INDEX IF NOT EXISTS idx_proc_stock_movements_item ON proc_stock_movements(hospital_id, item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_proc_po_vendor ON proc_purchase_orders(hospital_id, vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_proc_assets_status ON proc_assets(hospital_id, department_id, operational_status);
CREATE INDEX IF NOT EXISTS idx_proc_work_orders_asset ON proc_work_orders(hospital_id, asset_id, status);

