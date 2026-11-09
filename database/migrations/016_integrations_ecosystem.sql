-- ============================================================
-- ASRTAVA HMS - Migration 016: Advanced Integrations Ecosystem
-- Standardized integration layer for Communications, Payments, LIMS, PACS, FHIR/HL7, Storage & Webhooks
-- ============================================================

-- ------------------------------------------------------------
-- 1. Integration Provider Catalog (Platform Level)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integration_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE, -- 'whatsapp_meta', 'sms_gupshup', 'sms_twilio', 'email_ses', 'email_sendgrid', 'payment_razorpay', 'payment_cashfree', 'payment_stripe', 'pacs_orthanc', 'lis_hl7', 'storage_s3', 'maps_google'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('communication_whatsapp', 'communication_sms', 'communication_email', 'push_notification', 'payment_gateway', 'laboratory_lis', 'radiology_pacs', 'interoperability_fhir', 'cloud_storage', 'accounting_erp', 'location_maps')),
    description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    supported_auth_types JSONB DEFAULT '["api_key", "oauth2", "webhook_secret"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_saas_only BOOLEAN DEFAULT FALSE, -- Some providers (e.g. SaaS subscription gateway) are platform-exclusive
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. Tenant Integrations & Encrypted Credentials
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    provider_code VARCHAR(50) NOT NULL REFERENCES integration_providers(code) ON DELETE CASCADE,
    display_name VARCHAR(100),
    is_enabled BOOLEAN DEFAULT FALSE,
    environment VARCHAR(20) DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    config_metadata JSONB DEFAULT '{}'::jsonb, -- Non-sensitive config: e.g. sender_id, entity_id, base_url, ae_title
    status VARCHAR(30) DEFAULT 'unconfigured' CHECK (status IN ('unconfigured', 'configured', 'active', 'error', 'suspended')),
    last_health_check_at TIMESTAMPTZ,
    last_health_status VARCHAR(20) DEFAULT 'unknown' CHECK (last_health_status IN ('healthy', 'degraded', 'unreachable', 'unknown')),
    last_error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_provider UNIQUE (hospital_id, provider_code)
);

CREATE TABLE IF NOT EXISTS integration_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_integration_id UUID NOT NULL REFERENCES tenant_integrations(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    encrypted_payload TEXT NOT NULL, -- AES-256-GCM ciphertext
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    key_version INT DEFAULT 1,
    masked_hint VARCHAR(50), -- e.g. 'rzp_test_...abcd'
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_integration_credential UNIQUE (tenant_integration_id)
);

-- ------------------------------------------------------------
-- 3. Communication Templates & Delivery Engine
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL for platform default templates
    channel VARCHAR(30) NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'push', 'in_app')),
    template_code VARCHAR(100) NOT NULL, -- e.g. 'APPOINTMENT_BOOKED', 'OTP_VERIFICATION', 'LAB_REPORT_READY'
    name VARCHAR(150) NOT NULL,
    dlt_template_id VARCHAR(100), -- Indian Telecom DLT identifier for SMS
    meta_template_id VARCHAR(100), -- Meta Approved WhatsApp Template ID
    meta_approval_status VARCHAR(30) DEFAULT 'approved' CHECK (meta_approval_status IN ('pending', 'approved', 'rejected', 'paused')),
    subject_template TEXT, -- For email/push
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- e.g. ["patient_name", "doctor_name", "slot_time", "hospital_name", "portal_url"]
    is_system_standard BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allow_whatsapp BOOLEAN DEFAULT TRUE,
    allow_sms BOOLEAN DEFAULT TRUE,
    allow_email BOOLEAN DEFAULT TRUE,
    allow_push BOOLEAN DEFAULT TRUE,
    marketing_opt_in BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_notif_pref UNIQUE (hospital_id, user_id)
);

