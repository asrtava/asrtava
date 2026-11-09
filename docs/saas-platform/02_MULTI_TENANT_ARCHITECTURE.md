# Multi-Tenant Architecture & Data Isolation

## 1. Multi-Tenant Partitioning Model
ASRTAVA employs a **Shared Database, Shared Schema with Logical Row-Level Partitioning** architecture:
- Every tenant table possesses a `hospital_id UUID NOT NULL` column foreign-keyed to `hospitals(id)`.
- PostgreSQL 15 Row-Level Security (RLS) is enabled on all clinical, financial, and operational tables.
- At request intake, JWT validation extracts `decoded.hospitalId` and initializes the connection context:
  ```sql
  SET LOCAL app.current_tenant_id = 'c4b18f4a-8149-43c2-8418-4903328e3b3c';
  ```
- All database policies evaluate:
  ```sql
  CREATE POLICY tenant_isolation_policy ON patients
      FOR ALL
      USING (hospital_id = current_setting('app.current_tenant_id', true)::uuid);
  ```

## 2. Multi-Branch Support Within Tenant
A single hospital tenant can provision multiple operational branches:
- `hospital_branches`: Stores physical locations (e.g. `Main Campus`, `South City Clinic`).
- Cross-branch synchronization allows patients registered at one branch to consult at another branch of the same hospital network while maintaining clinical continuity.
- Cross-tenant data access is mathematically blocked at the database engine level.

## 3. Custom Domains & White-Labeling
Tenants can configure custom domains:
- Subdomain: `apexcare.asrtava.com`
- Custom Domain: `portal.apexcare.org` (verified via DNS TXT token challenge and automated Let's Encrypt SSL provisioning).

