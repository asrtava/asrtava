# ASRTAVA Infrastructure as Code (Terraform) Guide

## 1. Directory Structure

All production infrastructure is managed declaratively in [`infra/terraform/`](file:///c:/Users/madha/Desktop/Medical_Project/infra/terraform/):

```
infra/terraform/
├── main.tf                    # VPC, Multi-AZ subnets, NAT Gateway, Route Tables
├── variables.tf               # Environment variables, sizing parameters, CIDR blocks
├── rds.tf                     # Managed PostgreSQL Multi-AZ RDS, KMS key, DB subnet group
├── ecs.tf                     # ECS Fargate Cluster, Task Definitions, Auto-scaling, ECR
├── s3.tf                      # Private S3 Bucket, WORM Object Lock, KMS encryption
├── elasticache.tf             # Multi-AZ Redis replication group, in-transit TLS
├── alb.tf                     # Application Load Balancer, ACM TLS 1.3 listener, health check
├── outputs.tf                 # VPC ID, ALB DNS, RDS endpoint, S3 bucket name
└── terraform.tfvars.example   # Example parameter variables file
```

---

## 2. Terraform Execution Commands

### 1. Initialize Terraform Providers & Modules
```bash
cd infra/terraform
terraform init
```

### 2. Format & Validate Declarative Files
```bash
terraform fmt -check
terraform validate
```

### 3. Generate Infrastructure Execution Plan
```bash
terraform plan -var-file="terraform.tfvars" -out="asrtava-prod.tfplan"
```

### 4. Controlled Infrastructure Deployment
```bash
terraform apply "asrtava-prod.tfplan"
```

---

## 3. Remote State Locking & Team Concurrency

In production, Terraform state is stored remotely with AES-256 encryption in S3 and state locking in DynamoDB to prevent concurrent execution conflicts.

