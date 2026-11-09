# ASRTAVA Centralized Testing Architecture & Developer Execution Guide

## 1. Directory Structure

The automated testing framework is centralized under `backend/tests/` and `apps/patient-mobile/tests/`:

```
c:\Users\madha\Desktop\Medical_Project\
├── backend/
│   ├── tests/
│   │   ├── e2e_workflows.test.ts          # End-to-end 10-step complete hospital patient journey
│   │   ├── tenant_isolation_matrix.test.ts# Multi-tenant cross-boundary negative security matrix
│   │   ├── api_contracts.test.ts          # Schema validation, error envelope, and idempotency tests
│   │   ├── performance_benchmarks.test.ts # Throughput, latency percentiles, and memory benchmarks
│   │   ├── security_hardening.test.ts     # NIST password policy, throttling, token replay, DSR
│   │   ├── reporting_analytics.test.ts    # KPI metric calculations, SQL injection guard, CSV export
│   │   ├── integrations.test.ts           # WhatsApp, SMS, SES, Razorpay, PACS DICOM, LIS HL7
│   │   ├── saas_platform.test.ts          # Tenant provisioning, subscriptions, usage quotas, JIT
│   │   ├── hospital_workflows.test.ts     # Patient deduplication, double-booking, FEFO, decimal GST
│   │   ├── auth.test.ts                   # TOTP MFA, bcrypt high-cost, explicit DENY precedence
│   │   └── api.test.ts                    # Token claims, portal routing, payment idempotency
│   └── package.json                       # Centralized "npm test" orchestration script
├── apps/
│   ├── web-portal/                        # Vite React + TypeScript production application
│   └── patient-mobile/
│       └── tests/
│           └── patient_mobile.test.ts     # Mobile tokens, QR passes, deep link security
└── docs/
    └── qa/                                # 16 comprehensive QA deliverables & reports
```

---

## 2. Developer Test Execution Commands

### Execute Entire Unified Test Suite (118 Tests Across 12 Suites)
```bash
cd backend
npm test
```

### Execute Specialized Test Suites Individually

#### 1. End-to-End Hospital Patient Journey
```bash
cd backend
npx ts-node tests/e2e_workflows.test.ts
```

#### 2. Multi-Tenant Negative Isolation Matrix
```bash
cd backend
npx ts-node tests/tenant_isolation_matrix.test.ts
```

#### 3. API Contract & Boundary Conditions
```bash
cd backend
npx ts-node tests/api_contracts.test.ts
```

#### 4. Performance & Scalability Benchmarks
```bash
cd backend
npx ts-node tests/performance_benchmarks.test.ts
```

#### 5. Security Hardening, Token Replay & Data Privacy
```bash
cd backend
npx ts-node tests/security_hardening.test.ts
```

#### 6. Patient Native Mobile Architecture Tests
```bash
cd backend
npx ts-node --project tsconfig.json ../apps/patient-mobile/tests/patient_mobile.test.ts
```

---

## 3. Web Portal Build & Chunk Optimization Verification

To verify that the frontend compiles cleanly and respects Rollup manual vendor chunk splitting:
```bash
cd apps/web-portal
npm run build
```
Target bundle metric: All chunks $< 500 \text{ kB}$.

