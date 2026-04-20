# ── RDS PostgreSQL 16 (Multi-AZ) ─────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${var.app_name}-postgres16"
  family = "postgres16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pgcrypto"
  }
  parameter {
    name  = "log_min_duration_statement"
    value = "500"   # loga queries > 500ms
  }
  parameter {
    name  = "log_connections"
    value = "1"
  }
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.app_name}-postgres"
  engine                  = "postgres"
  engine_version          = "16.2"
  instance_class          = "db.t4g.small"   # 2 vCPU, 2 GB RAM
  allocated_storage       = 20
  max_allocated_storage   = 100              # auto-scaling até 100 GB
  storage_type            = "gp3"
  storage_encrypted       = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az               = true              # failover automático
  publicly_accessible    = false
  deletion_protection    = true

  backup_retention_period    = 7             # 7 dias de backup
  backup_window              = "03:00-04:00" # UTC (madrugada BRT)
  maintenance_window         = "sun:04:00-sun:05:00"
  auto_minor_version_upgrade = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
}
