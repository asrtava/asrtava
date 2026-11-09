-- ============================================================
-- ASRTAVA - System Seed Data
-- ============================================================

-- 1. Default System Permissions
INSERT INTO permissions (module, sub_module, action, resource, description) VALUES
-- Platform & Admin
('platform', 'hospitals', 'manage', 'all', 'Full platform management of hospitals'),
('hospital', 'settings', 'manage', 'all', 'Configure hospital profiles and settings'),
('users', 'management', 'manage', 'all', 'Create and configure hospital users'),
('roles', 'permissions', 'manage', 'all', 'Manage and approve roles and permissions'),

-- Clinical
('patients', 'records', 'view', 'patient', 'View patient demographics and records'),
('patients', 'records', 'create', 'patient', 'Register new patients'),
('patients', 'records', 'edit', 'patient', 'Update patient information'),
('appointments', 'booking', 'create', 'appointment', 'Schedule appointments'),
('appointments', 'booking', 'view', 'appointment', 'View appointment schedule'),
('clinical', 'consultation', 'create', 'consultation', 'Conduct patient consultations'),
('clinical', 'vitals', 'create', 'vitals', 'Record and update patient vitals'),
('clinical', 'prescription', 'create', 'prescription', 'Write electronic prescriptions'),
('inpatient', 'admission', 'manage', 'admission', 'Admit, transfer and discharge patients'),
('inpatient', 'nursing', 'create', 'nursing_notes', 'Record nursing assessments and MAR'),

-- Diagnostics
('laboratory', 'orders', 'view', 'lab_order', 'View lab requests and test queue'),
('laboratory', 'results', 'create', 'lab_result', 'Enter laboratory test results'),
('laboratory', 'results', 'approve', 'lab_result', 'Verify and sign off laboratory reports'),
('radiology', 'imaging', 'create', 'radiology_report', 'Prepare and approve radiology reports'),

-- Ancillary & Operational
('pharmacy', 'dispensing', 'create', 'sale', 'Dispense prescriptions and sell medicines'),
('pharmacy', 'inventory', 'manage', 'stock', 'Manage batches, stock and suppliers'),
('billing', 'invoices', 'create', 'invoice', 'Generate hospital invoices'),
('billing', 'payments', 'create', 'payment', 'Collect payments from patients'),
('billing', 'refunds', 'approve', 'refund', 'Authorize and process refunds'),
('hr', 'roster', 'manage', 'staff', 'Manage shifts, schedules and staff duty rosters'),
('inventory', 'procurement', 'manage', 'po', 'Manage inventory requisitions and POs')
ON CONFLICT (module, sub_module, action, resource) DO NOTHING;

-- 2. Default System Roles
INSERT INTO roles (name, code, description, is_system_role) VALUES
('Super Administrator', 'super_admin', 'Full platform administrator with global controls', TRUE),
('Hospital Owner', 'hospital_owner', 'Full administrative authority over hospital tenant', TRUE),
('Hospital Administrator', 'hospital_admin', 'Operational manager of hospital operations and staff', TRUE),
('Doctor / Consultant', 'doctor', 'Attending physician conducting consultations and procedures', TRUE),
('Staff Nurse', 'nurse', 'Inpatient ward nurse managing vitals, MAR, and care notes', TRUE),
('Receptionist', 'receptionist', 'Front office executive managing queue, appointments and intake', TRUE),
('Pharmacist', 'pharmacist', 'Pharmacy technician dispensing drugs and tracking batches', TRUE),
('Pathologist / Lab Tech', 'lab_tech', 'Diagnostics staff handling sample processing and results', TRUE),
('Radiologist', 'radiologist', 'Imaging specialist producing scan and X-Ray interpretations', TRUE),
('Billing Executive', 'billing_exec', 'Cashier collecting fees and issuing receipts', TRUE),
('Accountant', 'accountant', 'Finance controller overseeing reconciliations and refunds', TRUE),
('HR Manager', 'hr_manager', 'Human resources officer managing rosters and staff files', TRUE),
('Inventory Manager', 'inventory_manager', 'Materials supervisor managing procurement and stock', TRUE),
('Patient', 'patient', 'Patient self-service portal user', TRUE)
ON CONFLICT (hospital_id, code) DO NOTHING;

-- 3. Initial Super Admin Account (Password: Admin@123456 -> bcrypt hash)
INSERT INTO users (email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'admin@asrtava.com',
    '$2a$12$e8wF2eE8fN8e2rC1h9k3/.bWqTz8Oa8xLkJn4sI5wP0xV6qR9Yw7G',
    'ASRTAVA',
    'Platform Admin',
    'super_admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 4. Demo Hospital Provisioning
INSERT INTO hospitals (id, name, code, city, state, subscription_plan, subscription_status)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Apex Care Multi-Specialty Hospital',
    'APEX-001',
    'Bengaluru',
    'Karnataka',
    'enterprise',
    'active'
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO hospital_settings (hospital_id, currency, timezone, tax_enabled, default_tax_rate)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'INR',
    'Asia/Kolkata',
    TRUE,
    18.00
)
ON CONFLICT (hospital_id) DO NOTHING;

-- Demo Hospital Admin
INSERT INTO users (hospital_id, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'director@apexcare.com',
    '$2a$12$e8wF2eE8fN8e2rC1h9k3/.bWqTz8Oa8xLkJn4sI5wP0xV6qR9Yw7G',
    'Dr. Rajesh',
    'Sharma',
    'hospital_admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Demo Doctor
INSERT INTO users (hospital_id, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'dr.ananya@apexcare.com',
    '$2a$12$e8wF2eE8fN8e2rC1h9k3/.bWqTz8Oa8xLkJn4sI5wP0xV6qR9Yw7G',
    'Dr. Ananya',
    'Iyer',
    'staff',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

