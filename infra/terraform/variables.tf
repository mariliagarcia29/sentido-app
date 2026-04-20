variable "aws_region" {
  description = "AWS region"
  default     = "sa-east-1"
}

variable "environment" {
  description = "Environment name (staging | production)"
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  default     = "sentido"
}

variable "db_name" {
  description = "PostgreSQL database name"
  default     = "sentido"
}

variable "db_username" {
  description = "PostgreSQL master username"
  default     = "sentido"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password"
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  sensitive   = true
}

variable "db_encryption_key" {
  description = "pgcrypto AES-256 key for sensitive fields"
  sensitive   = true
}

variable "redis_auth_token" {
  description = "ElastiCache Redis auth token"
  sensitive   = true
}

variable "frontend_origin" {
  description = "Allowed CORS origins (comma-separated)"
  default     = "https://sentido.app"
}

variable "api_image_uri" {
  description = "ECR image URI for the API container"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  default     = "PriceClass_100"   # USA, Canada, Europe + SA
}

variable "vapid_email" {
  description = "VAPID contact email for Web Push"
  default     = "mailto:tech@sentido.app"
}

variable "daily_domain" {
  description = "Daily.co domain for video calls"
  default     = ""
}

variable "fitbit_redirect_uri" {
  description = "Fitbit OAuth2 redirect URI"
  default     = "https://api.sentido.app/api/v1/wearables/fitbit/callback"
}

variable "garmin_auth_url" {
  description = "Garmin OAuth confirm URL"
  default     = "https://connect.garmin.com/oauthConfirm"
}

variable "github_org" {
  description = "GitHub organization or user for OIDC trust (ex: minha-org)"
  default     = "sentido-app"
}

variable "github_repo" {
  description = "GitHub repository name for OIDC trust"
  default     = "app-saude"
}
