# ASRTAVA — Employee Lifecycle Validation

## 1. Overview
The Employee Lifecycle engine coordinates talent acquisition, document verification, departmental assignment, credential maintenance, and exit management.

## 2. Invariants & Security Rules
1. **Unique Employee Identifier**: Each employee receives an immutable, hospital-scoped identifier (e.g. `EMP-DOC-8801`). The system rejects attempts to reuse active or historical employee codes.
2. **Restricted Identity Linking**: Creating an employee master record does **not** grant portal access. Linking an employee to a login account requires explicit admin authorization (`linkUserAccount`).
3. **Preservation of Historical Employment Data**: When an employee resigns or is terminated, their profile is marked `is_active = FALSE` and status set to `RESIGNED` or `TERMINATED`. Historical records (payroll, medical notes signed, duty shifts) are **never deleted**.
4. **Instantaneous Access Revocation**: When the separation record is finalized, the system immediately deactivates `users.is_active = FALSE` and revokes all active session token families, blocking any further API access.

