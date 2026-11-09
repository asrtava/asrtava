-- ============================================================
-- ASRTAVA HMS - Security Functions, Permission Resolution & Row-Level Security
-- ============================================================

-- 1. Session Context Resolution Function
CREATE OR REPLACE FUNCTION current_app_tenant() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Hybrid Permission Engine Evaluation Function
-- Checks if p_user_id has permission for p_module, p_action, p_resource
-- Precedence: Explicit Deny > Explicit Allow > Role Permission > Default Deny
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_module VARCHAR,
    p_action VARCHAR,
    p_resource VARCHAR DEFAULT 'all'
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_type VARCHAR;
    v_is_active BOOLEAN;
    v_hospital_id UUID;
    v_explicit_override BOOLEAN;
    v_role_count INT;
BEGIN
    -- Verify User exists, is active and determine tenant
    SELECT user_type, is_active, hospital_id
    INTO v_user_type, v_is_active, v_hospital_id
    FROM users
    WHERE id = p_user_id;

    IF NOT FOUND OR v_is_active = FALSE THEN
        RETURN FALSE;
    END IF;

    -- Platform Super Admin bypasses operational permissions
    IF v_user_type = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- Ensure operation matches current tenant session
    IF v_hospital_id IS DISTINCT FROM current_app_tenant() AND current_setting('app.is_super_admin', true) != 'true' THEN
        RETURN FALSE;
    END IF;

    -- STEP 1: Check Individual User Permission Override
    -- Note: Explicit Deny (is_granted = FALSE) immediately returns FALSE
    SELECT up.is_granted
    INTO v_explicit_override
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND up.hospital_id = v_hospital_id
      AND p.module = p_module
      AND p.action = p_action
      AND (p.resource = p_resource OR p.resource = 'all')
      AND (up.expires_at IS NULL OR up.expires_at > NOW());

    IF FOUND THEN
        IF v_explicit_override = FALSE THEN
            -- Explicit Deny takes absolute precedence
            RETURN FALSE;
        ELSE
            -- Explicit Allow granted
            RETURN TRUE;
        END IF;
    END IF;

    -- STEP 2: Check Role-Based Access Control (RBAC)
    SELECT COUNT(*)
    INTO v_role_count
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND (r.hospital_id = v_hospital_id OR r.is_system_role = TRUE)
      AND r.is_active = TRUE
      AND p.module = p_module
      AND p.action = p_action
      AND (p.resource = p_resource OR p.resource = 'all');

    IF v_role_count > 0 THEN
        RETURN TRUE;
    END IF;

    -- Default Deny
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Row-Level Security (RLS) Policy Assignment Across All Tenant Tables
DO $$
DECLARE
    t text;
    tenant_tables text[] := ARRAY[
        'hospital_settings',
        'hospital_branches',
        'hospital_tax_rates',
        'departments',
        'doctors',
        'doctor_schedules',
        'staff_profiles',
        'user_roles',
        'user_permissions',
        'permission_approval_logs',
        'user_sessions',
        'patients',
        'patient_dependents',
        'patient_allergies',
        'patient_medical_histories',
        'patient_emergency_contacts',
        'patient_insurance_policies',
        'appointments',
        'consultations',
        'consultation_vitals',
        'clinical_diagnoses',
        'prescriptions',
        'prescription_items',
        'wards',
        'rooms',
        'beds',
        'admissions',
        'bed_allocations',
        'nursing_notes',
        'medication_administration_records',
        'medicine_categories',
        'medicines',
        'suppliers',
        'pharmacy_batches',
        'pharmacy_stock_movements',
        'pharmacy_dispensings',
        'pharmacy_dispense_items',
        'purchase_orders',
        'purchase_order_items',
        'goods_receipt_notes',
        'lab_test_catalog',
        'lab_orders',
        'lab_order_items',
        'lab_specimens',
        'lab_results',
        'radiology_procedures',
        'radiology_orders',
        'radiology_reports',
        'invoices',
        'invoice_items',
        'payments',
        'refunds',
        'financial_transactions',
        'audit_logs',
        'patient_documents',
        'patient_consents',
        'notifications',
        'whatsapp_message_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
            EXECUTE format('
                CREATE POLICY tenant_isolation_policy ON %I
                FOR ALL
                USING (
                    hospital_id = current_app_tenant()
                    OR current_setting(''app.is_super_admin'', true) = ''true''
                )
                WITH CHECK (
                    hospital_id = current_app_tenant()
                    OR current_setting(''app.is_super_admin'', true) = ''true''
                );
            ', t);
        END IF;
    END LOOP;
END;
$$;

