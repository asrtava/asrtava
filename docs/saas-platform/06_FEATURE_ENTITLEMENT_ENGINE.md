# Centralized Feature Entitlement Engine

## 1. Dual-Gated Access Control Architecture
Access to every feature in ASRTAVA requires satisfying **both** independent criteria:
1. **Tenant Entitlement Condition**: Does the hospital's active SaaS subscription tier (or custom enterprise override) include this module?
2. **User Authorization Condition**: Does the requesting user's role (plus custom individual ALLOW/DENY overrides) permit this specific action?

```
Incoming Request (e.g. POST /api/v1/inpatient/admit)
       |
       +---> [1. JWT Auth Middleware] -> Authenticates identity & extracts hospitalId
       |
       +---> [2. Entitlement Middleware: requirePlanFeature('module:ipd')]
       |        Checks if tenant subscription tier includes 'module:ipd'
       |        If NOT entitled -> HTTP 403 (FEATURE_NOT_ENTITLED) + Upgrade Prompt
       |
       +---> [3. Permission Middleware: requirePermission('ipd:admit')]
       |        Checks RBAC + Custom Individual ALLOW/DENY Precedence
       |        If DENIED -> HTTP 403 (ACCESS_DENIED)
       |
       v
Execute Clinical Transaction
```

## 2. Custom Enterprise Overrides (`tenant_feature_overrides`)
Super Admins can grant custom or time-limited feature flags to specific hospitals without forcing a plan migration:
- `feature_code`: e.g. `module:ot`, `module:pacs_dicom`.
- `valid_until`: Automatic expiration timestamp.
- Audited with `granted_by` and clinical justification.

