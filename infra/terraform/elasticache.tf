# ── ElastiCache Redis 7 ───────────────────────────────────────
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.app_name}-redis7"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.app_name}-redis"
  description          = "Sentido Redis — cache, filas BullMQ, pub/sub Socket.IO"

  node_type            = "cache.t4g.small"   # 1.37 GB RAM
  num_cache_clusters   = 2                   # primary + replica

  engine_version       = "7.1"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  parameter_group_name = aws_elasticache_parameter_group.redis.name

  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  auth_token                  = var.redis_auth_token

  automatic_failover_enabled  = true
  multi_az_enabled            = true

  snapshot_retention_limit    = 3
  snapshot_window             = "03:30-04:30"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/sentido/redis"
  retention_in_days = 14
}
