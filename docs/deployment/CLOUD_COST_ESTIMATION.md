# ASRTAVA Cloud FinOps & Infrastructure Cost Estimation

## 1. Cost Modeling Assumptions

- **Cloud Provider**: AWS (Region: `ap-south-1` Mumbai)
- **Currency**: USD ($) and Indian Rupees (₹) at standard conversion $1 = ₹84.50$.
- **Billing Horizon**: Monthly ongoing operational cost (excluding one-time setup).

---

## 2. Monthly Cost Estimates by Deployment Scale

### Tier 1: Small Deployment (5 – 15 Hospitals)
| Service Component | Sizing / Specification | Est. Monthly Cost (USD) | Est. Monthly Cost (INR) |
| :--- | :--- | :---: | :---: |
| **ECS Fargate Compute** | 2 Backend + 2 Web Tasks | $65.00 | ₹5,492 |
| **Managed PostgreSQL RDS**| `db.r6g.large` (Multi-AZ) + 250 GB gp3 | $245.00 | ₹20,702 |
| **ElastiCache Redis** | `cache.t4g.medium` (Single Node) | $32.00 | ₹2,704 |
| **Application Load Balancer**| 1 ALB + LCU traffic | $28.00 | ₹2,366 |
| **Amazon S3 & KMS** | 250 GB Storage + 50,000 requests | $12.00 | ₹1,014 |
| **CloudWatch & NAT Gateway**| Logs + 1 NAT Gateway | $45.00 | ₹3,802 |
| **Total Monthly Baseline** | — | **$427.00 / mo** | **₹36,080 / mo** |

---

### Tier 2: Medium Enterprise Deployment (20 – 60 Hospitals)
| Service Component | Sizing / Specification | Est. Monthly Cost (USD) | Est. Monthly Cost (INR) |
| :--- | :--- | :---: | :---: |
| **ECS Fargate Compute** | 6 Backend + 4 Web Tasks | $210.00 | ₹17,745 |
| **Aurora PostgreSQL Serverless**| 8 ACUs average + 1 TB storage | $680.00 | ₹57,460 |
| **ElastiCache Redis** | `cache.m6g.large` (Multi-AZ) | $115.00 | ₹9,717 |
| **Application Load Balancer**| 1 ALB + WAF Protection | $65.00 | ₹5,492 |
| **Amazon S3 & KMS** | 2 TB Storage + 500,000 requests | $60.00 | ₹5,070 |
| **CloudWatch & NAT Gateway**| Multi-AZ NAT Gateways + Metrics | $90.00 | ₹7,605 |
| **Total Monthly Baseline** | — | **$1,220.00 / mo** | **₹1,03,089 / mo** |

---

### Tier 3: Large Hospital Network Deployment (100 – 250+ Hospitals)
- **Total Monthly Operational Cost**: **~$3,450.00 / month (₹2,91,525 / mo)**.
- **Cost per Hospital Tenant**: Only **~$13.80 – $34.50 / month / hospital (₹1,166 – ₹2,915)**, delivering extraordinary gross SaaS margins $> 85\%$ against standard hospital subscription pricing (₹29,999 – ₹59,999/mo).

