output "alb_dns_name" {
  description = "ALB DNS — aponte seu CNAME api.sentido.app aqui"
  value       = aws_lb.api.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront DNS — aponte sentido.app aqui"
  value       = aws_cloudfront_distribution.web.domain_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "ecr_repository_url" {
  description = "ECR URL da API para push de imagens"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR URL do Web para push de imagens"
  value       = aws_ecr_repository.web.repository_url
}

output "exports_bucket" {
  description = "S3 bucket para PDFs exportados"
  value       = aws_s3_bucket.exports.id
}

output "web_bucket" {
  description = "S3 bucket do frontend web"
  value       = aws_s3_bucket.web.id
}