CREATE TABLE IF NOT EXISTS notification_suppressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('email', 'phone')),
    recipient_value VARCHAR(255) NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('hard_bounce', 'soft_bounce_limit', 'spam_complaint', 'user_unsubscribe', 'dnd_national_registry')),
    suppressed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_recipient_suppression UNIQUE (hospital_id, recipient_value)
);

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    template_code VARCHAR(100),
    recipient_address VARCHAR(255) NOT NULL, -- Masked phone / email
    status VARCHAR(30) DEFAULT 'queued' CHECK (status IN ('queued', 'dispatched', 'delivered', 'read', 'failed', 'fallback_triggered', 'suppressed')),
    provider_message_id VARCHAR(255),
    error_code VARCHAR(100),
    error_message TEXT,
    retry_count INT DEFAULT 0,
    cost_amount DECIMAL(10, 4) DEFAULT 0.0000,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. Centralized Webhook & Background Queue Engine
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    provider_code VARCHAR(50) NOT NULL,
    endpoint_slug VARCHAR(100) NOT NULL UNIQUE,
    webhook_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    events_subscribed JSONB DEFAULT '["*"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_code VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    idempotency_hash VARCHAR(128) NOT NULL UNIQUE,
    headers JSONB DEFAULT '{}'::jsonb,
    payload JSONB NOT NULL,
    signature VARCHAR(255),
    is_signature_valid BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(30) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'ignored', 'failed', 'dlq')),
    attempts INT DEFAULT 0,
    last_error TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'whatsapp_send', 'sms_send', 'email_send', 'push_dispatch', 'hl7_transmit', 'pacs_sync', 'payment_reconcile'
    payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    max_retries INT DEFAULT 5,
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. Payment Gateway Transactions & Reconciliations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL for SaaS platform subscriptions
    payment_domain VARCHAR(30) NOT NULL CHECK (payment_domain IN ('patient_billing', 'saas_subscription')),
    provider_code VARCHAR(50) NOT NULL, -- 'razorpay', 'cashfree', 'stripe'
    internal_reference_id VARCHAR(100) NOT NULL, -- invoice_id or saas_invoice_id
    gateway_order_id VARCHAR(150),
    gateway_payment_id VARCHAR(150),
    gateway_signature VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')),
    refund_amount DECIMAL(12, 2) DEFAULT 0.00,
    refund_reference_id VARCHAR(150),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. External LIS (Laboratory) & HL7/FHIR Engine
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS laboratory_integration_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    internal_lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    external_lis_order_id VARCHAR(100),
    specimen_barcode VARCHAR(100) NOT NULL,
    lis_connection_type VARCHAR(30) DEFAULT 'rest_api' CHECK (lis_connection_type IN ('rest_api', 'hl7_mllp', 'astm_serial', 'sftp_csv')),
    transmission_status VARCHAR(30) DEFAULT 'pending' CHECK (transmission_status IN ('pending', 'transmitted', 'acknowledged', 'processing', 'completed', 'error')),
    transmitted_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboratory_integration_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    integration_order_id UUID NOT NULL REFERENCES laboratory_integration_orders(id) ON DELETE CASCADE,
    test_code VARCHAR(50) NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    observed_value TEXT NOT NULL,
    unit_of_measure VARCHAR(50),
    reference_low VARCHAR(50),
    reference_high VARCHAR(50),
    flag VARCHAR(20) DEFAULT 'NORMAL' CHECK (flag IN ('NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'INDETERMINATE')),
    is_pathologist_approved BOOLEAN DEFAULT FALSE, -- Safety constraint: unapproved results NEVER visible to patient
    approved_by_user_id UUID REFERENCES users(id),
    raw_payload JSONB,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hl7_message_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    message_type VARCHAR(20) NOT NULL, -- 'ORU^R01', 'ADT^A01', 'ADT^A08', 'ORM^O01'
    message_control_id VARCHAR(100) NOT NULL,
    sender_application VARCHAR(100),
    receiver_application VARCHAR(100),
    raw_hl7_text TEXT NOT NULL,
    parsed_json JSONB,
    ack_status VARCHAR(20) DEFAULT 'AA' CHECK (ack_status IN ('AA', 'AE', 'AR')), -- AA = Application Accept, AE = Error, AR = Reject
    ack_message_control_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fhir_exchange_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- 'Patient', 'Encounter', 'Observation', 'DiagnosticReport', 'MedicationRequest'
    resource_id VARCHAR(100) NOT NULL,
    abdm_bundle_id VARCHAR(100), -- Ayushman Bharat Digital Mission bundle reference
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    fhir_payload JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'valid' CHECK (status IN ('valid', 'validation_error', 'synchronized', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. Radiology PACS & DICOM Integration
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacs_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    server_name VARCHAR(100) NOT NULL,
    pacs_type VARCHAR(50) DEFAULT 'orthanc' CHECK (pacs_type IN ('orthanc', 'dcm4chee', 'ge_centricity', 'siemens_syngo', 'generic_dicomweb')),
    qido_url VARCHAR(255) NOT NULL, -- DICOMweb Query
    wado_url VARCHAR(255) NOT NULL, -- DICOMweb Retrieve
    stow_url VARCHAR(255),          -- DICOMweb Store
    local_aet VARCHAR(50) DEFAULT 'ASRTAVA_HMS',
    remote_aet VARCHAR(50) DEFAULT 'PACS_SERVER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imaging_study_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    radiology_order_id UUID REFERENCES radiology_orders(id) ON DELETE SET NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    study_instance_uid VARCHAR(128) NOT NULL,
    accession_number VARCHAR(100),
    modality VARCHAR(20) NOT NULL, -- 'CR', 'DX', 'CT', 'MR', 'US'
    study_description VARCHAR(255),
    series_count INT DEFAULT 1,
    instance_count INT DEFAULT 1,
    ephemeral_viewer_token VARCHAR(128),
    viewer_token_expires_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_study UNIQUE (hospital_id, study_instance_uid)
);

-- ------------------------------------------------------------
-- 8. Cloud Storage & Accounting Integrations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_document_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    storage_provider VARCHAR(50) DEFAULT 'aws_s3' CHECK (storage_provider IN ('aws_s3', 'azure_blob', 'gcs', 'minio_local')),
    bucket_name VARCHAR(150) NOT NULL,
    object_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL,
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256',
    antivirus_scan_status VARCHAR(30) DEFAULT 'clean' CHECK (antivirus_scan_status IN ('clean', 'scanning', 'infected', 'skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_accounting_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    target_erp VARCHAR(50) NOT NULL, -- 'tally_prime', 'quickbooks', 'zoho_books', 'sap_b1'
    sync_entity_type VARCHAR(50) NOT NULL, -- 'patient_invoice', 'patient_payment', 'refund', 'vendor_po'
    internal_entity_id UUID NOT NULL,
    external_voucher_number VARCHAR(100),
    sync_status VARCHAR(30) DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'CONFIG_UPDATED', 'CREDENTIALS_ROTATED', 'CONNECTION_TESTED', 'WEBHOOK_PROCESSED', 'DLQ_REPLAYED'
    provider_code VARCHAR(50) NOT NULL,
    actor_user_id UUID REFERENCES users(id),
    ip_address VARCHAR(50),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 9. Row-Level Security (RLS) Policies
-- ------------------------------------------------------------
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_integration_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_integration_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE hl7_message_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_exchange_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacs_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imaging_study_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_document_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_accounting_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 10. Performance Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tenant_integrations_hosp ON tenant_integrations(hospital_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_notif_delivery_status ON notification_delivery_logs(hospital_id, channel, status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_hash ON webhook_events(idempotency_hash);
CREATE INDEX IF NOT EXISTS idx_payment_txns_idempotency ON payment_gateway_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_payment_txns_internal_ref ON payment_gateway_transactions(internal_reference_id);
CREATE INDEX IF NOT EXISTS idx_lab_integ_specimen ON laboratory_integration_orders(specimen_barcode);
CREATE INDEX IF NOT EXISTS idx_hl7_control_id ON hl7_message_records(message_control_id);
CREATE INDEX IF NOT EXISTS idx_pacs_study_uid ON imaging_study_references(study_instance_uid);
CREATE INDEX IF NOT EXISTS idx_integration_jobs_retry ON integration_jobs(status, next_retry_at);

