-- ============================================================================
-- ASRTAVA Hospital Management System
-- 018_documents.sql - Documents & Consent Records
-- ============================================================================

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id      UUID
        REFERENCES patients(id) ON DELETE SET NULL,
    entity_type     VARCHAR(50),
    entity_id       UUID,
    document_type   VARCHAR(50)
        CHECK (document_type IN ('medical_report', 'prescription', 'consent',
                                 'discharge_summary', 'lab_report', 'radiology_report',
                                 'insurance', 'identity', 'certificate', 'other')),
    file_name       VARCHAR(255) NOT NULL,
    file_path       TEXT NOT NULL,
    file_size       INT,
    mime_type       VARCHAR(100),
    description     TEXT,
    uploaded_by     UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    is_confidential BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- consent_records
-- ---------------------------------------------------------------------------
CREATE TABLE consent_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id      UUID NOT NULL
        REFERENCES patients(id) ON DELETE RESTRICT,
    consent_type    VARCHAR(50)
        CHECK (consent_type IN ('treatment', 'surgery', 'anesthesia', 'blood_transfusion',
                                'data_sharing', 'discharge', 'research', 'whatsapp_communication')),
    description     TEXT,
    consent_given   BOOLEAN NOT NULL,
    given_at        TIMESTAMPTZ DEFAULT NOW(),
    witness_name    VARCHAR(100),
    witness_contact VARCHAR(20),
    document_id     UUID
        REFERENCES documents(id) ON DELETE SET NULL,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  TEXT,
    recorded_by     UUID NOT NULL
        REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
