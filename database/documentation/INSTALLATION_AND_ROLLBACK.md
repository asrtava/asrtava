# ASRTAVA HMS — Database Installation, Execution & Rollback Manual

---

## 1. Prerequisites
- **PostgreSQL**: Version 15 or higher (Supports advanced RLS, UUID v4, JSONB and B-tree GIST).
- **Extensions Required**: `uuid-ossp`, `pgcrypto`, `btree_gist`
- **Application User**: `asrtava_app` (Unprivileged role with `NOSUPERUSER` and `NOBYPASSRLS`).

---

## 2. Step-by-Step Installation & Migration Sequence

Execute scripts in strict numerical order using `psql`:

```bash
# Set PostgreSQL environment
export PGDATABASE="asrtava_dev"
export PGUSER="postgres"
export PGHOST="localhost"
export PGPORT="5432"

# 1. Initialize Roles and Privileges
psql -f database/init/00_init_roles_and_db.sql

# 2. Run Modular Schema Migrations
psql -f database/migrations/001_extensions.sql
psql -f database/migrations/002_hospitals_tenants.sql
psql -f database/migrations/003_identity_permissions.sql
psql -f database/migrations/004_departments_staff.sql
psql -f database/migrations/005_patients_emr.sql
psql -f database/migrations/006_appointments_consult.sql
psql -f database/migrations/007_inpatient_beds.sql
psql -f database/migrations/008_pharmacy_inventory.sql
psql -f database/migrations/009_laboratory_radiology.sql
psql -f database/migrations/010_billing_finance.sql
psql -f database/migrations/011_saas_platform.sql
psql -f database/migrations/012_audit_and_documents.sql

# 3. Apply Row-Level Security & Functions
psql -f database/rls/01_security_functions_and_rls.sql

# 4. Create Performance & Concurrency Indexes
psql -f database/indexes/01_performance_and_concurrency.sql

# 5. Populate System Seeds & Demo Hospital
psql -f database/seeds/01_system_seeds.sql

# 6. Run Automated Verification Test Suite
psql -f database/tests/run_tests.sql
```

---

## 3. Application Session Establishment

The backend Express application connects as `asrtava_app`. Before executing any tenant query inside a transaction, the backend sets the tenant session variable:

```typescript
// PostgreSQL Tenant Context Initialization inside transaction
await trx.raw(`SET LOCAL app.current_tenant_id = ?;`, [req.user.hospitalId]);
await trx.raw(`SET LOCAL app.is_super_admin = 'false';`);
```

For Super Admin platform-wide operations:
```typescript
await trx.raw(`SET LOCAL app.is_super_admin = 'true';`);
```

---

## 4. Rollback Strategy & Emergency Teardown

If a migration needs to be rolled back to a clean state during development:

```sql
-- Comprehensive Teardown Script (Development Environments Only)
DROP TABLE IF EXISTS
    whatsapp_message_logs,
    notifications,
    patient_consents,
    patient_documents,
    audit_logs,
    financial_transactions,
    refunds,
    payments,
    invoice_items,
    invoices,
    radiology_reports,
    radiology_orders,
    radiology_procedures,
    lab_results,
    lab_specimens,
    lab_order_items,
    lab_orders,
    lab_test_catalog,
    goods_receipt_notes,
    purchase_order_items,
    purchase_orders,
    pharmacy_dispense_items,
    pharmacy_dispensings,
    pharmacy_stock_movements,
    pharmacy_batches,
    suppliers,
    medicines,
    medicine_categories,
    medication_administration_records,
    nursing_notes,
    bed_allocations,
    admissions,
    beds,
    rooms,
    wards,
    prescription_items,
    prescriptions,
    clinical_diagnoses,
    consultation_vitals,
    consultations,
    appointments,
    patient_insurance_policies,
    patient_emergency_contacts,
    patient_medical_histories,
    patient_allergies,
    patient_dependents,
    patients,
    staff_profiles,
    doctor_schedules,
    doctors,
    departments,
    platform_audit_logs,
    platform_support_sessions,
    platform_configurations,
    subscription_payments,
    subscription_invoices,
    hospital_subscriptions,
    subscription_plans,
    user_devices,
    user_sessions,
    permission_approval_logs,
    user_permissions,
    user_roles,
    role_permissions,
    permissions,
    roles,
    users,
    hospital_tax_rates,
    hospital_branches,
    hospital_settings,
    hospitals
CASCADE;

DROP FUNCTION IF EXISTS current_app_tenant();
DROP FUNCTION IF EXISTS has_permission(UUID, VARCHAR, VARCHAR, VARCHAR);
```

