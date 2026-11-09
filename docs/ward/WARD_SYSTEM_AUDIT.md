# ASRTAVA Ward & Bed Management System Audit

## 1. Executive Summary
Ward and Bed Management is the core operational backbone of hospital inpatient care. It orchestrates the patient journey from admission request through bed allocation, ward stay, clinical rounds, transfers, housekeeping turnaround, and discharge planning.

## 2. Existing Baseline Analysis
The initial codebase featured rudimentary bed allocation routes (`backend/src/modules/inpatient/inpatient.routes.ts`) with basic tables (`wards`, `rooms`, `beds`, `admissions`, `bed_allocations`). However, several critical real-world hospital operational capabilities were missing or incomplete:
- **Missing Infrastructure Hierarchy**: No multi-level modeling of Buildings, Floors, and Departments above Wards.
- **Incomplete Bed State Lifecycle**: Beds immediately jumped between `available` and `occupied`, lacking `reserved`, `cleaning_required`, `cleaning_in_progress`, `maintenance`, and supervisor inspection release gates.
- **No Admission Request Staging**: OPD and Emergency doctors could not submit structured admission requests awaiting bed coordinator triage and administrative approval.
- **Lack of Housekeeping Turnover Workflow**: No formal task assignment, terminal vs. isolation cleaning protocols, or inspection sign-offs before bed release.
- **No Early Discharge Planning**: Discharge planning was treated as a last-minute event rather than a proactive process with barrier tracking and medication reconciliation.
- **Absence of Visitor / Attendant Pass Management**: No digital gate pass tracking or hospital visiting hour enforcement.
- **Unmanaged Ward Equipment**: No traceability of bedside monitors, syringe pumps, or patient transfer equipment assigned to physical beds.

## 3. ASRTAVA Target Architecture Mandates
1. Seven-tier Infrastructure Hierarchy: Hospital → Building → Floor → Department → Ward → Room → Bed.
2. Complete 8-state Bed Lifecycle with transaction-level concurrency locks preventing double-booking.
3. Pre-admission request staging with clinical priority and isolation requirement filters.
4. Housekeeping terminal cleaning workflow with supervisor inspection before bed flips to `available`.
5. Proactive discharge planning tracking barriers, pending investigations, and follow-up care.
6. Decoupled clinical discharge: Clinical discharge summary authorization is strictly decoupled from cashier payment processing.
7. Full patient movement history and visitor pass issuance.

