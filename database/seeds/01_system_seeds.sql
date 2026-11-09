-- ============================================================
-- ASRTAVA HMS - System Seeds & Default Configuration
-- ============================================================

-- 1. SaaS Subscription Plans
INSERT INTO subscription_plans (id, plan_code, name, description, monthly_price_inr, annual_price_inr, max_active_staff_users, max_monthly_patients, max_branches, includes_whatsapp_api, includes_pacs_dicom, includes_advanced_analytics)
VALUES
('b1000000-0000-0000-0000-000000000001', 'basic', 'ASRTAVA Starter', 'Essential HMS for single clinics & nursing homes', 4999.00, 49990.00, 20, 1000, 1, FALSE, FALSE, FALSE),
('b1000000-0000-0000-0000-000000000002', 'professional', 'ASRTAVA Multi-Specialty', 'Complete clinical, pharmacy & diagnostic suite', 14999.00, 149990.00, 100, 10000, 3, TRUE, FALSE, TRUE),
('b1000000-0000-0000-0000-000000000003', 'enterprise', 'ASRTAVA Hospital Network', 'Unlimited scale with PACS/DICOM, multi-branch & DPDP compliance', 34999.00, 349990.00, 500, 50000, 10, TRUE, TRUE, TRUE)
ON CONFLICT (plan_code) DO NOTHING;

-- 2. System Permissions Catalog
INSERT INTO permissions (id, module, sub_module, action, resource, description) VALUES
-- Platform Administration
('c1000000-0000-0000-0000-000000000001', 'platform', 'tenants', 'manage', 'all', 'Onboard, suspend and configure hospital tenants'),
('c1000000-0000-0000-0000-000000000002', 'platform', 'subscriptions', 'manage', 'all', 'Manage SaaS plans and platform billing'),
('c1000000-0000-0000-0000-000000000003', 'platform', 'support', 'approve', 'all', 'Request and approve emergency support sessions'),

-- Hospital Administration
('c1000000-0000-0000-0000-000000000010', 'hospital', 'profile', 'edit', 'all', 'Edit hospital branding, address and license details'),
('c1000000-0000-0000-0000-000000000011', 'hospital', 'departments', 'manage', 'all', 'Configure departments and branch assignments'),
('c1000000-0000-0000-0000-000000000012', 'users', 'staff', 'manage', 'all', 'Create, activate, deactivate and assign staff users'),
('c1000000-0000-0000-0000-000000000013', 'roles', 'permissions', 'manage', 'all', 'Configure role templates and assign roles'),
('c1000000-0000-0000-0000-000000000014', 'permissions', 'custom', 'approve', 'all', 'Authorize individual custom permission overrides'),

-- Reception & Front Desk
('c1000000-0000-0000-0000-000000000020', 'patients', 'registration', 'create', 'all', 'Register new patients and issue MRNs'),
('c1000000-0000-0000-0000-000000000021', 'patients', 'records', 'view', 'all', 'Search and view patient demographic records'),
('c1000000-0000-0000-0000-000000000022', 'appointments', 'booking', 'create', 'all', 'Schedule and reschedule appointments'),
('c1000000-0000-0000-0000-000000000023', 'appointments', 'queue', 'manage', 'all', 'Check in patients and issue OPD tokens'),

-- Doctor & Clinical
('c1000000-0000-0000-0000-000000000030', 'clinical', 'consultation', 'create', 'own', 'Record clinical consultations and SOAP notes'),
('c1000000-0000-0000-0000-000000000031', 'clinical', 'vitals', 'view', 'all', 'Inspect patient vital signs and timeline'),
('c1000000-0000-0000-0000-000000000032', 'clinical', 'prescription', 'create', 'own', 'Author electronic prescriptions'),
('c1000000-0000-0000-0000-000000000033', 'clinical', 'history', 'view', 'all', 'Review patient allergies and longitudinal EMR'),

-- Nursing & Inpatient
('c1000000-0000-0000-0000-000000000040', 'inpatient', 'admissions', 'manage', 'all', 'Process patient intake, bed transfers and discharge summaries'),
('c1000000-0000-0000-0000-000000000041', 'inpatient', 'vitals', 'create', 'all', 'Record hourly/shift patient vitals'),
('c1000000-0000-0000-0000-000000000042', 'inpatient', 'nursing_notes', 'create', 'all', 'Log nurse clinical observations and handovers'),
('c1000000-0000-0000-0000-000000000043', 'inpatient', 'mar', 'edit', 'all', 'Administer doses on Medication Administration Record'),

