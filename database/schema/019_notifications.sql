-- ============================================================================
-- ASRTAVA Hospital Management System
-- 019_notifications.sql - Notifications & Messaging
-- ============================================================================

-- ---------------------------------------------------------------------------
-- notification_templates
-- ---------------------------------------------------------------------------
CREATE TABLE notification_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id     UUID
        REFERENCES hospitals(id) ON DELETE CASCADE,
    template_type   VARCHAR(30)
        CHECK (template_type IN ('in_app', 'whatsapp', 'sms', 'email')),
    template_name   VARCHAR(100) NOT NULL,
    template_code   VARCHAR(50),
    subject         VARCHAR(255),
    body            TEXT NOT NULL,
    variables       JSONB,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id             UUID
        REFERENCES users(id) ON DELETE CASCADE,
    patient_id          UUID
        REFERENCES patients(id) ON DELETE SET NULL,
    notification_type   VARCHAR(30)
        CHECK (notification_type IN ('appointment', 'admission', 'discharge', 'billing',
                                     'pharmacy', 'lab_result', 'system', 'alert')),
    title               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    priority            VARCHAR(10) DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read             BOOLEAN DEFAULT false,
    read_at             TIMESTAMPTZ,
    action_url          TEXT,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- whatsapp_messages
-- ---------------------------------------------------------------------------
CREATE TABLE whatsapp_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id         UUID NOT NULL
        REFERENCES hospitals(id) ON DELETE CASCADE,
    patient_id          UUID
        REFERENCES patients(id) ON DELETE SET NULL,
    phone_number        VARCHAR(20) NOT NULL,
    template_id         UUID
        REFERENCES notification_templates(id) ON DELETE SET NULL,
    message_type        VARCHAR(20)
        CHECK (message_type IN ('template', 'text')),
    message_content     TEXT,
    status              VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    whatsapp_message_id VARCHAR(100),
    error_message       TEXT,
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
