# ASRTAVA Integration Ecosystem Database Architecture & ERD

## 1. Entity Relationship Overview
The integration ecosystem extends the ASRTAVA relational core with 16 dedicated tables supporting encrypted credentials, delivery tracking, payment gateway transactions, laboratory orders, and HL7/FHIR exchanges:

```mermaid
erDiagram
    HOSPITALS ||--o{ TENANT_INTEGRATIONS : configures
    INTEGRATION_PROVIDERS ||--o{ TENANT_INTEGRATIONS : catalogs
    TENANT_INTEGRATIONS ||--|| INTEGRATION_CREDENTIALS : holds_encrypted_secrets
    HOSPITALS ||--o{ NOTIFICATION_DELIVERY_LOGS : audits
    HOSPITALS ||--o{ PAYMENT_GATEWAY_TRANSACTIONS : processes
    HOSPITALS ||--o{ LABORATORY_INTEGRATION_ORDERS : transmits
    LABORATORY_INTEGRATION_ORDERS ||--o{ LABORATORY_INTEGRATION_RESULTS : receives
    HOSPITALS ||--o{ PACS_CONNECTIONS : maintains
    PACS_CONNECTIONS ||--o{ IMAGING_STUDY_REFERENCES : indexes
    HOSPITALS ||--o{ HL7_MESSAGE_RECORDS : logs
    HOSPITALS ||--o{ FHIR_EXCHANGE_RECORDS : logs
    HOSPITALS ||--o{ INTEGRATION_JOBS : queues

    TENANT_INTEGRATIONS {
        uuid id PK
        uuid hospital_id FK
        string provider_code FK
        boolean is_enabled
        string environment
        jsonb config_metadata
        string status
        timestamptz last_health_check_at
    }

    INTEGRATION_CREDENTIALS {
        uuid id PK
        uuid tenant_integration_id FK
        text encrypted_payload
        string iv
        string auth_tag
        int key_version
        string masked_hint
    }

    PAYMENT_GATEWAY_TRANSACTIONS {
        uuid id PK
        uuid hospital_id FK
        string payment_domain
        string provider_code
        string internal_reference_id
        string gateway_order_id
        string gateway_payment_id
        decimal amount
        string idempotency_key
        string status
    }

    LABORATORY_INTEGRATION_RESULTS {
        uuid id PK
        uuid hospital_id FK
        uuid integration_order_id FK
        string test_code
        text observed_value
        string flag
        boolean is_pathologist_approved
        uuid approved_by_user_id FK
    }
```

## 2. PostgreSQL Row-Level Security (RLS) Policy
All tenant integration tables enforce tenant isolation:
```sql
CREATE POLICY tenant_integrations_isolation ON tenant_integrations
    FOR ALL
    USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR hospital_id = current_setting('app.current_tenant_id', true)::uuid
    );
```

