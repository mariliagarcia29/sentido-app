# ============================================================
# GitHub Actions — OIDC Trust
# Permite que o workflow de deploy assuma uma IAM role sem
# armazenar AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY no GitHub.
# Referenciado no deploy.yml via role-to-assume: secrets.AWS_DEPLOY_ROLE_ARN
# ============================================================

# Provider OIDC do GitHub (criado uma única vez por conta AWS)
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]

  # Thumbprint da CA raiz do GitHub Actions OIDC
  # Obter com: openssl s_client -connect token.actions.githubusercontent.com:443 2>/dev/null \
  #   | openssl x509 -fingerprint -noout -sha1 | tr -d ':' | tail -c 41
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# IAM Role assumida pelo workflow de deploy
resource "aws_iam_role" "github_deploy" {
  name = "${var.app_name}-github-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Apenas o branch main do repositório configurado pode assumir esta role
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })
}

# ── Permissões do deploy role ──────────────────────────────────

# ECR: autenticar, push e pull de imagens
resource "aws_iam_role_policy" "github_deploy_ecr" {
  name = "ecr-push"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:DescribeImages"
        ]
        Resource = [
          aws_ecr_repository.api.arn,
          aws_ecr_repository.web.arn,
        ]
      }
    ]
  })
}

# S3: sincronizar assets do frontend
resource "aws_iam_role_policy" "github_deploy_s3_web" {
  name = "s3-web-sync"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.web.arn,
        "${aws_s3_bucket.web.arn}/*",
      ]
    }]
  })
}

# CloudFront: invalidar cache após deploy do frontend
resource "aws_iam_role_policy" "github_deploy_cloudfront" {
  name = "cloudfront-invalidate"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["cloudfront:CreateInvalidation"]
      Resource = aws_cloudfront_distribution.web.arn
    }]
  })
}

# ECS: atualizar task definition e service (rolling deploy)
resource "aws_iam_role_policy" "github_deploy_ecs" {
  name = "ecs-deploy"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = "*"
      },
      {
        # Necessário para registrar nova task definition com as mesmas roles
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn,
        ]
      }
    ]
  })
}

output "github_deploy_role_arn" {
  description = "ARN da IAM role para o GitHub Actions — adicione como AWS_DEPLOY_ROLE_ARN nos secrets do repositório"
  value       = aws_iam_role.github_deploy.arn
}
