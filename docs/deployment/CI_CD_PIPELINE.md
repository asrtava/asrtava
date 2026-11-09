# ASRTAVA CI/CD Automation & Quality Gate Specification

## 1. Pipeline Architecture

ASRTAVA employs GitHub Actions workflows separating continuous integration from controlled continuous delivery:

```
[Git Commit / PR]
       |
       v
[Workflow 1: CI & Quality Gate (.github/workflows/ci.yml)]
├── 1. Static Typecheck (Backend, Web Portal & Mobile)
├── 2. Automated Test Suite (All 118 Tests Across 12 Suites)
├── 3. Frontend Bundle Audit (Assert < 500 kB per Chunk)
└── 4. Docker Multi-Stage Build & Layer Verification
       |
       +---> [Merge to 'main'] ---> [Workflow 2: Staging Deployment (deploy-staging.yml)]
                                           |
                                           v
                             [Tag Release 'v*.*.*' + Manual Approval]
                                           |
                                           v
                             [Workflow 3: Production Release (deploy-production.yml)]
                             ├── 1. Pre-Deployment Automated Database Snapshot
                             ├── 2. Push Tagged Production Containers to ECR
                             ├── 3. Zero-Downtime Rolling Update on ECS Fargate
                             ├── 4. Automated Canary Health & Readiness Check
                             └── 5. Automatic Rollback Hook on Probe Failure
```

---

## 2. Release-Blocking Pipeline Criteria

The CI pipeline rejects any pull request or build if:
1. Any of the 118 automated tests in `backend/tests/` or `patient-mobile/tests/` fails.
2. TypeScript compiler reports a single emit error (`npx tsc --noEmit`).
3. Any frontend chunk exceeds 500 kB uncompressed.
4. Docker multi-stage build fails or base image dependencies fail security scans.

