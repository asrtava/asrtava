-- ============================================================
-- ASRTAVA - PostgreSQL Row-Level Security (RLS) Policies
-- True Database-Level Tenant Isolation
-- ============================================================

-- Function to read current session tenant
CREATE OR REPLACE FUNCTION current_app_tenant() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Macro to enable RLS and add strict tenant policy on a table
DO $$
DECLARE
    t text;
    tenant_tables text[] := ARRAY[
        'hospital_settings',
        'departments',
        'doctors',
        'patients',
        'appointments',
        'consultations',
        'consultation_vitals',
        'prescriptions',
        'prescription_items',
        'wards',
        'rooms',
        'beds',
        'admissions',
        'bed_allocations',
        'medicines',
        'pharmacy_batches',
        'invoices',
        'invoice_items',
        'payments',
        'refunds',
        'audit_logs',
        'user_permissions'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
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
    END LOOP;
END;
$$;

