-- ============================================================
-- ASRTAVA HMS - Migration 012: Auditing, Documents & Notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    portal_context VARCHAR(50), -- e.g. 'doctor', 'reception', 'pharmacy'
    action VARCHAR(100) NOT NULL, -- e.g. 'patient.create', 'prescription.dispense', 'permission.override'
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_proof', 'lab_report', 'radiology_scan', 'discharge_summary', 'consent_form', 'external_prescription', 'insurance_card', 'other')),
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_by_user_id UUID REFERENCES users(id),
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_category VARCHAR(50) NOT NULL CHECK (consent_category IN ('general_treatment', 'surgical_procedure', 'anesthesia', 'telemedicine', 'whatsapp_communication', 'data_sharing_dpdp', 'blood_transfusion')),
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    witness_name VARCHAR(100),
    witness_phone VARCHAR(30),
    digital_signature_url TEXT,
    captured_by_user_id UUID REFERENCES users(id),
    valid_until TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(30) DEFAULT 'in_app' CHECK (channel IN ('in_app', 'push', 'sms', 'whatsapp', 'email')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    template_variables JSONB DEFAULT '{}',
    message_status VARCHAR(30) DEFAULT 'queued' CHECK (message_status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
    external_message_id VARCHAR(100),
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

