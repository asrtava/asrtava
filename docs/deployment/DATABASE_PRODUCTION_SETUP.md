# ASRTAVA Managed PostgreSQL Production Setup & Migration Guide

## 1. Production Database Architecture

- **Engine**: AWS RDS / Aurora PostgreSQL 16.2
- **Topology**: Multi-AZ Deployment (Active Writer in AZ-a, Synchronous Standby in AZ-b)
- **Encryption**: AES-256 Storage Encryption via AWS KMS Customer Managed Key
- **Network Isolation**: Dedicated Private Database Subnets (`10.0.20.0/24`, `10.0.21.0/24`) with zero internet ingress/egress.
- **Connection Security**: Enforced TLS 1.3 (`rds.force_ssl = 1`).

---

## 2. Row-Level Security (RLS) & Tenant Isolation

Every tenant table enforces PostgreSQL Row-Level Security:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patients
FOR ALL
USING (
    hospital_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR current_setting('app.is_super_admin', true) = 'true'
);
```

### Connection Pool Configuration (`backend/src/database/index.ts`):
```typescript
pool: {
  min: 10,
  max: 50,
  afterCreate: (conn, done) => {
    conn.query('SET timezone="UTC";', (err) => done(err, conn));
  }
}
```

---

## 3. Production Migration Deployment Pipeline

Database migrations in `database/migrations/` are applied via a strict forward-only pipeline:
1. **Pre-Deployment Backup**: Automated RDS snapshot created before migration execution.
2. **Staging Validation**: Migration applied and verified against synthetic staging datasets.
3. **Application Verification**: Schema changes are backward-compatible with the currently running application code (Expand and Contract pattern).
4. **Controlled Execution**: Migrations run with restricted DDL migration credentials, not the runtime application user.
5. **Post-Migration Audit**: Immutability triggers on `clinical_audit_events` verified intact.

