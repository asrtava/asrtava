# ==============================================================================
# ASRTAVA HMS - Application Load Balancer & Edge Ingress Security
# TLS 1.3 Termination, WAF Integration, Sticky Path Routing & Health Monitoring
# ==============================================================================

resource "aws_security_group" "alb_sg" {
  name        = "asrtava-${var.environment}-alb-sg"
  description = "Security group for public Application Load Balancer"
  vpc_id      = aws_vpc.asrtava_vpc.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP for automatic HTTPS redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "asrtava-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  drop_invalid_header_fields = true # Mitigates HTTP header injection
}

# Target Group for Backend Node.js API
resource "aws_lb_target_group" "backend_tg" {
  name        = "asrtava-${var.environment}-backend-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.asrtava_vpc.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "5000"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# HTTP Listener: Automatic 301 Redirect to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener: TLS 1.3 Termination (Pre-configured placeholder for ACM cert)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06" # Enforces TLS 1.3 / 1.2
  certificate_arn   = "arn:aws:acm:${var.aws_region}:123456789012:certificate/placeholder"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }
}

