# ASRTAVA Report Security and Access Control

## 1. Multi-Tier Security Enforcement
Reporting access in ASRTAVA integrates with the centralized authorization engine:
1. **Tenant Isolation**: Non-superadmin requests enforce `hospital_id = req.hospitalId`. Cross-tenant query execution is rejected at both the middleware and database RLS levels.
2. **Explicit Individual DENY Precedence**: An individual custom DENY override strictly negates any role-based report viewing permission.
3. **PII Masking**: Aggregated reports de-identify individual patient UHIDs, phone numbers, and names.
4. **Export Token Expiration**: Report download URLs expire automatically after 24 hours. Tokens are high-entropy cryptographic hashes that cannot be guessed or forged.
5. **Audit Logging**: Every report export and custom query is audited in `report_execution_logs`.

