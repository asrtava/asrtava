-- ============================================================================
-- ASRTAVA Hospital Management System
-- 001_extensions.sql - PostgreSQL Extensions
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions (password hashing, etc.)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable trigram matching for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
