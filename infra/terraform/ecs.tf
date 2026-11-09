# ==============================================================================
# ASRTAVA HMS - Elastic Container Service (ECS Fargate) Production Cluster
# Zero-Downtime Rolling Deployments, Horizontal Auto-scaling, IAM Least Privilege
# ==============================================================================

resource "aws_ecs_cluster" "main" {
  name = "asrtava-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks_sg" {
  name        = "asrtava-${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS Fargate tasks; allows ingress from ALB only"
  vpc_id      = aws_vpc.asrtava_vpc.id

  ingress {
    description     = "HTTP from Application Load Balancer"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "asrtava-${var.environment}-ecs-tasks-sg"
  }
}

# IAM Task Execution Role (Allows ECS agent to pull ECR images and fetch Secrets Manager secrets)
resource "aws_iam_role" "ecs_execution_role" {
  name = "asrtava-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_attachment" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# CloudWatch Log Group for Backend Structured Logs
resource "aws_cloudwatch_log_group" "backend_logs" {
  name              = "/ecs/asrtava-${var.environment}-backend"
  retention_in_days = 90

  tags = {
    Name = "asrtava-${var.environment}-backend-logs"
  }
}

# ECS Fargate Task Definition for Backend API
resource "aws_ecs_task_definition" "backend" {
  family                   = "asrtava-${var.environment}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024" # 1 vCPU
  memory                   = "2048" # 2 GB RAM
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([{
    name      = "asrtava-backend"
    image     = "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 5000
      hostPort      = 5000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "5000" },
      { name = "DB_HOST", value = aws_db_instance.postgres.address },
      { name = "DB_PORT", value = "5432" },
      { name = "DB_NAME", value = aws_db_instance.postgres.db_name }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend_logs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 15
    }
  }])
}

# ECS Service: Rolling Deployments & High Availability
resource "aws_ecs_service" "backend" {
  name            = "asrtava-${var.environment}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 100 # Guarantees minimum capacity during updates
  deployment_maximum_percent         = 200 # Spawns new version before terminating old

  network_configuration {
    subnets         = [aws_subnet.private_app_a.id, aws_subnet.private_app_b.id]
    security_groups = [aws_security_group.ecs_tasks_sg.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend_tg.arn
    container_name   = "asrtava-backend"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener.https]
}

# ECR Container Registry
resource "aws_ecr_repository" "backend" {
  name                 = "asrtava-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true # Automated CVE vulnerability scanning
  }
}

