-- ============================================================
-- ASRTAVA HMS - Migration 021: Enterprise Hospital Group, Branch Management & Centralized Operations
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enterprise Healthcare Organizations (Hospital Groups & Chains)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS enterprise_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'GRP-APEX-GLOBAL'
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    tax_identification_number VARCHAR(100), -- GSTIN / Corporate CIN
    hq_address TEXT,
    hq_city VARCHAR(100),
    hq_state VARCHAR(100),
    hq_country VARCHAR(100) DEFAULT 'India',
    hq_pincode VARCHAR(20),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    license_id UUID REFERENCES software_licenses(id),
    tier VARCHAR(50) DEFAULT 'enterprise_chain' CHECK (tier IN ('independent_multi_branch', 'regional_network', 'enterprise_chain', 'government_directorate')),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. Configurable Organizational Hierarchy Nodes (DAG Structure)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organization_hierarchy_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES organization_hierarchy_nodes(id) ON DELETE RESTRICT,
    node_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('organization', 'region', 'hospital', 'branch', 'clinic', 'department', 'unit')),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, node_code)
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON organization_hierarchy_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_org ON organization_hierarchy_nodes(organization_id);

-- ------------------------------------------------------------
-- 3. Centralized Staff Workplace Assignments (Multi-Facility Roles)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS staff_workplace_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE CASCADE,
    department_id UUID,
    assignment_type VARCHAR(30) NOT NULL DEFAULT 'primary' CHECK (assignment_type IN ('primary', 'secondary', 'temporary', 'visiting')),
    is_primary BOOLEAN DEFAULT FALSE,
    designation VARCHAR(150),
    role_key VARCHAR(50) NOT NULL, -- e.g. 'doctor', 'nurse', 'hospital_admin', 'group_admin'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_assignment_user ON staff_workplace_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignment_hosp ON staff_workplace_assignments(hospital_id);

-- ------------------------------------------------------------
-- 4. Enterprise Master Patient Identity & Cross-Hospital Links
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS enterprise_patient_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    enterprise_patient_id VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'EMPI-2026-0001'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(10),
    national_id_hash VARCHAR(128), -- SHA-256 hashed Aadhaar/National ID for DPDP privacy
    primary_phone VARCHAR(30) NOT NULL,
    primary_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empi_org ON enterprise_patient_identities(organization_id);
CREATE INDEX IF NOT EXISTS idx_empi_phone ON enterprise_patient_identities(primary_phone);

CREATE TABLE IF NOT EXISTS patient_identity_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enterprise_patient_id UUID NOT NULL REFERENCES enterprise_patient_identities(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    local_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    local_uhid VARCHAR(50) NOT NULL,
    link_confidence VARCHAR(30) DEFAULT 'exact_match' CHECK (link_confidence IN ('exact_match', 'verified_by_staff', 'probabilistic')),
    consent_granted BOOLEAN DEFAULT TRUE,
    consent_granted_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by UUID REFERENCES users(id),
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (hospital_id, local_patient_id)
);

-- ------------------------------------------------------------
-- 5. Cross-Hospital Clinical Transfers & Patient Referrals
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cross_hospital_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    enterprise_patient_id UUID REFERENCES enterprise_patient_identities(id) ON DELETE SET NULL,
    from_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    from_branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    to_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    to_branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('emergency', 'specialist_care', 'icu_stepdown', 'bed_capacity', 'patient_request')),
    reason TEXT NOT NULL,
    clinical_summary TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'initiated' CHECK (status IN ('initiated', 'accepted', 'dispatched', 'received', 'rejected', 'cancelled')),
    initiated_by UUID NOT NULL REFERENCES users(id),
    accepted_by UUID REFERENCES users(id),
    transfer_timestamp TIMESTAMPTZ DEFAULT NOW(),
    arrival_timestamp TIMESTAMPTZ,
    audit_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cross_hospital_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    referring_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    referring_doctor_id UUID NOT NULL REFERENCES users(id),
    receiving_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    receiving_specialty VARCHAR(100) NOT NULL,
    referred_doctor_id UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    provisional_diagnosis TEXT,
    clinical_notes TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'consulted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. Multi-Branch Doctor Schedules & Anti-Collision Engine
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS doctor_branch_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 15 CHECK (slot_duration_minutes IN (10, 15, 20, 30, 45, 60)),
    room_number VARCHAR(50),
    max_patients INT DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_sched_doc_day ON doctor_branch_schedules(doctor_id, day_of_week);

-- ------------------------------------------------------------
-- 7. Inter-Branch Stock Transfers (Centralized Inventory)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inter_branch_stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    transfer_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'STK-TRF-2026-001'
    source_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    source_branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    destination_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    destination_branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_transferred INT NOT NULL CHECK (quantity_transferred > 0),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'dispatched', 'in_transit', 'received', 'rejected')),
    dispatched_by UUID REFERENCES users(id),
    dispatched_at TIMESTAMPTZ,
    received_by UUID REFERENCES users(id),
    received_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8. Inter-Branch Financial Transactions & Accounting
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inter_branch_financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    transaction_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'TX-FIN-2026-01'
    debited_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    credited_hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'INR',
    category VARCHAR(50) NOT NULL CHECK (category IN ('shared_service', 'patient_transfer_charge', 'stock_reimbursement', 'management_fee')),
    reference_document_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'settled', 'disputed')),
    authorized_by UUID REFERENCES users(id),
    settled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. Enterprise License Branch Allocations & Location Quotas
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS license_branch_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES software_licenses(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES hospital_branches(id) ON DELETE SET NULL,
    allocated_beds INT DEFAULT 50,
    allocated_modules JSONB NOT NULL DEFAULT '[]',
    activation_key VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

