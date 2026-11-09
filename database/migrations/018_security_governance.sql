-- ============================================================
-- ASRTAVA HMS - Migration 018: Enterprise Security Hardening,
-- Data Privacy Governance, Compliance Readiness & Immutable Audit
-- ============================================================

-- 1. Security Incidents Management & Threat Register
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(60) NOT NULL UNIQUE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL indicates platform-level incident
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'auth_breach', 
        'cross_tenant_attempt', 
        'sql_injection_attempt', 
        'idor_tamper_attempt',
        'data_leak', 
        'ddos', 
        'unauthorized_export', 
        'privilege_escalation',
        'mfa_bypass_attempt',
        'token_replay_attack'
    )),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
    affected_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_resource_type VARCHAR(100),
    affected_resource_id VARCHAR(100),
    source_ip VARCHAR(50),
    source_user_agent TEXT,
    containment_action TEXT,
    root_cause TEXT,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_hosp ON security_incidents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_sev ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_cat ON security_incidents(category);

-- 2. Vulnerability Register & Patch Management
CREATE TABLE IF NOT EXISTS vulnerability_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vuln_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    cve_id VARCHAR(50),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    cvss_score NUMERIC(3,1) CHECK (cvss_score >= 0.0 AND cvss_score <= 10.0),
    affected_component VARCHAR(100) NOT NULL,
    remediation_plan TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'in_progress', 'mitigated', 'accepted', 'verified')),
    target_remediation_date DATE,
    identified_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Session Security & Refresh Token Rotation Family (With Reuse Detection)
CREATE TABLE IF NOT EXISTS auth_session_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    token_family_id UUID NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_fingerprint VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_reason VARCHAR(100),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_tokens_family ON auth_session_tokens(token_family_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user ON auth_session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_hash ON auth_session_tokens(refresh_token_hash);

-- 4. Immutable Append-Only Clinical & Financial Audit Trail (Tamper-Resistant)
CREATE TABLE IF NOT EXISTS clinical_audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type VARCHAR(50) NOT NULL DEFAULT 'staff', -- 'staff', 'system_service', 'patient', 'super_admin_support'
    actor_roles JSONB DEFAULT '[]'::jsonb,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'RECORD_READ', 
        'RECORD_CREATED', 
        'RECORD_UPDATED', 
        'RECORD_AMENDED', 
        'RECORD_EXPORTED', 
        'RECORD_ANONYMIZED', 
        'EMERGENCY_BREAK_GLASS'
    )),
    resource_table VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    accessed_fields JSONB DEFAULT '[]'::jsonb,
    justification TEXT,
    before_state JSONB,
    after_state JSONB,
    source_ip VARCHAR(50),
    user_agent TEXT,
    checksum_sha256 VARCHAR(64) NOT NULL,
    previous_checksum VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_hosp_time ON clinical_audit_events(hospital_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_audit_patient ON clinical_audit_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_audit_actor ON clinical_audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_clinical_audit_resource ON clinical_audit_events(resource_table, resource_id);

-- Enforce Immutability: Block all UPDATE or DELETE statements on clinical_audit_events
CREATE OR REPLACE FUNCTION prevent_clinical_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TAMPER_ALERT: clinical_audit_events is an immutable append-only ledger. Updates and deletions are strictly prohibited by HIPAA/DPDP compliance policy.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_update ON clinical_audit_events;
CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE OR DELETE ON clinical_audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_clinical_audit_tampering();

-- 5. Data Privacy & Subject Rights Requests (DPDP Act 2023 & HIPAA compliance)
CREATE TABLE IF NOT EXISTS privacy_rights_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(60) NOT NULL UNIQUE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    requester_name VARCHAR(150) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
        'access_summary', 
        'data_portability_export', 
        'rectification', 
        'erasure_request', 
        'consent_withdrawal'
    )),
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 
        'identity_verified', 
        'processing', 
        'completed', 
        'rejected', 
        'legal_hold_retained'
    )),
    legal_hold_flag BOOLEAN NOT NULL DEFAULT FALSE,
    legal_hold_reason TEXT,
    processing_notes TEXT,
    export_archive_url TEXT,
    sla_deadline TIMESTAMPTZ NOT NULL,
    fulfilled_at TIMESTAMPTZ,
    fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_rights_hosp ON privacy_rights_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_privacy_rights_patient ON privacy_rights_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_privacy_rights_status ON privacy_rights_requests(status);

-- 6. Statutory Data Retention & Archival Policies (HIPAA, NMC RMP, DPDP 2023)
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL UNIQUE CHECK (category IN (
        'clinical_adult_records', 
        'clinical_minor_records', 
        'financial_tax_ledgers', 
        'audit_trails', 
        'diagnostic_radiology_images',
        'ephemeral_telemetry'
    )),
    retention_period_years INT NOT NULL,
    statutory_basis VARCHAR(150) NOT NULL,
    auto_archive_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    encryption_standard VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    is_legal_hold_active BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Standard Statutory Healthcare Retention Rules
INSERT INTO data_retention_policies (category, retention_period_years, statutory_basis, auto_archive_enabled, notes)
VALUES 
    ('clinical_adult_records', 3, 'NMC Registered Medical Practitioner Regulations 2023 & Clinical Establishments Act', TRUE, 'Minimum 3 years from date of last consultation/discharge for adults.'),
    ('clinical_minor_records', 21, 'Indian Limitation Act & Medical Jurisprudence (3 years after turning 18)', TRUE, 'Retain until patient reaches age of majority (18) + 3 years statutory limitation = 21 years.'),
    ('financial_tax_ledgers', 8, 'Section 44AA of Income Tax Act 1961 & GST Act statutory compliance', TRUE, 'Mandatory 8 years retention for financial vouchers, invoices, and payment audits.'),
    ('audit_trails', 7, 'HIPAA Security Rule 45 CFR 164.316 & ISO 27001 requirements', TRUE, 'Minimum 6-7 years immutable preservation of clinical audit and access logs.'),
    ('diagnostic_radiology_images', 5, 'Atomic Energy Regulatory Board (AERB) & Medical Council directives', TRUE, 'Maintain DICOM scans and radiology studies for 5 years.'),
    ('ephemeral_telemetry', 1, 'DPDP Act 2023 Data Minimization Principle', TRUE, 'Transient request IDs and network telemetry purged after 365 days.')
ON CONFLICT (category) DO NOTHING;

-- 7. Enable and Enforce Row-Level Security on Security Governance Tables
DO $$
DECLARE
    t text;
    security_tables text[] := ARRAY[
        'security_incidents',
        'auth_session_tokens',
        'clinical_audit_events',
        'privacy_rights_requests'
    ];
BEGIN
    FOREACH t IN ARRAY security_tables LOOP
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
            EXECUTE format('
                CREATE POLICY tenant_isolation_policy ON %I
                FOR ALL
                USING (
                    hospital_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid
                    OR current_setting(''app.is_super_admin'', true) = ''true''
                )
                WITH CHECK (
                    hospital_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid
                    OR current_setting(''app.is_super_admin'', true) = ''true''
                );
            ', t);
        END IF;
    END LOOP;
END $$;

