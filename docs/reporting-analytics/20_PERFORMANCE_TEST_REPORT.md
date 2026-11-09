# ASRTAVA Analytics Performance Test Report

## 1. Test Environment
- **Platform**: Node.js v22 TypeScript Backend
- **Runner**: `node:test` + `ts-node`
- **Executed At**: 2026-11-09T09:01:20Z
- **Test File**: `backend/tests/reporting_analytics.test.ts`
- **Result**: **9 / 9 Passing (100% Pass Rate)**
- **Full Backend Suite**: **72 / 72 Passing across all modules**

## 2. Latency Benchmarks
| Benchmark Target | Metric / Query | Measured Duration | Status |
|---|---|---|---|
| KPI Formula Calculation | ALOS & Bed Occupancy calculation | 0.94 ms | **PASSED** |
| SaaS MRR/ARR Calculation | Run-rate & Churn computation | 0.25 ms | **PASSED** |
| Financial Balance Equation | Double-entry accrual check | 0.20 ms | **PASSED** |
| Query Builder Injection Test | Rejection of unauthorized dataset | 1.89 ms | **PASSED** |
| Whitelisted Field Inspection | Metadata catalog retrieval | 0.33 ms | **PASSED** |
| Async Export Job Initiation | Token generation & job creation | 2.46 ms | **PASSED** |
| RFC-4180 CSV Transformation | Tabular formatting & quote escaping | 0.47 ms | **PASSED** |
| Scheduled Run Calculation | Next CRON run-time computation | 0.39 ms | **PASSED** |
| Reconciliation Variance Scan | Anomaly detection on invoice ledgers | 0.29 ms | **PASSED** |

