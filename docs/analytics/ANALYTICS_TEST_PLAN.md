# ASRTAVA Enterprise Data Warehouse & Analytics Test Plan

## 1. Overview
This test plan defines the validation procedures for the ASRTAVA Enterprise Data Warehouse, Business Intelligence, and Predictive Analytics platform (Prompt 28 of 30).

## 2. Test Objectives
- Verify Star Schema dimension table generation (`dim_date`, `dim_patient`, `dim_doctor`, `dim_department`).
- Verify DPDP-compliant cryptographic salt pseudonymization of patient identifiers.
- Verify Fact table ingestion (`fact_opd_encounters`, `fact_ipd_admissions`, `fact_financial_daily`, `fact_surgical_operations`, `fact_ed_inflow`).
- Validate formulations for core hospital C-suite KPIs:
  - Average Length of Stay (ALOS)
  - Bed Occupancy Rate (BOR)
  - Bed Turnover Rate (BTR)
  - Inpatient Mortality Rate
  - Days in Accounts Receivable (AR Days)
  - Clean Claim Rate Percentage
- Validate real-time predictive models:
  - LACE+ 30-Day Readmission Risk Index (0-19 points scale, risk tiers, clinical action triggers)
  - OPD Appointment No-Show Classifier (logistic regression model with overbooking recommendations)
  - Inpatient Bed Occupancy & Shortage Forecaster (24-48h horizon)
  - Pharmacy Drug Consumption Velocity & Run-Out Predictor
- Verify multi-tenant isolation across analytical data marts.

## 3. Test Suites & Execution
Implemented in `backend/tests/advanced_analytics_and_edw.test.ts` (16 test scenarios) and executed with Node.js test runner.

