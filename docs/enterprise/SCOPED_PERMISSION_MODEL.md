# ASRTAVA Scoped Permission & Negative Authorization Model

## 1. Overview

ASRTAVA's Scoped Authorization Model extends traditional Role-Based Access Control (RBAC) to enforce strict geographical, organizational, and operational boundaries across complex hospital networks.

---

## 2. Core Security Precedence Invariants

Every access decision is computed using a 4-tier precedence evaluation:

$$\text{1. Explicit Individual DENY} \quad \succ \quad \text{2. Explicit Individual ALLOW} \quad \succ \quad \text{3. Scoped Role RBAC} \quad \succ \quad \text{4. Default DENY}$$

```
+---------------------------------------------------------------------------------------------------+
|                                 SCOPED PERMISSION EVALUATION FLOW                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [ API Request from User ] (e.g., Access Patient Record at Hospital B)                            |
|                 │                                                                                 |
|                 ▼                                                                                 |
|  Does an Explicit Individual DENY Exist on this User for Target Resource?                         |
|       ├─► YES ──► RETURN 403 FORBIDDEN (Immediate Termination; Deny Always Wins)                 |
|       └─► NO                                                                                      |
|            │                                                                                      |
|            ▼                                                                                      |
|  Does an Explicit Individual ALLOW Exist on this User?                                            |
|       ├─► YES ──► ALLOW ACTION (Audit Entry Written)                                              |
|       └─► NO                                                                                      |
|            │                                                                                      |
|            ▼                                                                                      |
|  Is User Role Scoped to Target Facility (Organization, Hospital, Branch)?                         |
|       ├─► YES ──► Does Role Contain Required Permission?                                          |
|       │             ├─► YES ──► ALLOW ACTION                                                      |
|       │             └─► NO  ──► RETURN 403 FORBIDDEN                                              |
|       └─► NO  ──► RETURN 403 FORBIDDEN (Cross-Tenant Boundary Rejection)                          |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Organizational Scope Enforcement Rules

1. **Branch Isolation**: A Branch Administrator at Branch X cannot view, edit, or administer Branch Y, even within the same hospital.
2. **Hospital Isolation**: A Hospital Administrator at Hospital 1 cannot administer unrelated Hospital 2.
3. **Group Admin Boundary**: A Group Administrator holds governance privileges across all facilities linked to their organization, but has zero platform-level Super Admin capabilities.
4. **Super Admin Platform Boundary**: Platform Super Administrators manage customer licensing, cloud infrastructure, and hosting, but possess zero standing clinical read rights.
5. **No Frontend-Only Security**: Security boundaries are verified at the Express API routing layer and enforced at the PostgreSQL database kernel via Row-Level Security (`FORCE ROW LEVEL SECURITY`).

