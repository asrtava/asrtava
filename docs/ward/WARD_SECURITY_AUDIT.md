# ASRTAVA — Ward & Bed Management Security & RBAC Audit

## 1. Overview
The Ward and Bed Management module operates under the ASRTAVA zero-trust security model, combining Row-Level Security (RLS) in PostgreSQL with role-based and permission-based route guards in Express.

## 2. Role-Based Access Control (RBAC) Matrix

| Operation | Doctor / Consultant | Ward Nurse / Incharge | Bed Coordinator / Admitting Clerk | Housekeeping Supervisor | Housekeeping Staff |
| :--- | :---: | :---: | :---: | :---: | :---: |
| View Bed Matrix & Occupancy | Read | Read | Read | Read | Read (Assigned) |
| Submit Admission Request | **Create** | Read | Read | Denied | Denied |
| Triage & Approve Admission | Review | Read | **Execute** | Denied | Denied |
| Bed Reservation | Denied | Denied | **Execute** | Denied | Denied |
| Formal Inpatient Admission | Denied | Denied | **Execute** | Denied | Denied |
| Initiate Patient Bed Transfer | **Create** | **Create** | **Execute** | Denied | Denied |
| Housekeeping Assignment | Denied | Read | Read | **Execute** | Denied |
| Housekeeping Cleaning Execution | Denied | Denied | Denied | Denied | **Update** |
| Housekeeping Quality Inspection | Denied | Read | Read | **Authorize** | Denied |
| Formulate Discharge Plan | **Create** | **Update** | Read | Denied | Denied |
| Finalize Clinical Discharge | **Authorize** | Read | Read | Denied | Denied |
| Issue Visitor Pass | Denied | **Create** | **Create** | Denied | Denied |

## 3. Data Protection & Compliance
- **Tenant Isolation**: Every query enforces `tenant_id` and `hospital_id` filtering via database RLS and backend context extraction.
- **Audit Trails**: All status transitions (admission, bed transfer, discharge, cleaning inspection) log actor ID, role, IP address, and cryptographic timestamp.
- **Zero Mocking / Safe Failure**: If connection to the primary database drops during emergency offline mode, local encrypted sqlite queues hold non-critical housekeeping records while critical emergency intake persists.

