output "vpc_id" {
  description = "VPC ID of the ASRTAVA deployment"
  value       = aws_vpc.asrtava_vpc.id
}

output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "Connection endpoint for PostgreSQL RDS"
  value       = aws_db_instance.postgres.endpoint
}

output "redis_primary_endpoint" {
  description = "Primary endpoint for Redis replication group"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "s3_medical_documents_bucket" {
  description = "S3 bucket name for encrypted medical documents"
  value       = aws_s3_bucket.medical_documents.id
}

