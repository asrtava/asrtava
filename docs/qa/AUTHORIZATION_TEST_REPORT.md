# ASRTAVA Authorization Engine & DENY Precedence Test Report

## 1. Authorization Precedence Rules

ASRTAVA implements a strict 4-tier authorization evaluation hierarchy:
$$\text{Explicit Individual DENY} \succ \text{Explicit Individual ALLOW} \succ \text{Role-Based Access Control (RBAC)} \succ \text{Default Deny}$$

---

## 2. Precedence Evaluation Scenarios

| Scenario | Role Permissions | Individual Override Record | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **A. Standard RBAC** | Doctor role includes `view:patients` | None | ALLOWED | ALLOWED | **PASSED** |
| **B. Explicit DENY Overrides Role** | Doctor role includes `view:patients` | `is_granted: false` on `view:patients` | **FORBIDDEN (403)** | **FORBIDDEN (403)** | **PASSED** |
| **C. Explicit ALLOW Overrides Missing Role** | Reception role lacks `edit:prescriptions` | `is_granted: true` on `edit:prescriptions` | ALLOWED | ALLOWED | **PASSED** |
| **D. Expired Custom Override** | Doctor role includes `view:patients` | `is_granted: false`, expired yesterday | ALLOWED (falls back to role) | ALLOWED | **PASSED** |
| **E. Default Deny** | Role lacks permission | None | **FORBIDDEN (403)** | **FORBIDDEN (403)** | **PASSED** |
| **F. Tenant Workspace Switching** | Staff member active in Hospital Alpha | Switches context to Hospital Beta without membership | **FORBIDDEN (403)** | **FORBIDDEN (403)** | **PASSED** |
| **G. Portal Escape via URL** | User has Doctor role | Navigates directly to `/finance` or `/hr` | Redirected to `/portal/doctor` | Redirected | **PASSED** |

---

## 3. Super Admin Clinical Access Boundary

Under HIPAA §164.312 and DPDP Act 2023, platform super administrators have zero continuous standing access to hospital patient health data:
- Platform support access requires a Hospital Administrator to grant a time-bound Just-In-Time (JIT) support token.
- When an expired or ungranted JIT token is used to access clinical records, the backend rejects the request with HTTP 403 (`SUPPORT_SESSION_REQUIRED`).

