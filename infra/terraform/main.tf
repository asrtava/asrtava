# ==============================================================================
# ASRTAVA HMS - Production Cloud Infrastructure (Terraform Main Configuration)
# Cloud Provider: AWS (Primary Region: ap-south-1 Mumbai / India Data Residency)
# ==============================================================================

terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # Production remote state backend with DynamoDB state locking
  # backend "s3" {
  #   bucket         = "asrtava-terraform-state-prod"
  #   key            = "production/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "asrtava-terraform-locks-prod"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ASRTAVA"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Compliance  = "DPDP-Act-2023-HIPAA"
      CostCenter  = "Core-Hospital-SaaS"
    }
  }
}

# ------------------------------------------------------------------------------
# 1. Multi-AZ Virtual Private Cloud (VPC) & Subnet Architecture
# ------------------------------------------------------------------------------
resource "aws_vpc" "asrtava_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "asrtava-${var.environment}-vpc"
  }
}

# Internet Gateway for Public Traffic (ALB Ingress)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.asrtava_vpc.id

  tags = {
    Name = "asrtava-${var.environment}-igw"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat_eip" {
  domain = "vpc"
  tags = {
    Name = "asrtava-${var.environment}-nat-eip"
  }
}

# NAT Gateway (Outbound Internet for Private Subnets)
resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_a.id

  tags = {
    Name = "asrtava-${var.environment}-nat-gw"
  }
  depends_on = [aws_internet_gateway.igw]
}

# Public Subnets (ALB & Bastion)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.asrtava_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = { Name = "asrtava-${var.environment}-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.asrtava_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = { Name = "asrtava-${var.environment}-public-b" }
}

# Private Application Subnets (ECS Fargate Containers & Workers)
resource "aws_subnet" "private_app_a" {
  vpc_id            = aws_vpc.asrtava_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "asrtava-${var.environment}-private-app-a" }
}

resource "aws_subnet" "private_app_b" {
  vpc_id            = aws_vpc.asrtava_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"
  tags = { Name = "asrtava-${var.environment}-private-app-b" }
}

# Isolated Database Subnets (PostgreSQL RDS & Redis ElastiCache - No Internet Route)
resource "aws_subnet" "private_db_a" {
  vpc_id            = aws_vpc.asrtava_vpc.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "${var.aws_region}a"
  tags = { Name = "asrtava-${var.environment}-private-db-a" }
}

resource "aws_subnet" "private_db_b" {
  vpc_id            = aws_vpc.asrtava_vpc.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = "${var.aws_region}b"
  tags = { Name = "asrtava-${var.environment}-private-db-b" }
}

# Route Tables
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.asrtava_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "asrtava-${var.environment}-public-rt" }
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.asrtava_vpc.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }
  tags = { Name = "asrtava-${var.environment}-private-rt" }
}

resource "aws_route_table_association" "pub_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "pub_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "priv_a" {
  subnet_id      = aws_subnet.private_app_a.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "priv_b" {
  subnet_id      = aws_subnet.private_app_b.id
  route_table_id = aws_route_table.private_rt.id
}

