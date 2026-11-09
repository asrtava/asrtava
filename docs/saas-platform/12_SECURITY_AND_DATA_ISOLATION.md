# Tenant Security & Data Isolation Architecture

## 1. Zero Trust Architectural Boundaries
1. **Database Tier**:
   - `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables.
   - Database application user lacks `BYPASSRLS` privileges in production.
   - Cross-tenant queries return empty sets (`0 rows`) without leaking entity existence.
2. **Backend Gateway Tier**:
   - Tenant context resolution relies strictly on verified JWT claims, never on unauthenticated client headers or query parameters.
   - Entitlement middleware `requirePlanFeature()` blocks unauthorized module API access.
3. **Platform Staff Boundary**:
   - Platform Super Admins and Support staff have ZERO standing access to patient charts. Access requires Hospital Admin approved JIT tokens.
4. **Data Encryption**:
   - In Transit: TLS 1.3 enforced across all web and mobile endpoints.
   - At Rest: AES-256 database storage encryption with column-level salting for sensitive patient identifiers (Aadhaar, government IDs).

