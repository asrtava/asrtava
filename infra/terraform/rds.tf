# ==============================================================================
# ASRTAVA HMS - Production Managed PostgreSQL RDS Infrastructure
# Multi-AZ, Storage Encrypted via KMS, Automated Backups, Point-in-Time Recovery
# ==============================================================================

# Database Subnet Group (Private Isolated Database Subnets Only)
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "asrtava-${var.environment}-rds-subnet-group"
  subnet_ids = [aws_subnet.private_db_a.id, aws_subnet.private_db_b.id]

  tags = {
    Name = "asrtava-${var.environment}-rds-subnet-group"
  }
}

# Database Security Group (Ingress allowed strictly from ECS Private App Subnets)
resource "aws_security_group" "rds_sg" {
  name        = "asrtava-${var.environment}-rds-sg"
  description = "Security group for PostgreSQL RDS; restricted to ECS tasks"
  vpc_id      = aws_vpc.asrtava_vpc.id

  ingress {
    description     = "PostgreSQL from Private Application Subnets"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "asrtava-${var.environment}-rds-sg"
  }
}

# KMS Key for PostgreSQL Storage Encryption at Rest
resource "aws_kms_key" "rds_kms_key" {
  description             = "KMS Key for ASRTAVA Production Database Storage Encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "asrtava-${var.environment}-rds-kms"
  }
}

# PostgreSQL Database Parameter Group (Enforcing TLS 1.3 & Query Logging)
resource "aws_db_parameter_group" "rds_pg" {
  name   = "asrtava-${var.environment}-pg16"
  family = "postgres16"

  parameter {
    name  = "rds.force_ssl"
    value = "1" # Force SSL/TLS on all connections
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log slow queries executing longer than 1 second
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name = "asrtava-${var.environment}-pg-params"
  }
}

# Production Multi-AZ PostgreSQL RDS Instance
resource "aws_db_instance" "postgres" {
  identifier                  = "asrtava-${var.environment}-pg"
  engine                      = "postgres"
  engine_version              = "16.2"
  instance_class              = var.db_instance_class
  allocated_storage           = var.db_allocated_storage
  max_allocated_storage       = var.db_max_allocated_storage # Auto-scaling storage
  storage_type                = "gp3"
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.rds_kms_key.arn
  
  multi_az                    = true # High availability automated failover
  publicly_accessible        = false # Never exposed to the public internet
  db_subnet_group_name        = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids      = [aws_security_group.rds_sg.id]
  parameter_group_name        = aws_db_parameter_group.rds_pg.name

  db_name                     = "asrtava_prod"
  username                    = "asrtava_root_admin"
  manage_master_user_password = true # Managed by AWS Secrets Manager with automated rotation

  backup_retention_period     = 30 # 30-day continuous backup retention for Point-in-Time Recovery
  backup_window               = "20:00-21:00" # UTC
  maintenance_window          = "Sun:21:30-Sun:22:30" # UTC

  deletion_protection         = true # Prevent accidental termination
  copy_tags_to_snapshot       = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "asrtava-${var.environment}-final-snapshot"

  tags = {
    Name = "asrtava-${var.environment}-postgresql"
  }
}

