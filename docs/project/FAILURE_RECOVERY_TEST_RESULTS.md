# ASRTAVA — Failure & Recovery Test Results

**Test Suite:** `backend/tests/real_world_hospital_simulation.test.ts`  
**Execution Timestamp:** 2026-11-09T12:21:54Z  
**Duration:** 2.343ms  
**Result:** **100% PASSED (0 Failures)**

---

## 1. Test Execution Breakdown

| Step | Operation Tested | Expected Behavior | Actual Observed Outcome | Verdict |
|------|------------------|-------------------|-------------------------|---------|
| 9.1 | Mid-Transaction Failure Simulation | Simulated disk I/O failure during consultation creation (Step 2 of multi-table transaction). | Exception caught: `DISK_IO_FAILURE_ON_CONSULTATION`. | **PASS** |
| 9.2 | Atomic Database Rollback | Transaction aborts; appointment update, consultation, and prescription records are completely rolled back. | Zero dirty state remaining: `appointmentUpdated: false`, `consultationCreated: false`. | **PASS** |
| 9.3 | Healthy Transaction Execution | Subsequent clean transaction executes to completion without lingering lock or failure side-effects. | All 3 entities created cleanly (`success: true`). | **PASS** |
| 9.4 | Concurrency Benchmarks | 500 authorization and security verification operations executed at high concurrency. | Total duration 480ms (Average latency 0.96ms per check). | **PASS** |

---

## 2. Technical Evidence & Logs

```
▶ Scenario 9: Failure Recovery, Database Rollback Integrity & Error Resiliency (2.3434ms)
  ✔ Simulated failure at Step 2 (DISK_IO_FAILURE_ON_CONSULTATION)
  ✔ Rollback verified: appointment = false, consultation = false, prescription = false
  ✔ Clean transaction retry succeeds: all 3 steps true
▶ Scenario 10: Performance & Latency Benchmark Across Core Workflows (480.0161ms)
  ✔ 500 cryptographic authorization iterations completed
  ✔ Average latency: 0.96ms (< 1.0ms target)
```

