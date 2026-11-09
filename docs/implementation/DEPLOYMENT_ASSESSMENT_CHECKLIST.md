# ASRTAVA Deployment Model Assessment & Readiness Checklist

## 1. Objective

This document defines the quantitative sizing criteria, hardware prerequisites, network topologies, and operational benchmarks required to certify a target environment for the ASRTAVA Hospital Management System under its **Perpetual Software License**.

ASRTAVA supports three distinct deployment topologies:
1. **Cloud Multi-Tenant / Dedicated VPC**: Fully managed, high-availability cloud infrastructure with PostgreSQL Row-Level Security (RLS) and AWS S3/Azure Blob storage.
2. **On-Premises Air-Gapped**: Fully isolated local bare-metal or virtualized cluster operating with zero external internet dependency.
3. **Hybrid Edge-to-Cloud**: Local edge nodes handling clinical care with asynchronous transactional outbox synchronization to the central cloud for multi-hospital analytics.

---

## 2. Infrastructure Sizing Matrix by Bed Capacity

| Hospital Sizing Tier | Bed Capacity | Deployment Topology | Recommended CPU | Minimum RAM | Storage Array | Redundancy Architecture |
|---|---|---|---|---|---|---|
| **Tier 1 (Clinic / Single Specialty)** | 1 - 50 Beds | On-Prem / Cloud | 8 Cores (3.0 GHz) | 32 GB | 2 TB NVMe (RAID-1) | Dual Power Supply + UPS |
| **Tier 2 (General / Multi-Specialty)** | 51 - 250 Beds | Hybrid / On-Prem | 32 Cores (3.2 GHz) | 128 GB | 6 TB NVMe (RAID-10) | Local HA Pair + Off-Site Mirror |
| **Tier 3 (Tertiary / Medical College)** | 251 - 1,000+ Beds | Hybrid / Cloud VPC | 64+ Cores | 256 GB | 16+ TB NVMe (RAID-10) | Active-Active DB Cluster + S3 Sync |

---

## 3. Deployment Topology Checklists

### A. Cloud Deployment Checklist
- [ ] **VPC & Network Isolation**: Dedicated VPC with public/private subnet topology and multi-AZ deployment.
- [ ] **Database Engine**: PostgreSQL 16+ with Row-Level Security (RLS) enabled and auto-scaling read replicas.
- [ ] **Object Storage**: S3-compatible encrypted bucket with cross-region replication and object lock for medical document retention.
- [ ] **TLS / SSL Termination**: TLS 1.3 with AES-256-GCM cipher suites and automated certificate renewal.
- [ ] **Observability & WAF**: AWS WAF / Cloudflare DDoS protection and centralized CloudWatch / Prometheus metrics.

### B. On-Premises Air-Gapped Deployment Checklist
- [ ] **Hardware Verification**: Dedicated physical server rack or VMware/Proxmox ESXi hypervisor meeting sizing tier specifications.
- [ ] **Zero Internet Independence**: All dependencies, containers, fonts, JS bundles, and static assets packaged locally; verified to operate with WAN cable disconnected.
- [ ] **Offline Licensing**: Validated RSA-4096 offline license token loaded into `offline_license_token.dat`.
- [ ] **Power & Environmental Resilience**: Dual online double-conversion UPS systems with automated diesel generator failover within 15 seconds.
- [ ] **Local Backup Appliance**: External NAS / SAN or encrypted tape drive configured with immutable snapshots and automated 24-hour backup drills.

### C. Hybrid Edge-to-Cloud Deployment Checklist
- [ ] **Edge Node Autonomy**: Local clinical database handles OPD check-in, SOAP notes, CPOE, pharmacy dispensing, and IPD beds during complete internet outages.
- [ ] **Transactional Outbox Sync**: `HybridSyncService` queue operational with atomic transaction batching and idempotency keys (`X-Idempotency-Key`).
- [ ] **DPDP Act 2023 Masking**: Patient national IDs (Aadhaar/PAN) and telephone numbers cryptographically hashed or masked prior to cloud sync egress.
- [ ] **Conflict Resolution Strategy**: Clinical consultations enforce strict append-only EMR lineage; administrative attributes enforce Last-Write-Wins (LWW) with millisecond clock synchronization via local NTP.
- [ ] **Bandwidth & Latency**: Primary WAN bandwidth &ge; 100 Mbps, failover 4G/5G WAN &ge; 25 Mbps, edge-to-cloud round-trip latency &le; 60 ms.