-- Pharmacy
('c1000000-0000-0000-0000-000000000050', 'pharmacy', 'dispensing', 'create', 'all', 'Dispense prescriptions and conduct OTC sales'),
('c1000000-0000-0000-0000-000000000051', 'pharmacy', 'batches', 'manage', 'all', 'Manage batch inventory, MRP and expiry write-offs'),
('c1000000-0000-0000-0000-000000000052', 'pharmacy', 'procurement', 'create', 'all', 'Raise purchase orders to pharmaceutical suppliers'),

-- Laboratory & Radiology
('c1000000-0000-0000-0000-000000000060', 'laboratory', 'specimens', 'manage', 'all', 'Collect and barcode biological specimens'),
('c1000000-0000-0000-0000-000000000061', 'laboratory', 'results', 'create', 'all', 'Enter diagnostic analyzer test values'),
('c1000000-0000-0000-0000-000000000062', 'laboratory', 'results', 'approve', 'all', 'Pathologist digital sign-off and release'),
('c1000000-0000-0000-0000-000000000063', 'radiology', 'reports', 'create', 'all', 'Prepare and approve radiology imaging reports'),

-- Billing & Financials
('c1000000-0000-0000-0000-000000000070', 'billing', 'invoices', 'create', 'all', 'Generate OPD and IPD consolidated invoices'),
('c1000000-0000-0000-0000-000000000071', 'billing', 'payments', 'create', 'all', 'Collect payments and issue formal receipts'),
('c1000000-0000-0000-0000-000000000072', 'billing', 'refunds', 'approve', 'all', 'Review and disburse financial refunds'),
('c1000000-0000-0000-0000-000000000073', 'finance', 'reports', 'export', 'all', 'Export GST reconciliations and collections reports')
ON CONFLICT (module, sub_module, action, resource) DO NOTHING;

-- 3. Standard Roles
INSERT INTO roles (id, name, code, description, is_system_role, is_active) VALUES
('d1000000-0000-0000-0000-000000000001', 'Platform Super Administrator', 'super_admin', 'Full platform operational controls', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000002', 'Hospital Owner', 'hospital_owner', 'Full tenant management and financial authority', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000003', 'Hospital Administrator', 'hospital_admin', 'General hospital operations, staff and permissions management', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000004', 'Attending Physician / Doctor', 'doctor', 'Clinical consultations, prescriptions and diagnoses', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000005', 'Staff Nurse', 'nurse', 'Inpatient care, vitals, nursing notes and MAR administration', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000006', 'Receptionist', 'receptionist', 'Patient intake, appointment booking and queue token issuance', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000007', 'Pharmacist', 'pharmacist', 'Medicine dispensing, batch tracking and POS sales', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000008', 'Billing Executive', 'billing_executive', 'Invoice generation, cashiering and payment collection', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000009', 'Accountant', 'accountant', 'Ledger reconciliations, refund disbursements and GST reports', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000010', 'Laboratory Staff', 'lab_staff', 'Specimen intake, analyzer result entry and pathologist review', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000011', 'Radiology Staff', 'radiology_staff', 'Imaging procedure management and diagnostic reporting', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000012', 'HR Manager', 'hr_manager', 'Employee onboarding, shift rosters and attendance oversight', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000013', 'Inventory Manager', 'inventory_manager', 'Central store, vendor purchase orders and goods receipt notes', TRUE, TRUE),
('d1000000-0000-0000-0000-000000000014', 'Department Manager', 'department_manager', 'Departmental supervisor with oversight of duty and queue loads', TRUE, TRUE)
ON CONFLICT (hospital_id, code) DO NOTHING;

