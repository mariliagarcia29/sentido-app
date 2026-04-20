# ── CloudWatch Log Groups ─────────────────────────────────────
resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/sentido/nginx"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/sentido/web"
  retention_in_days = 14
}

# ── CloudWatch Alarms ─────────────────────────────────────────

# API: CPU alta → escala automaticamente, mas alerta acima de 85%
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "sentido-api-cpu-high"
  alarm_description   = "CPU do ECS acima de 85% por 5 min — investigar gargalo"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# API: latência P99 acima de 2s
resource "aws_cloudwatch_metric_alarm" "api_latency_high" {
  alarm_name          = "sentido-api-latency-p99"
  alarm_description   = "P99 de latência do ALB acima de 2s"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 2
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# API: taxa de erro 5xx acima de 1%
resource "aws_cloudwatch_metric_alarm" "api_5xx_rate" {
  alarm_name          = "sentido-api-5xx-errors"
  alarm_description   = "Taxa de erros 5xx do ALB acima de 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 1
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "100 * errors / MAX([errors, requests])"
    label       = "5xx Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions  = { LoadBalancer = aws_lb.api.arn_suffix }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Sum"
      dimensions  = { LoadBalancer = aws_lb.api.arn_suffix }
    }
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# RDS: CPU alta
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "sentido-rds-cpu-high"
  alarm_description   = "CPU do RDS acima de 80% por 10 min"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = { DBInstanceIdentifier = aws_db_instance.postgres.id }
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# RDS: espaço livre abaixo de 5 GB
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "sentido-rds-storage-low"
  alarm_description   = "Espaço livre no RDS abaixo de 5 GB"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120   # 5 GB em bytes

  dimensions = { DBInstanceIdentifier = aws_db_instance.postgres.id }
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Redis: memória usada acima de 80%
resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "sentido-redis-memory-high"
  alarm_description   = "Memória do Redis acima de 80%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80

  dimensions = { ReplicationGroupId = aws_elasticache_replication_group.redis.id }
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# ECS: tasks unhealthy (0 tasks saudáveis = downtime)
resource "aws_cloudwatch_metric_alarm" "ecs_healthy_tasks" {
  alarm_name          = "sentido-api-no-healthy-tasks"
  alarm_description   = "Nenhuma task saudável no ECS — downtime em produção!"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1

  dimensions = {
    LoadBalancer = aws_lb.api.arn_suffix
    TargetGroup  = aws_lb_target_group.api.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# ── SNS Topic para alertas (e-mail / Slack via Lambda) ───────
resource "aws_sns_topic" "alerts" {
  name = "sentido-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "tech@sentido.app"
}

# ── CloudWatch Dashboard ──────────────────────────────────────
resource "aws_cloudwatch_dashboard" "sentido" {
  dashboard_name = "Sentido-Producao"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6
        properties = {
          title  = "API — Requisições e Latência (P99)"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount",              "LoadBalancer", aws_lb.api.arn_suffix],
            ["AWS/ApplicationELB", "TargetResponseTime",        "LoadBalancer", aws_lb.api.arn_suffix, { stat = "p99", label = "P99" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.api.arn_suffix, { color = "#d62728" }],
          ]
          period = 60
          view   = "timeSeries"
          region = var.aws_region
        }
      },
      {
        type = "metric", x = 12, y = 0, width = 12, height = 6
        properties = {
          title  = "ECS — CPU e Memória"
          metrics = [
            ["AWS/ECS", "CPUUtilization",    "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.api.name],
            ["AWS/ECS", "MemoryUtilization", "ClusterName", aws_ecs_cluster.main.name, "ServiceName", aws_ecs_service.api.name],
          ]
          period = 60
          view   = "timeSeries"
          region = var.aws_region
        }
      },
      {
        type = "metric", x = 0, y = 6, width = 12, height = 6
        properties = {
          title  = "RDS — CPU e Conexões"
          metrics = [
            ["AWS/RDS", "CPUUtilization",     "DBInstanceIdentifier", aws_db_instance.postgres.id],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.postgres.id],
            ["AWS/RDS", "FreeStorageSpace",    "DBInstanceIdentifier", aws_db_instance.postgres.id],
          ]
          period = 60
          view   = "timeSeries"
          region = var.aws_region
        }
      },
      {
        type = "metric", x = 12, y = 6, width = 12, height = 6
        properties = {
          title  = "Redis — Memória e Comandos/s"
          metrics = [
            ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "ReplicationGroupId", aws_elasticache_replication_group.redis.id],
            ["AWS/ElastiCache", "CacheHits",                     "ReplicationGroupId", aws_elasticache_replication_group.redis.id],
            ["AWS/ElastiCache", "CacheMisses",                   "ReplicationGroupId", aws_elasticache_replication_group.redis.id],
          ]
          period = 60
          view   = "timeSeries"
          region = var.aws_region
        }
      },
      {
        type = "alarm", x = 0, y = 12, width = 24, height = 4
        properties = {
          title  = "Status dos Alarmes"
          alarms = [
            aws_cloudwatch_metric_alarm.api_cpu_high.arn,
            aws_cloudwatch_metric_alarm.api_latency_high.arn,
            aws_cloudwatch_metric_alarm.api_5xx_rate.arn,
            aws_cloudwatch_metric_alarm.rds_cpu.arn,
            aws_cloudwatch_metric_alarm.rds_storage_low.arn,
            aws_cloudwatch_metric_alarm.redis_memory.arn,
            aws_cloudwatch_metric_alarm.ecs_healthy_tasks.arn,
          ]
        }
      },
    ]
  })
}
