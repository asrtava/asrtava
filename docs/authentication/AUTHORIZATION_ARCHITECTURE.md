# ASRTAVA — Authorization Architecture & Permission Engine

## 1. Dual-Layer Authorization Model
ASRTAVA combines **Role-Based Access Control (RBAC)** with **Individual Custom Permission Overrides** to accommodate complex enterprise hospital staffing.

```
                              Incoming API Request
                                        │
                                        ▼
                         Individual Permission Override?
                                   (user_permissions)
                                        │
                     ┌──────────────────┴──────────────────┐
                     ▼                                     ▼
           is_granted = FALSE                     is_granted = TRUE
                   │                                       │
                   ▼                                       ▼
       [EXPLICIT DENY WINS]                       [EXPLICIT ALLOW]
       HTTP 403 Forbidden                          Request Permitted
                   │
                   ▼ (No valid override)
        Role-Based Access Control
           (user_roles -> roles)
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Role Permitted        Role Denied
        │                     │
        ▼                     ▼
     Request           [DEFAULT DENY]
    Permitted        HTTP 403 Forbidden
```

---

## 2. Precedence Hierarchy

1. **Explicit Individual DENY** (`user_permissions.is_granted = false`):
   - Overrides all assigned roles (e.g. A senior doctor who is temporarily suspended from dispensing controlled narcotics).
   - If not expired (`expires_at IS NULL OR expires_at > NOW()`), immediately returns `403 Forbidden`.

2. **Explicit Individual ALLOW** (`user_permissions.is_granted = true`):
   - Grants an exceptional permission without creating a bespoke role (e.g. A head nurse granted authority to authorize emergency ICU bed transfers).
   - Valid only if `expires_at > NOW()`.

3. **Role-Based Access Control (RBAC)**:
   - Inherited from the user's active assigned roles for the current hospital tenant.
   - Evaluates `role_permissions` against canonical `module:action:resource`.

4. **Default Deny**:
   - Any action or resource not explicitly permitted is strictly blocked.

---

## 3. Super Admin Clinical Data Boundary
Platform Super Admins hold operational control over system tenants, billing subscriptions, and global audit logs, but **cannot view patient health records or clinical consultations by default**.

To access patient data during a vendor support investigation:
1. Hospital Admin must grant temporary authorization.
2. A record is created in `platform_support_sessions` with a strict expiry time (max 4 hours).
3. Every API call made under this session is tagged with `support_session_id` in `auth_audit_logs`.

