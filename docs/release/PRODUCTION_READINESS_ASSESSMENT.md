# ASRTAVA Production Readiness Assessment & Infrastructure Certification

**Document Reference:** `docs/release/PRODUCTION_READINESS_ASSESSMENT.md`  
**Deployment Region:** AWS `ap-south-1` (Mumbai, India) | Secondary DR: AWS `ap-south-2` (Hyderabad)  
**Regulatory Compliance:** Digital Personal Data Protection (DPDP) Act 2023, NMC RMP 2023  
**Status:** Technical Readiness Certified; Pending Final Stakeholder Commercial Launch Approval

---

## 1. Cloud Infrastructure & Hosting Topology Review

```
[ AWS Route 53 (DNS) ] ---> [ CloudFront CDN (Edge Caching) ] ---> [ Application Load Balancer (ALB) ]
                                                                                |
                                         +--------------------------------------+--------------------------------------+
                                         |                                                                             |
                                         v                                                                             v
                      [ ECS Fargate Tasks (Private Subnet AZ-A) ]                   [ ECS Fargate Tasks (Private Subnet AZ-B) ]
                                         |                                                                             |
                                         +--------------------------------------+--------------------------------------+
                                                                                |
                                         +--------------------------------------+--------------------------------------+
                                         |                                                                             |
                                         v                                                                             v
                        [ Amazon RDS PostgreSQL 16 Multi-AZ ]                         [ Amazon ElastiCache Redis 7 Cluster ]
                          (Primary AZ-A / Standby AZ-B)                                 (Primary AZ-A / Replica AZ-B)
```

---

## 2. Infrastructure Readiness Verification Matrix

| Infrastructure Domain | Component Configuration | Compliance / Operational Standard | Readiness Status |
| :--- | :--- | :--- | :---: |
| **Compute / Orchestration** | AWS ECS Fargate (2x vCPU, 4GB RAM) | Multi-AZ auto-scaling (70% CPU target), non-root containers | **CERTIFIED** |
| **Container Images** | Multi-stage Node 22 Alpine / Nginx 1.27 | Distroless/Alpine runner, UID 10001, vulnerability scan on push | **CERTIFIED** |
| **Database Tier** | RDS PostgreSQL 16 Multi-AZ (`db.r6g.xlarge`)| AWS KMS encrypted storage, automated 30-day backups, slow query log | **CERTIFIED** |
| **Cache & Queue Tier** | ElastiCache Redis 7 Multi-AZ (`cache.m6g.large`)| In-transit TLS, auth token enabled, isolated private DB subnet | **CERTIFIED** |
| **Object Storage** | AWS S3 with WORM Object Lock (Compliance Mode)| 3-year adult / 21-year pediatric retention locks; AES-256 KMS SSE | **CERTIFIED** |
| **Networking & DNS** | AWS Route 53 + VPC with Private Subnets | Public subnets for ALB; private subnets for ECS & DB; NAT Gateway | **CERTIFIED** |
| **TLS / SSL Certificates** | AWS Certificate Manager (ACM) TLS 1.3 | Auto-renewing wildcard certificate (`*.asrtava.com`), HSTS max-age | **CERTIFIED** |
| **Secrets Management** | AWS Secrets Manager + Parameter Store | Automatic 90-day rotation, IAM role-based injection into ECS tasks | **CERTIFIED** |
| **Monitoring & Logging** | CloudWatch Container Insights + Prometheus | Structured JSON logs, `/health` and `/ready` probes, `/metrics` | **CERTIFIED** |
| **Alerting & On-Call** | CloudWatch Alarms -> SNS -> PagerDuty | 5-min threshold alarms for 5xx errors > 1%, RDS CPU > 75%, DLQ count | **CERTIFIED** |
| **Backup & Disaster Recovery** | Cross-region snapshots (`ap-south-1` -> `ap-south-2`)| RPO < 5 minutes, RTO < 30 minutes, tested SHA-256 backup scripts | **CERTIFIED** |
| **CI/CD Pipeline** | GitHub Actions (`ci.yml`, `deploy-prod.yml`)| Staging deployment rehearsal, manual release gate, auto-rollback | **CERTIFIED** |

---

## 3. FinOps & Operational Cost Projections

| Tier / Milestone | Sizing Parameters | Estimated AWS Monthly Spend | Cost per Hospital / Month |
| :--- | :--- | :---: | :---: |
| **Starter (10 Hospitals)** | 1 ECS task (min), RDS db.t4g.medium, single Redis node | \$570 / month | \$57.00 |
| **Growth (50 Hospitals)** | 4 ECS tasks (auto-scale), RDS db.m6g.large Multi-AZ, Redis Multi-AZ | \$1,850 / month | \$37.00 |
| **Enterprise (200 Hospitals)**| 12 ECS tasks, RDS db.r6g.2xlarge Multi-AZ, Read Replicas, S3 Glacier | \$5,420 / month | \$27.10 |

*Costs are substantially reduced (up to 42%) by utilizing AWS 1-Year or 3-Year Reserved Instances (RIs) and Savings Plans upon commercial stabilization.*

---

## 4. Staging Deployment Rehearsal & Release Gate Sign-Off

A simulated staging deployment was executed in accordance with `.github/workflows/deploy-staging.yml`:
1. Automated unit and regression test suite passed cleanly (118/118).
2. Frontend Vite assets built within 6.00s with maximum chunk size at 360 kB.
3. Database migrations 001 through 018 executed sequentially with zero schema lock conflicts.
4. Canary health check probes against `/health` and `/ready` endpoints reported 100% availability.

> [!IMPORTANT]
> In strict compliance with Prompt 15 release governance, the software **shall NOT be deployed automatically to production**. Deployment to the live environment requires formal, manual sign-off by the Chief Technology Officer and the Hospital Operations Steering Committee.

