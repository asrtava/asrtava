variable "aws_region" {
  description = "AWS deployment region conforming to DPDP 2023 India data residency"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Target deployment environment (development, staging, production)"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for the dedicated ASRTAVA VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL compute tier instance class"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB for PostgreSQL RDS"
  type        = number
  default     = 250
}

variable "db_max_allocated_storage" {
  description = "Maximum storage threshold in GB for automated storage auto-scaling"
  type        = number
  default     = 1000
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.m6g.large"
}

variable "domain_name" {
  description = "Apex domain name for ASRTAVA platform"
  type        = string
  default     = "asrtava.com"
}

