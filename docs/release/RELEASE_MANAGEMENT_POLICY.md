# ASRTAVA Release Management Policy & Versioning Strategy

**Document Reference:** `docs/release/RELEASE_MANAGEMENT_POLICY.md`  
**Standard:** Semantic Versioning 2.0.0 (SemVer) & ITIL Release, Control and Validation (RCV)  
**Release Target:** ASRTAVA 1.0.0-RC1 (Release Candidate 1)

---

## 1. Semantic Versioning Strategy

ASRTAVA enforces strict **Semantic Versioning (MAJOR.MINOR.PATCH)** across backend services, frontend portals, and mobile client artifacts:

```
  v MAJOR . MINOR . PATCH - TAG
     |       |       |       |
     |       |       |       +---> [ RC1, RC2, STAGING, PROD ]
     |       |       +-----------> Bug fixes, security patches, non-breaking schema updates
     |       +-------------------> Backward-compatible clinical features, new reports, gateway additions
     +---------------------------> Breaking database schema changes, major clinical workflow redesign
```

- **Backend API (`backend/package.json`)**: `1.0.0`
- **Web Portal (`apps/web-portal/package.json`)**: `1.0.0`
- **Patient Mobile App (`apps/patient-mobile/package.json`)**: `versionName: "1.0.0"`, `versionCode: 10001`
- **Database Migrations (`database/migrations/*.sql`)**: Monotonically incrementing 3-digit prefix (`001_...` to `018_...`).

---

## 2. Formal 15-Step Production Release Workflow

Before any software artifact is deployed to production, it must successfully complete all 15 stages of the release pipeline:

```
 1. Feature Freeze & Branch Cut (`release/v1.0.0`)
 2. Automated Static Analysis & TypeScript Typecheck
 3. Automated Regression Suite Execution (118/118 Tests)
 4. Frontend Web Bundle Audit (All Chunks < 500 kB)
 5. Mobile Artifact Build & Signing Verification (AAB/IPA)
 6. Container Image Vulnerability Scan (Trivy / ECR Scan)
 7. Database Migration Dry-Run & Rollback Validation
 8. Secrets & Environment Configuration Verification
 9. Staging Cluster Deployment & Automated Canary Checks
10. SRE Operational Readiness & On-Call Briefing
11. Formal Change Advisory Board (CAB) Sign-Off
12. Pre-Deployment Automated Database Snapshot (PITR)
13. Zero-Downtime Rolling Update on ECS Fargate Cluster
14. Production Smoke Test Verification (Test Tenant Only)
15. Post-Deployment Telemetry Monitoring & Release Tagging
```

---

## 3. Deployment Window & Change Advisory Board (CAB)

- **Standard Deployment Window**: **Sunday 02:00 IST – 04:00 IST** (lowest patient OPD traffic).
- **Emergency Hotfix Exception**: P0 critical security vulnerabilities or clinical data corruption bugs may be deployed out-of-band with simultaneous sign-off by the Lead Architect and Security Officer.
- **Rollback Decision Trigger**: Any deployment causing > 1% 5xx errors or failing the post-deployment canary healthcheck automatically initiates rollback within 5 minutes.

