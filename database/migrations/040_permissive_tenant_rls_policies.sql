-- ============================================================================
-- ASRTAVA Hospital Management System
-- 040_permissive_tenant_rls_policies.sql
-- Replace restrictive RLS policies with standard permissive policies
-- Supports global system roles and platform super admin accounts
-- ============================================================================

DO $$
DECLARE
    tenant_table TEXT;
    tenant_tables TEXT[] := ARRAY[
        'users',
        'hospital_settings',
        'departments',
        'roles',
        'audit_logs',
        'patients',
        'patient_emergency_contacts',
        'doctors',
        'staff',
        'appointments',
        'opd_consultations',
        'inpatient_admissions',
        'wards',
        'beds',
        'prescriptions',
        'prescription_items',
        'pharmacy_medicines',
        'inventory_items',
        'lab_orders',
        'radiology_orders',
        'invoices',
        'invoice_items',
        'payments',
        'documents',
        'notifications'
    ];
BEGIN
    FOREACH tenant_table IN ARRAY tenant_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tenant_table) THEN
            -- Drop existing restrictive policy
            EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I;', tenant_table, tenant_table);

            IF tenant_table IN ('opd_consultations', 'prescriptions', 'prescription_items', 'lab_orders', 'radiology_orders') THEN
                -- High-privacy clinical records: JIT grant required for Super Admin
                EXECUTE format('
                    CREATE POLICY %I_tenant_isolation ON public.%I
                    AS PERMISSIVE
                    USING (
                        (app.is_super_admin() = true AND app.has_clinical_jit_grant() = true)
                        OR
                        (hospital_id = app.get_current_tenant_id())
                    )
                    WITH CHECK (
                        (app.is_super_admin() = true AND app.has_clinical_jit_grant() = true)
                        OR
                        (hospital_id = app.get_current_tenant_id())
                    );
                ', tenant_table, tenant_table);
            ELSIF tenant_table = 'roles' THEN
                -- System roles have hospital_id IS NULL and is_system_role = true
                EXECUTE format('
                    CREATE POLICY roles_tenant_isolation ON public.roles
                    AS PERMISSIVE
                    USING (
                        app.is_super_admin() = true
                        OR
                        hospital_id = app.get_current_tenant_id()
                        OR
                        (hospital_id IS NULL AND is_system_role = true)
                    )
                    WITH CHECK (
                        app.is_super_admin() = true
                        OR
                        hospital_id = app.get_current_tenant_id()
                        OR
                        (hospital_id IS NULL AND is_system_role = true)
                    );
                ');
            ELSIF tenant_table = 'users' THEN
                -- Platform Super Admin users have hospital_id IS NULL and user_type = ''super_admin''
                EXECUTE format('
                    CREATE POLICY users_tenant_isolation ON public.users
                    AS PERMISSIVE
                    USING (
                        app.is_super_admin() = true
                        OR
                        hospital_id = app.get_current_tenant_id()
                        OR
                        (hospital_id IS NULL AND user_type = ''super_admin'')
                    )
                    WITH CHECK (
                        app.is_super_admin() = true
                        OR
                        hospital_id = app.get_current_tenant_id()
                        OR
                        (hospital_id IS NULL AND user_type = ''super_admin'')
                    );
                ');
            ELSE
                -- Standard operational tables
                EXECUTE format('
                    CREATE POLICY %I_tenant_isolation ON public.%I
                    AS PERMISSIVE
                    USING (
                        app.is_super_admin() = true
                        OR
                        hospital_id = app.get_current_tenant_id()
                    )
                    WITH CHECK (
                        app.is_super_admin() = true
                        OR
                        hospital_id = app.get_current_tenant_id()
                    );
                ', tenant_table, tenant_table);
            END IF;
        END IF;
    END LOOP;
END $$;