-- Map Standard Roles to Permissions
-- Doctor Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd1000000-0000-0000-0000-000000000004', id
FROM permissions
WHERE module IN ('clinical', 'patients')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Nurse Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd1000000-0000-0000-0000-000000000005', id
FROM permissions
WHERE module IN ('inpatient', 'clinical') AND action IN ('view', 'create', 'edit')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Receptionist Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd1000000-0000-0000-0000-000000000006', id
FROM permissions
WHERE module IN ('patients', 'appointments')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Pharmacist Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd1000000-0000-0000-0000-000000000007', id
FROM permissions
WHERE module = 'pharmacy'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Billing Executive Role Permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd1000000-0000-0000-0000-000000000008', id
FROM permissions
WHERE module = 'billing' AND action IN ('create', 'view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Initial Platform Super Admin Account (Email: admin@asrtava.com, Password: Admin@123456)
INSERT INTO users (id, hospital_id, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'e1000000-0000-0000-0000-000000000001',
    NULL,
    'admin@asrtava.com',
    '$2a$12$e8wF2eE8fN8e2rC1h9k3/.bWqTz8Oa8xLkJn4sI5wP0xV6qR9Yw7G',
    'ASRTAVA',
    'Platform Admin',
    'super_admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, hospital_id)
VALUES ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 5. Demonstration Hospital Environment
-- Hospital Tenant
INSERT INTO hospitals (id, code, name, legal_name, city, state, country, subscription_plan, subscription_status)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'APEX-BLR',
    'Apex Care Multi-Specialty Hospital',
    'Apex Healthcare Private Limited',
    'Bengaluru',
    'Karnataka',
    'India',
    'enterprise',
    'active'
)
ON CONFLICT (code) DO NOTHING;

-- Hospital Settings
INSERT INTO hospital_settings (hospital_id, currency, timezone, tax_enabled, default_tax_rate, appointment_slot_duration)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'INR',
    'Asia/Kolkata',
    TRUE,
    18.00,
    15
)
ON CONFLICT (hospital_id) DO NOTHING;

-- Departments
INSERT INTO departments (id, hospital_id, name, code, department_type, display_order)
VALUES
('f1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'General Medicine', 'GEN-MED', 'clinical', 1),
('f1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Cardiology', 'CARDIO', 'clinical', 2),
('f1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Pediatrics', 'PEDIA', 'clinical', 3),
('f1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Emergency & Trauma', 'EMERGENCY', 'emergency', 4),
('f1000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Pathology & Laboratory', 'LAB', 'diagnostic', 5),
('f1000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Inpatient Pharmacy', 'PHARMACY', 'pharmacy', 6)
ON CONFLICT (hospital_id, name) DO NOTHING;

-- Demo Hospital Admin
INSERT INTO users (id, hospital_id, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'e1000000-0000-0000-0000-000000000002',
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

INSERT INTO user_roles (user_id, role_id, hospital_id)
VALUES ('e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Demo Doctor
INSERT INTO users (id, hospital_id, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'e1000000-0000-0000-0000-000000000003',
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

INSERT INTO user_roles (user_id, role_id, hospital_id)
VALUES ('e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO doctors (id, user_id, hospital_id, department_id, employee_number, specialization, qualification, experience_years, consultation_fee)
VALUES (
    '71000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000003',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'f1000000-0000-0000-0000-000000000001',
    'DOC-001',
    'Internal Medicine & Critical Care',
    'MBBS, MD (General Medicine)',
    11,
    750.00
)
ON CONFLICT (user_id) DO NOTHING;

-- Demo Receptionist
INSERT INTO users (id, hospital_id, email, password_hash, first_name, last_name, user_type, is_active, is_email_verified)
VALUES (
    'e1000000-0000-0000-0000-000000000004',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'reception@apexcare.com',
    '$2a$12$e8wF2eE8fN8e2rC1h9k3/.bWqTz8Oa8xLkJn4sI5wP0xV6qR9Yw7G',
    'Sunita',
    'Nair',
    'staff',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, hospital_id)
VALUES ('e1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Demo Patient
INSERT INTO patients (id, hospital_id, patient_number, first_name, last_name, date_of_birth, gender, blood_group, phone, email, city)
VALUES (
    '81000000-0000-0000-0000-000000000001',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'PAT-00001',
    'Ramesh',
    'Verma',
    '1981-04-12',
    'male',
    'B+',
    '+919876543210',
    'ramesh.verma@example.com',
    'Bengaluru'
)
ON CONFLICT (hospital_id, patient_number) DO NOTHING;

