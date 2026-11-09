# ASRTAVA Capacity Planning & Multi-Tenant Sizing Model

## 1. Capacity Tiers & Sizing Assumptions

Based on the measured performance benchmarks in Stage 13 (JWT throughput 7,566 ops/sec, audit latency 55.2µs), ASRTAVA defines three operational capacity tiers:

| Capacity Tier | Supported Hospitals | Total Concurrent Staff | Total Patient Records | Daily Consultations | Daily Invoices |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Small Deployment** | 5 – 15 Hospitals | 250 – 750 Users | 50,000 – 150,000 | 1,500 – 4,500 | 1,000 – 3,000 |
| **Medium Deployment** | 20 – 60 Hospitals | 1,000 – 3,000 Users | 250,000 – 1,000,000 | 8,000 – 25,000 | 5,000 – 18,000 |
| **Large Deployment** | 100 – 250+ Hospitals | 5,000 – 15,000+ Users | 2,500,000 – 10,000,000 | 50,000 – 150,000 | 35,000 – 100,000 |

---

## 2. Infrastructure Resource Allocation by Tier

| Infrastructure Component | Small Deployment | Medium Deployment | Large Deployment |
| :--- | :--- | :--- | :--- |
| **Backend Compute (ECS Fargate)** | 2 Tasks (1 vCPU, 2 GB RAM) | 4 – 8 Tasks (2 vCPU, 4 GB RAM) | 12 – 24 Tasks (4 vCPU, 8 GB RAM) |
| **Web Portal (Nginx)** | 2 Tasks (0.5 vCPU, 512 MB) | 4 Tasks (1 vCPU, 1 GB RAM) | 8 Tasks (2 vCPU, 2 GB RAM) |
| **PostgreSQL Database** | RDS `db.r6g.large` (2 vCPU, 16 GB) | Aurora Serverless v2 (4 – 16 ACUs) | Aurora Serverless v2 (16 – 64 ACUs) + 2 Read Replicas |
| **Redis Cache (ElastiCache)** | `cache.t4g.medium` (1.5 GB) | `cache.m6g.large` (6.3 GB) Multi-AZ | `cache.r6g.xlarge` (26 GB) Cluster Mode |
| **Object Storage (S3)** | 250 GB / Month | 2 TB / Month | 15 TB / Month |
| **Network Throughput** | ~10 Mbps continuous | ~80 Mbps continuous | ~500 Mbps continuous |

