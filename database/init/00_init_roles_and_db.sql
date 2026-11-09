-- ============================================================
-- ASRTAVA HMS - Database Initialization, Roles & Privileges
-- ============================================================

-- 1. Create Application Role (Non-Superuser, Non-BYPASSRLS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'asrtava_app') THEN
        CREATE ROLE asrtava_app WITH LOGIN PASSWORD 'asrtava_secure_app_password_2026';
    END IF;
END
$$;

-- Ensure application role does NOT have BYPASSRLS or superuser permissions
ALTER ROLE asrtava_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- 2. Grant Connection and Schema Permissions
GRANT CONNECT ON DATABASE postgres TO asrtava_app;
GRANT USAGE ON SCHEMA public TO asrtava_app;

-- Grant table privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO asrtava_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO asrtava_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO asrtava_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO asrtava_app;

