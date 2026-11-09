# ASRTAVA Authentication & Access Control Verification Test Results

**Document Reference:** `docs/project/AUTHENTICATION_TEST_RESULTS.md`  
**Execution Authority:** ASRTAVA Quality Assurance & Security Lead  
**Test Suite:** `backend/tests/role_selection_and_access_control.test.ts`  
**Test Execution Date:** 2026-11-09  
**Result:** **20 / 20 Scenarios Verified (100% Pass Rate, 0 Regressions)**  

---

## 1. Test Execution Summary

| # | Required Test Scenario | Component Tested | Execution Outcome | Status |
| :-: | :--- | :--- | :--- | :---: |
| **1** | Opening website displays public homepage | Client routing / `PublicHomePage.tsx` | Defaults to `/` public homepage | **PASS** |
| **2** | Navbar contains role dropdown with 11 roles | `PublicNavbar.tsx` (`ROLE_OPTIONS`) | 11 roles with badges & slugs | **PASS** |
| **3** | Selecting Hospital Admin opens `/login/hospital-admin` | Navbar dropdown selection | Redirects to Hospital Admin Gateway | **PASS** |
| **4** | Selecting Doctor opens `/login/doctor` | Navbar dropdown selection | Redirects to Doctor Workspace Login | **PASS** |
| **5** | Selecting Nurse opens `/login/nurse` | Navbar dropdown selection | Redirects to Nurse Workspace Login | **PASS** |
| **6** | Selecting Patient opens `/login/patient` | Navbar dropdown selection | Redirects to Patient Portal Login | **PASS** |
| **7** | Unauthorized person cannot log in merely by selecting role | Backend `/auth/staff-login` | Unknown credentials rejected (401) | **PASS** |
| **8** | Staff account not created via hospital process denied | Staff onboarding verification | Self-registered staff blocked | **PASS** |
| **9** | Deactivated staff account cannot log in | `users.is_active = false` check | Returns 403 Forbidden | **PASS** |
| **10** | Staff member cannot access unassigned role | Backend `authorizedPortals` check | Doctor accessing Finance returns 403 | **PASS** |
| **11** | Staff member cannot gain access by changing URL | Backend token revalidation | URL tampering rejected by API | **PASS** |
| **12** | Hospital Admin can create & authorize staff accounts | `POST /hospitals/staff` | Staff user, profile & role assigned | **PASS** |
| **13** | Hospital Admin cannot access another tenant staff | PostgreSQL RLS tenant check | Cross-tenant access blocked | **PASS** |
| **14** | Hospital Admin cannot promote to Super Admin | Role assignment validator | Super Admin role assignment rejected | **PASS** |
| **15** | Authorized staff member accesses only permitted modules | Workspace resolution engine | Nurse accesses only ward/inpatient | **PASS** |
| **16** | Individual DENY overrides role-level ALLOW | Casbin / `user_permissions` engine | Explicit DENY strictly takes precedence | **PASS** |
| **17** | Patient accounts cannot access staff workspaces | User type boundary check | Patient blocked from clinical portals | **PASS** |
| **18** | Super Admin access remains separate from staff role selector | Route & user type isolation | Super Admin excluded from staff dropdown | **PASS** |
| **19** | Logout invalidates appropriate session | Session store / token revocation | Refresh token invalidated from store | **PASS** |
| **20** | All login & access operations audited | `logAuthEvent` & `audit_logs` | Cryptographic audit logs recorded | **PASS** |

---

## 2. Test Runner Execution Output

```
▶ ASRTAVA Role Selection, Navbar & Hospital Admin Controlled Access Matrix
  ✔ Scenario 1: Opening the website displays the public homepage route by default (0.6818ms)
  ✔ Scenario 2: The existing navbar contains the Login / Select Role dropdown with all 11 roles (0.1598ms)
  ✔ Scenario 3: Selecting Hospital Admin opens the Hospital Admin login page (0.1214ms)
  ✔ Scenario 4: Selecting Doctor opens the Doctor login page (0.1078ms)
  ✔ Scenario 5: Selecting Nurse opens the Nurse login page (0.115ms)
  ✔ Scenario 6: Selecting Patient opens the Patient login page (0.1129ms)
  ✔ Scenario 7: An unauthorized person cannot log in merely by selecting a role (0.1427ms)
  ✔ Scenario 8: A staff account not created through hospital approved process is denied access (0.1144ms)
  ✔ Scenario 9: A deactivated staff account cannot log in (0.1718ms)
  ✔ Scenario 10: A staff member cannot access an unassigned role (Doctor cannot access Finance) (0.1585ms)
  ✔ Scenario 11: A staff member cannot gain access by manually changing the URL (0.1036ms)
  ✔ Scenario 12: A Hospital Admin can create and authorize staff accounts within their hospital (0.1204ms)
  ✔ Scenario 13: A Hospital Admin cannot access another tenant staff records (0.0843ms)
  ✔ Scenario 14: A Hospital Admin cannot promote themselves or staff to Super Admin (0.0924ms)
  ✔ Scenario 15: An authorized staff member can access only permitted modules (0.0797ms)
  ✔ Scenario 16: Individual DENY permissions override role-level ALLOW permissions (0.0799ms)
  ✔ Scenario 17: Patient accounts cannot access staff workspaces (0.0675ms)
  ✔ Scenario 18: Super Admin access remains separate from staff role selector (0.1051ms)
  ✔ Scenario 19: Logout invalidates the appropriate session and refresh token (0.0975ms)
  ✔ Scenario 20: All login and access-management operations are audited with cryptographic timestamps (1.4671ms)
✔ ASRTAVA Role Selection, Navbar & Hospital Admin Controlled Access Matrix (504.5844ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 509.5489
```

---

## 3. Web Portal Build Metrics

```
vite v6.4.5 building for production...
transforming...
✓ 1664 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.69 kB │ gzip:  0.40 kB
dist/assets/index-Cwxeixcg.css   51.12 kB │ gzip:  8.47 kB
dist/assets/icons-grRH2JO_.js    35.02 kB │ gzip:  8.45 kB
dist/assets/vendor-Ca8YXfDF.js  134.66 kB │ gzip: 43.22 kB
dist/assets/index-CVj_6Db0.js   408.68 kB │ gzip: 94.75 kB
✓ built in 5.92s
```
Maximum chunk size (408.68 kB) remains strictly below the 500 kB budget threshold.

