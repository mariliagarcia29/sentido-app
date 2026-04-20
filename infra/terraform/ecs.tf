# ── ECR Repository ────────────────────────────────────────────
resource "aws_ecr_repository" "api" {
  name                 = "sentido-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Manter apenas as últimas 10 imagens"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# ── ECR Repository — Web (imagem docker-compose/staging) ─────
resource "aws_ecr_repository" "web" {
  name                 = "sentido-web"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Manter apenas as últimas 10 imagens"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# ── ECS Cluster ───────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/sentido/api"
  retention_in_days = 30
}

# ── IAM — ECS Task Execution Role ────────────────────────────
resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# AmazonECSTaskExecutionRolePolicy cobre ECR pulls mas NÃO cobre Secrets Manager.
# Esta policy adicional permite que o ECS injete segredos via valueFrom.
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-manager-read"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.app_secrets.arn
    }]
  })
}

# ── IAM — ECS Task Role (S3, Secrets Manager) ────────────────
resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "s3-exports"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
      Resource = "${aws_s3_bucket.exports.arn}/*"
    }]
  })
}

# ── ECS Task Definition ───────────────────────────────────────
resource "aws_ecs_task_definition" "api" {
  family                   = "sentido-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "sentido-api"
    image = var.api_image_uri

    portMappings = [{ containerPort = 3001, protocol = "tcp" }]

    environment = [
      { name = "NODE_ENV",            value = "production" },
      { name = "PORT",                value = "3001" },
      { name = "DB_HOST",             value = aws_db_instance.postgres.address },
      { name = "DB_PORT",             value = "5432" },
      { name = "DB_NAME",             value = var.db_name },
      { name = "REDIS_HOST",          value = aws_elasticache_replication_group.redis.primary_endpoint_address },
      { name = "REDIS_PORT",          value = "6379" },
      { name = "AWS_REGION",          value = var.aws_region },
      { name = "AWS_S3_BUCKET",       value = aws_s3_bucket.exports.id },
      { name = "FRONTEND_ORIGIN",     value = var.frontend_origin },
      { name = "VAPID_EMAIL",         value = var.vapid_email },
      { name = "DAILY_DOMAIN",        value = var.daily_domain },
      { name = "FITBIT_REDIRECT_URI", value = var.fitbit_redirect_uri },
      { name = "GARMIN_AUTH_URL",     value = var.garmin_auth_url },
    ]

    secrets = [
      { name = "DB_USER",                   valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_user::" },
      { name = "DB_PASSWORD",               valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_password::" },
      { name = "DB_ENCRYPTION_KEY",         valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:db_encryption_key::" },
      { name = "REDIS_PASSWORD",            valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:redis_password::" },
      { name = "JWT_SECRET",                valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:jwt_secret::" },
      { name = "FIREBASE_SERVICE_ACCOUNT_JSON", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:firebase_service_account_json::" },
      { name = "VAPID_PUBLIC_KEY",              valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:vapid_public_key::" },
      { name = "VAPID_PRIVATE_KEY",         valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:vapid_private_key::" },
      { name = "DAILY_API_KEY",             valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:daily_api_key::" },
      { name = "FITBIT_CLIENT_ID",          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:fitbit_client_id::" },
      { name = "FITBIT_CLIENT_SECRET",      valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:fitbit_client_secret::" },
      { name = "GARMIN_VERIFICATION_TOKEN", valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:garmin_token::" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.api.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "api"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:3001/api/v1/health || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 60
    }
  }])
}

# ── ECS Service ───────────────────────────────────────────────
resource "aws_ecs_service" "api" {
  name            = "sentido-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "sentido-api"
    container_port   = 3001
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]
}

# ── Application Load Balancer ─────────────────────────────────
resource "aws_lb" "api" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }
}

resource "aws_lb_target_group" "api" {
  name        = "${var.app_name}-api-tg"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/api/v1/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 10
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.api.arn
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

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# ── Auto Scaling ──────────────────────────────────────────────
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 6
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "sentido-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ── Secrets Manager ───────────────────────────────────────────
resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "sentido/${var.environment}/app"
  recovery_window_in_days = 7
}
