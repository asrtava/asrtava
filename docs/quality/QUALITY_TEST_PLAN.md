# ASRTAVA Quality Management & Accreditation Test Plan

## 1. Overview
This test plan defines the validation procedures for the ASRTAVA Quality Management, Infection Control, Patient Safety, Incident Reporting, Clinical Governance, and Accreditation Management System (Prompt 27 of 30).

## 2. Test Objectives
- Verify incident lifecycle: reporting, classification (Near Miss, Adverse Event, Sentinel Event), 5-Whys/Fishbone RCA, and mandatory anonymous whistleblowing.
- Verify Closed-Loop CAPA: ensure status cannot jump to `VERIFIED_CLOSED` without independent auditor validation of corrective effectiveness.
- Verify Healthcare-Associated Infection (HAI) surveillance calculations: CAUTI, CLABSI, and VAP rates per 1,000 device exposure days.
- Verify Hand Hygiene compliance monitoring (WHO 5 Moments) and observational audits.
- Verify Clinical Indicator tracking, departmental peer reviews, and morbidity/mortality (M&M) reviews.
- Verify Patient Grievance redressal with statutory resolution SLAs and escalation pathways.
- Verify Accreditation Readiness auditing against NABH 5th Edition and NABL ISO 15189 standards.
- Verify SOP and Controlled Clinical Document version control, review cycles, and staff read-receipt compliance.
- Verify Proactive Clinical Risk Register (5x5 matrix, Inherent vs. Residual risk scores).

## 3. Test Suites & Execution Scope
The suite is implemented in `backend/tests/advanced_quality_and_accreditation.test.ts` and executed via Node.js native test runner:
1. `reports a clinical incident with classification and severity (Near Miss / Adverse / Sentinel)`
2. `supports anonymous incident whistleblowing without leaking reporter credentials`
3. `conducts Root Cause Analysis (RCA) using 5-Whys methodology`
4. `implements Closed-Loop CAPA requiring independent auditor effectiveness verification`
5. `records HAI surveillance and calculates infection rates per 1,000 device days`
6. `records Hand Hygiene observational audits based on WHO 5 Moments`
7. `monitors clinical quality indicators against target benchmarks`
8. `manages clinical audit lifecycle from planning through findings and follow-up`
9. `registers and tracks patient grievance with statutory SLA countdown`
10. `assesses hospital risks using 5x5 likelihood-impact matrix (Inherent vs Residual)`
11. `evaluates NABH 5th Edition accreditation standard compliance`
12. `enforces document control lifecycle for clinical SOPs with version bump`
13. `conducts morbidity and mortality (M&M) clinical peer reviews`
14. `tracks bio-medical waste (BMW) segregation and Barcode manifest disposal`
15. `verifies multi-tenant isolation for incidents and quality audits`
16. `computes hospital-wide Quality & Patient Safety composite index`

## 4. Test Acceptance Criteria
- 100% test execution pass rate with zero flaky tests.
- Execution under 50ms for the entire in-memory test suite.
- Strict PostgreSQL RLS validation ensuring cross-tenant isolation of incident and audit records.

