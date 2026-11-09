# ASRTAVA Multi-Tenant Isolation & Anti-BOLA/IDOR Security Specification

## 1. Architectural Philosophy

ASRTAVA employs a **Logical Tenant Isolation with Physical Policy Enforcement** architecture. Multiple healthcare organizations share computing clusters while their data is completely segregated at the database engine level via PostgreSQL Row-Level Security (RLS) and verified at the API Gateway level via Anti-IDOR interceptors.

---

## 2. PostgreSQL Row-Level Security (RLS) Enforcement

Every database table storing tenant data includes a `hospital_id UUID NOT NULL REFERENCES hospitals(id)` foreign key.

### RLS Policy Definition
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON patients
FOR ALL
USING (
    hospital_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR current_setting('app.is_super_admin', true) = 'true'
)
WITH CHECK (
    hospital_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    OR current_setting('app.is_super_admin', true) = 'true'
);
```

### Transaction Context Scoping
In the Node.js backend, all queries are executed using `withTenantContext`:
```typescript
await trx.raw(`SET LOCAL app.current_tenant_id = ?;`, [authenticatedTenantId]);
await trx.raw(`SET LOCAL app.is_super_admin = 'false';`);
```
This guarantees that even if an application bug omitted a `WHERE hospital_id = ...` clause, the PostgreSQL engine filters out rows belonging to all other hospitals, returning 0 rows.

---

## 3. Defense-in-Depth: Anti-BOLA / IDOR Verification

In addition to RLS, ASRTAVA deploys `TenantIsolationGuard`:
- Intercepts routes containing resource IDs (e.g., `GET /patients/:id`, `GET /invoices/:id`).
- Compares the entity's underlying `hospital_id` with the client's verified JWT `token.hospitalId`.
- **Negative Result Action**: If an authenticated staff member from Hospital A supplies an ID belonging to Hospital B:
  1. The request is immediately rejected with `403 Forbidden` (`code: 'CROSS_TENANT_FORBIDDEN'`).
  2. A `security_incidents` entry with category `cross_tenant_attempt` and severity `high` is created.
  3. Security monitoring raises an automated alert for the security operations team.

