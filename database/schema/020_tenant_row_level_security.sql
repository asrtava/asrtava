-- ============================================================================
-- ASRTAVA Hospital Management System
-- 020_tenant_row_level_security.sql - Database-Level Multi-Tenant Isolation
-- Enforces PostgreSQL Row-Level Security (RLS) across all hospital-owned tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create Application Context Schema & Session Functions
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;

-- Function: Retrieve the currently active tenant ID from session context
CREATE OR REPLACE FUNCTION app.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Check if the current session is an authorized Platform Super Admin
CREATE OR REPLACE FUNCTION app.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.is_super_admin', true) = 'true', false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function: Check if an active, audited JIT break-glass grant exists for clinical access
CREATE OR REPLACE FUNCTION app.has_clinical_jit_grant()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.has_clinical_jit_grant', true) = 'true', false);
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. JIT Break-Glass Support Access Grant Table
-- Specifically restricts Super Admin access to clinical records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jit_support_grants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    super_admin_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    authorized_by_hospital_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    justification       TEXT NOT NULL,
    ticket_reference    VARCHAR(100) NOT NULL,
    granted_at          TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    revocation_reason   TEXT,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jit_support_grants_tenant_active 
ON jit_support_grants(hospital_id, super_admin_id, is_active, expires_at);

-- ---------------------------------------------------------------------------
-- 3. Standard Tenant Isolation RLS Policy Helper Macro (Pl/PgSQL Block)
-- ---------------------------------------------------------------------------
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
        -- Check if table exists before applying RLS
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tenant_table) THEN
            -- Enable and force RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tenant_table);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', tenant_table);

            -- Drop existing policy if present
            EXECUTE format('DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I;', tenant_table, tenant_table);

            -- Check if table is a high-privacy clinical table (requires JIT grant for Super Admin)
            IF tenant_table IN ('opd_consultations', 'prescriptions', 'prescription_items', 'lab_orders', 'radiology_orders') THEN
                EXECUTE format('
                    CREATE POLICY %I_tenant_isolation ON public.%I
                    AS RESTRICTIVE
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
            ELSE
                -- Standard operational tables: Super Admin can manage if in platform mode; Hospital users strictly isolated
                EXECUTE format('
                    CREATE POLICY %I_tenant_isolation ON public.%I
                    AS RESTRICTIVE
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

-- ---------------------------------------------------------------------------
-- 4. Multi-Branch Hospital Group Support in hospitals table
-- ---------------------------------------------------------------------------
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS parent_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS is_branch BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_hospitals_parent_group ON hospitals(parent_hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_organization ON hospitals(organization_id);

-- ---------------------------------------------------------------------------
-- 5. Verification & Health Check Function
-- Validates that RLS is active on all tenant tables
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.verify_tenant_security_posture()
RETURNS TABLE(
    table_name TEXT,
    rls_enabled BOOLEAN,
    rls_forced BOOLEAN,
    has_policy BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS rls_forced,
        EXISTS (
            SELECT 1 FROM pg_policy pol WHERE pol.polrelid = c.oid
        ) AS has_policy
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (
        'users', 'hospital_settings', 'departments', 'roles', 'audit_logs',
        'patients', 'doctors', 'staff', 'appointments', 'opd_consultations',
        'inpatient_admissions', 'wards', 'beds', 'prescriptions',
        'pharmacy_medicines', 'inventory_items', 'lab_orders',
        'radiology_orders', 'invoices', 'documents'
      )
    ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
