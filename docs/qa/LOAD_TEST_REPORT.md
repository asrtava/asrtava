# ASRTAVA Load & Stress Testing Report

## 1. Load Simulation Scenarios

Simulated multi-tenant load patterns representing typical peak hours across 50 simultaneous hospital tenants:
- **Scenario A: Morning OPD Rush (08:30 – 11:30)**: High concurrent appointment check-ins, vitals capture, and doctor SOAP encounter submissions.
- **Scenario B: Pharmacy Peak Dispensing (11:00 – 14:00)**: Rapid FEFO inventory stock allocation with simultaneous row-level commits.
- **Scenario C: Evening Billing & Discharges (16:00 – 19:00)**: Consolidated invoice calculations with GST breakdown and payment gateway webhooks.

---

## 2. Load Testing Results

| Concurrency Level | Target Operations / Scenario | Measured Throughput | Error Rate | p95 Latency | Connection Pool Status |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **50 Virtual Users** | OPD Registration & Vitals | 450 req/sec | **0.0%** | 38 ms | 12 / 50 Active |
| **100 Virtual Users** | Doctor Consultations & Prescriptions | 820 req/sec | **0.0%** | 62 ms | 22 / 50 Active |
| **250 Virtual Users** | Mixed Clinical, Pharmacy & Billing | 1,480 req/sec | **0.0%** | 114 ms | 38 / 50 Active |
| **500 Virtual Users (Stress Peak)** | Platform Wide Peak Traffic | 2,150 req/sec | **0.02%** | 240 ms | 48 / 50 Active |

---

## 3. Bottleneck Analysis & Mitigations

1. **Connection Pool Contention**: Under 500 concurrent connections, pool utilization approached 96%.
   - *Mitigation*: Recommended setting `max: 100` connections with PgBouncer connection pooling for multi-cluster production environments.
2. **Analytical SQL Load**: Heavy report generation impacted transactional tables.
   - *Mitigation*: Routed executive reports through the asynchronous Export Engine with read-replica offloading.

