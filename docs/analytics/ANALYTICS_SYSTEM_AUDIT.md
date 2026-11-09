# Enterprise Data Warehouse & Business Intelligence System Audit

## 1. Executive Summary
ASRTAVA now incorporates a native Enterprise Data Warehouse (EDW) and Advanced Business Intelligence platform. This architectural audit evaluates the analytical pipeline, dimensional modeling, predictive forecasting algorithms, performance characteristics, and regulatory compliance.

## 2. In-Memory Data Mart & Star Schema Architecture
- Operational databases (OLTP) are optimized for transactional integrity with 3rd Normal Form (3NF).
- ASRTAVA EDW utilizes a **Star Schema** with denormalized dimensions (`dim_date`, `dim_patient`, `dim_doctor`, `dim_department`, `dim_clinical_service`) and partitioned fact tables (`fact_clinical_encounters`, `fact_ipd_census`, `fact_financial_transactions`, `fact_pharmacy_sales`, `fact_ed_inflow`).
- Supports both local SQLite/PostgreSQL analytical datamarts (for air-gapped on-premises installations) and multi-node enterprise PostgreSQL/Citus deployments.

## 3. Data Governance & Anonymization
- High-level clinical analytics enforce dynamic de-identification of Protected Health Information (PHI) to comply with India DPDP Act 2023, HIPAA, and ISO 27799.
- Patient identifiers (Aadhaar, Phone, Name) are pseudonymized with salted cryptographic hashes in analytical cubes.

