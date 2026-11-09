# ASRTAVA — Ward & Bed Management Test Plan

## 1. Executive Summary & Purpose
This document outlines the comprehensive test plan for the ASRTAVA Complete Ward Management, Bed Management, IPD Admission, Discharge, Transfer & Patient Flow module (Prompt 23 of 30). The test suite exercises every stage of the inpatient journey, from multi-tier facility hierarchy creation to admission request triage, bed reservation, formal admission, inter-bed/ward transfers, terminal housekeeping, supervisor sanitization inspection, proactive discharge planning, and final clinical discharge.

## 2. Test Architecture & Environment
- **Harness**: Node.js Native Test Runner (`node:test`, `node:assert/strict`) via `ts-node`.
- **Database Engine**: PostgreSQL with Row-Level Security (RLS) schemas (`030_complete_ward_and_bed_lifecycle_management.sql`).
- **Service Layer**: `WardAdvancedService` (`backend/src/modules/inpatient/ward-advanced.service.ts`).
- **API Routes**: `/api/v1/inpatient/ward/advanced` (`backend/src/modules/inpatient/ward-advanced.routes.ts`).
- **Execution Target**: `backend/tests/advanced_ward_bed_management.test.ts`.

## 3. Test Scenarios Matrix

| Scenario # | Test Case Description | Core Validation Points |
| :--- | :--- | :--- |
| **01** | Multi-Tier Infrastructure Hierarchy Registration | Validates creation of Building -> Floor -> Department -> Ward Unit -> Room -> Bed. Verifies foreign keys, room types, and equipment features (oxygen, ventilator, telemetry). |
| **02** | Dynamic Bed Availability & Occupancy Metrics | Asserts calculation of total beds, available, occupied, reserved, cleaning required, and occupancy percentage directly from current bed state tables. |
| **03** | Inpatient Admission Request Ingestion | Validates clinical admission requests with priority (URGENT, ROUTINE, EMERGENCY), provisional diagnosis, specialty, and preferred room type. |
| **04** | Admission Request Coordinator Triage | Verifies triage status transition from PENDING to APPROVED with triage notes and reviewer identity. |
| **05** | Time-Bound Bed Holding Reservation | Verifies reservation holding window (e.g. 45-minute expiry window) and updates bed status to `reserved`. |
| **06** | Double-Reservation Prevention | Negative test verifying that attempting to reserve an already reserved bed throws a 409 Conflict. |
| **07** | Inpatient Formal Admission Execution | Validates generation of unique IPD number (`IPD-YYYY-XXXXX`), status transition to `ADMITTED`, and bed transition to `occupied`. |
| **08** | Double-Admission Concurrency Guard | Negative test verifying that allocating an occupied bed to another admission request is strictly rejected with a 409 Conflict. |
| **09** | Clinical Inter-Bed / Ward Transfer | Validates transfer execution: new bed becomes `occupied`, transfer log is recorded with clinical rationale, and source bed is immediately transitioned to `cleaning_required`. |
| **10** | Unavailable Transfer Target Guard | Negative test ensuring transfer fails if the destination bed is occupied or in maintenance. |
| **11** | Housekeeping Task Progression | Verifies terminal cleaning task dispatch and progression from `PENDING` to `IN_PROGRESS` upon staff assignment. |
| **12** | Housekeeping Terminal Sanitization Completion | Validates logging of terminal sanitization checklist and chemicals used, queuing task for supervisor inspection. |
| **13** | Supervisor Quality Inspection & Bed Release | Validates that ONLY after a supervisor inspects and approves sanitization does the bed status flip back to `available`. |
| **14** | Inspection Rejection & Rework Loop | Validates that a failed inspection keeps the bed in `cleaning_required` and logs rejection notes for rework. |
| **15** | Proactive Discharge Planning Documentation | Validates multidisciplinary discharge planning: target discharge date, transportation needs, family education, medication reconciliation, and barrier tracking. |
| **16** | Clinical Discharge Finalization & Bed Release | Validates clinical discharge summary completion, setting admission status to `DISCHARGED`, and automatically transitioning the vacated bed to `cleaning_required`. |

## 4. Exit Criteria & Quality Gates
1. 100% of test scenarios in `advanced_ward_bed_management.test.ts` must pass.
2. Zero regressions across all prior modules (374+ existing backend tests).
3. Zero TypeScript compiler warnings or errors (`npm --prefix backend run build` code 0).
4. Web Portal TypeScript bundle compiled cleanly (`npm --prefix apps/web-portal run build` code 0).

