# ==============================================================================
# ASRTAVA HMS - Production Redis ElastiCache Infrastructure
# In-Memory Cache, Queue Engine, Encryption in Transit, Auth Token
# ==============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name       = "asrtava-${var.environment}-redis-subnet-group"
  subnet_ids = [aws_subnet.private_db_a.id, aws_subnet.private_db_b.id]
}

resource "aws_security_group" "redis_sg" {
  name        = "asrtava-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis; restricted to ECS tasks"
  vpc_id      = aws_vpc.asrtava_vpc.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "asrtava-${var.environment}-redis"
  description                = "Redis cluster for ASRTAVA cache, rate limiting and queues"
  node_type                  = var.redis_node_type
  num_cache_clusters         = 2 # Primary + Read-Replica for High Availability
  parameter_group_name       = "default.redis7"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis_sg.id]
  automatic_failover_enabled = true

  transit_encryption_enabled = true # Encrypts data in transit over TLS
  at_rest_encryption_enabled = true # Encrypts data on disk

  snapshot_retention_limit   = 7
  snapshot_window            = "03:00-04:00"
}

