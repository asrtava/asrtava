-- ============================================================
-- ASRTAVA HMS - Migration 017: Reporting, Analytics & Business Intelligence
-- Relational infrastructure for role dashboards, report builder, schedules, export jobs & data quality
-- ============================================================

-- ------------------------------------------------------------
-- 1. Metric Definitions & Data Governance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metric_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'ALOS', 'BED_OCCUPANCY_RATE', 'MRR', 'ARR', 'CHURN_RATE', 'LAB_TAT', 'GROSS_REVENUE'
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('clinical', 'operational', 'financial', 'pharmacy', 'laboratory', 'radiology', 'saas_platform', 'hr')),
    formula_description TEXT NOT NULL,
    mathematical_formula TEXT NOT NULL,
    source_tables JSONB NOT NULL, -- e.g. ["invoices", "payments"]
    unit_of_measure VARCHAR(30) NOT NULL, -- e.g. 'percentage', 'currency_inr', 'days', 'hours', 'count'
    is_saas_exclusive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 2. Report Definitions, Categories & Fields
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'BarChart2',
    display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES report_categories(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    base_dataset VARCHAR(100) NOT NULL, -- e.g. 'appointments', 'invoices', 'beds', 'patients', 'lab_orders', 'pharmacy_sales'
    is_system_standard BOOLEAN DEFAULT TRUE,
    required_permission VARCHAR(100) DEFAULT 'view:reports',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL,
    display_label VARCHAR(150) NOT NULL,
    data_type VARCHAR(30) NOT NULL CHECK (data_type IN ('string', 'number', 'currency', 'percentage', 'date', 'datetime', 'boolean')),
    is_filterable BOOLEAN DEFAULT TRUE,
    is_groupable BOOLEAN DEFAULT TRUE,
    is_aggregatable BOOLEAN DEFAULT TRUE,
    allowed_aggregations JSONB DEFAULT '["count", "sum", "avg", "min", "max"]'::jsonb,
    is_sensitive_pii BOOLEAN DEFAULT FALSE, -- Masked for unauthorized roles
    CONSTRAINT uq_report_field UNIQUE (report_definition_id, field_key)
);

-- ------------------------------------------------------------
-- 3. Saved Reports, Custom Filters & User Layouts
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE, -- NULL for platform-wide reports
    report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    selected_fields JSONB NOT NULL, -- Array of field keys
    applied_filters JSONB NOT NULL, -- Conditions e.g. [{"field": "department_id", "operator": "eq", "value": "..."}]
    group_by_fields JSONB DEFAULT '[]'::jsonb,
    sort_by JSONB DEFAULT '[]'::jsonb,
    chart_configuration JSONB DEFAULT '{}'::jsonb, -- Preferred chart type: 'bar', 'line', 'donut', 'table'
    is_shared_with_team BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4. Scheduled Report Generation & Multi-Channel Delivery
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    saved_report_id UUID NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    schedule_cron VARCHAR(50) NOT NULL, -- e.g. '0 8 * * 1' (Every Monday at 8 AM)
    frequency VARCHAR(30) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    export_format VARCHAR(20) DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'xlsx', 'csv', 'json')),
    delivery_channels JSONB NOT NULL, -- e.g. ["email", "in_app"]
    recipient_emails JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
    saved_report_id UUID REFERENCES saved_reports(id) ON DELETE SET NULL,
    channel VARCHAR(30) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed', 'suppressed')),
    download_url TEXT,
    download_expires_at TIMESTAMPTZ,
    error_message TEXT,
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. Asynchronous Export Jobs Engine
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    requested_by_user_id UUID NOT NULL REFERENCES users(id),
    report_definition_code VARCHAR(100) NOT NULL,
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('csv', 'xlsx', 'pdf', 'json')),
    query_params JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress_percentage INT DEFAULT 0,
    total_records INT DEFAULT 0,
    file_byte_size BIGINT,
    storage_object_key TEXT,
    download_url TEXT,
    download_expires_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 6. Analytics Aggregated Snapshots & Materialized Cache
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    metric_code VARCHAR(100) NOT NULL REFERENCES metric_definitions(code) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    dimension_key VARCHAR(100), -- e.g. 'department:cardiology', 'modality:CT', 'plan:enterprise'
    metric_value DECIMAL(16, 4) NOT NULL,
    sample_count INT DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    aggregated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tenant_metric_period UNIQUE (hospital_id, metric_code, period_type, period_start, dimension_key)
);

CREATE TABLE IF NOT EXISTS analytics_refresh_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    metric_category VARCHAR(50),
    status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    records_processed INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    refreshed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. Data Quality Audit & Inconsistency Detection
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_data_quality_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    check_category VARCHAR(50) NOT NULL CHECK (check_category IN ('missing_data', 'duplicate_records', 'reconciliation_variance', 'invalid_timestamps', 'unmapped_codes')),
    entity_table VARCHAR(100) NOT NULL,
    record_reference_id VARCHAR(100),
    issue_description TEXT NOT NULL,
    variance_amount DECIMAL(14, 2),
    severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
    is_resolved BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ------------------------------------------------------------
-- 8. Dashboard Configurations & User Widgets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portal_role VARCHAR(50) NOT NULL,
    dashboard_layout JSONB DEFAULT '[]'::jsonb, -- Grid coordinates & card placements
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_dashboard_role UNIQUE (hospital_id, user_id, portal_role)
);

-- ------------------------------------------------------------
-- 9. Row-Level Security (RLS) Policies
-- ------------------------------------------------------------
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_refresh_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 10. Performance Indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_saved_reports_hosp ON saved_reports(hospital_id, report_definition_id);
CREATE INDEX IF NOT EXISTS idx_analytics_agg_lookup ON analytics_aggregates(hospital_id, metric_code, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON report_export_jobs(requested_by_user_id, status);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next ON report_schedules(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_data_quality_severity ON analytics_data_quality_logs(hospital_id, severity, is_resolved);

