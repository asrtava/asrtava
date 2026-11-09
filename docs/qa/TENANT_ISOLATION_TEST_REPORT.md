# ASRTAVA Multi-Tenant Isolation & Negative Authorization Test Report

## 1. Test Methodology

Multi-tenant isolation testing evaluated whether an authenticated user from Hospital Alpha (`hosp-alpha-blr`) could access, inspect, or modify records belonging to Hospital Beta (`hosp-beta-del`) across all operational entities.

Tests executed via `backend/tests/tenant_isolation_matrix.test.ts` under non-superuser database roles.

---

## 2. Matrix Verification Results

| # | Target Domain Entity | Attack Scenario Simulated | Authorization Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| **1** | **Patients & Demographics** | Doctor Alpha submits `pat-beta-01` UUID | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **2** | **Appointments & Queues** | Staff Alpha requests Beta doctor schedule | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **3** | **Clinical Encounters** | Doctor Alpha requests Beta consultation notes | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **4** | **IPD Bed Inventory** | Nursing Alpha attempts to allocate Beta ICU bed | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **5** | **Pharmacy Inventory** | Pharmacist Alpha queries or deducts Beta stock | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **6** | **Laboratory Diagnostics** | Lab Alpha staff views Beta lab report results | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **7** | **Invoices & Billing** | Finance Alpha attempts to view or collect Beta bill | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **8** | **Patient Documents** | Staff Alpha attempts to download Beta CT scan | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **9** | **Staff & HR Rosters** | Admin Alpha requests Beta doctor employee roster | Rejected with `403 CROSS_TENANT_FORBIDDEN` | **PASSED** |
| **10**| **Platform JIT Guard** | Super Admin queries clinical route without JIT | Rejected with `403 SUPPORT_SESSION_REQUIRED` | **PASSED** |

---

## 3. Defense-in-Depth Assessment

Isolation is enforced at two independent technical layers:
1. **Application Gateway Layer (`TenantIsolationGuard`)**: Validates entity tenant foreign keys against verified JWT claims before passing down to database services.
2. **Database Engine Layer (PostgreSQL RLS)**: `SET LOCAL app.current_tenant_id = ?;` guarantees that queries can never see rows belonging to other hospital tenants even in the event of missing `WHERE` clauses.

