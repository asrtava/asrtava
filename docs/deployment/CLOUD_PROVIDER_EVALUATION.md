# ASRTAVA Cloud Provider Evaluation & Data Residency Assessment

## 1. Regulatory Context: Digital Personal Data Protection Act 2023 (India)

Under Section 8(5) and Section 16 of the **DPDP Act 2023** and National Medical Commission (NMC) guidelines, sensitive medical records, patient vitals, and diagnostic scan archives of Indian citizens are subject to strict in-country data residency and processing requirements.

---

## 2. Comprehensive Provider Comparison Matrix

| Evaluation Dimension | Amazon Web Services (AWS) | Google Cloud Platform (GCP) | Microsoft Azure |
| :--- | :--- | :--- | :--- |
| **India Data Residency** | **Primary Choice**: Multi-AZ Regions in Mumbai (`ap-south-1`) and Hyderabad (`ap-south-2`). | Available (Mumbai `asia-south1`, Delhi `asia-south2`). | Available (Central, South, West India). |
| **Managed PostgreSQL** | **Amazon RDS / Aurora Serverless v2**: Native RLS support, automated failover $< 30\text{s}$, continuous WAL PITR. | Cloud SQL for PostgreSQL: Reliable, higher replica latency. | Azure Database for PostgreSQL Flexible Server. |
| **Serverless Containers** | **AWS ECS Fargate**: Zero-management compute, seamless IAM task roles, rapid horizontal scaling. | Cloud Run: Excellent for stateless, complex for private VPC peering. | Azure Container Apps: Suitable, slightly higher cold-start overhead. |
| **In-Memory Caching** | **Amazon ElastiCache Redis**: Native TLS in-transit, Multi-AZ failover, automated snapshots. | Memorystore for Redis: Lacks automated point-in-time recovery on base tiers. | Azure Cache for Redis: Feature parity with higher pricing. |
| **Storage Immutability** | **S3 Object Lock (Compliance Mode)**: Certified SEC 17a-4 / HIPAA WORM immutability against ransomware. | Cloud Storage Retention Policies: Available. | Azure Blob Immutable Storage: Available. |
| **Healthcare Ecosystem** | Deep integration with AWS HealthLake, DICOM PACS, and Indian SMS DLT gateways. | Strong AI/ML APIs, Healthcare API. | Strong enterprise Active Directory integration. |
| **Cost & FinOps Predictability**| Predictable Reserved Instances, Savings Plans, and Aurora Serverless auto-pause. | Sustained use discounts. | Enterprise Agreement pricing. |

---

## 3. Definitive Architectural Selection: AWS (ap-south-1 Mumbai)

**AWS is selected as the primary cloud infrastructure provider** for ASRTAVA based on:
1. Two independent geographic regions within India (`ap-south-1` Mumbai and `ap-south-2` Hyderabad) enabling active-passive disaster recovery completely within national borders.
2. Production-grade PostgreSQL RLS and IAM Least Privilege integration.
3. Industry-standard Terraform AWS provider support for full Infrastructure-as-Code reproducibility.

