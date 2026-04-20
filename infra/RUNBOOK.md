# Runbook — Sentido App

Guia de operações para deploy, rollback, monitoramento e incidentes.

---

## 1. Primeiro Deploy (Setup Inicial)

### 1.1 Pré-requisitos

```bash
# Ferramentas necessárias
aws --version       # >= 2.x
terraform --version # >= 1.7
docker --version    # >= 24.x
node --version      # >= 20.x
```

### 1.2 Configurar AWS

```bash
aws configure
# AWS Access Key ID: <sua-key>
# AWS Secret Access Key: <seu-secret>
# Default region: sa-east-1
# Default output: json
```

### 1.3 Criar estado remoto do Terraform

```bash
# Criar bucket S3 para estado (apenas uma vez)
aws s3 mb s3://sentido-terraform-state --region sa-east-1
aws s3api put-bucket-versioning \
  --bucket sentido-terraform-state \
  --versioning-configuration Status=Enabled

# Criar tabela DynamoDB para lock
aws dynamodb create-table \
  --table-name sentido-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region sa-east-1
```

### 1.4 Provisionar infraestrutura

```bash
cd infra/terraform

# Criar arquivo de variáveis (nunca commitar)
cp terraform.tfvars.example terraform.tfvars
# Edite terraform.tfvars com suas credenciais

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 1.5 Configurar GitHub Secrets

Após `terraform apply`, obtenha os valores dos outputs:

```bash
terraform output github_deploy_role_arn   # → AWS_DEPLOY_ROLE_ARN
terraform output cloudfront_domain        # → CLOUDFRONT_DISTRIBUTION_ID (use o ID, não o domínio)
terraform output -raw ecr_web_repository_url
```

No repositório GitHub → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `AWS_DEPLOY_ROLE_ARN` | `terraform output github_deploy_role_arn` |
| `VITE_API_URL` | `https://api.sentido.app` |
| `WEB_S3_BUCKET` | `sentido-web-production` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID da distribuição CloudFront (sem o domínio) |

### 1.6 Registrar segredos no AWS Secrets Manager

O `terraform apply` cria o secret vazio. Preencha com os valores reais:

```bash
aws secretsmanager put-secret-value \
  --secret-id sentido/production/app \
  --secret-string '{
    "db_user": "sentido",
    "db_password": "SUA_SENHA_FORTE",
    "db_encryption_key": "SUA_CHAVE_AES256",
    "redis_password": "SUA_SENHA_REDIS",
    "jwt_secret": "SEU_JWT_SECRET_64_CHARS",
    "firebase_service_account_json": "{\"type\":\"service_account\",\"project_id\":\"...\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\n...\",\"client_email\":\"...\"}",
    "vapid_public_key": "SUA_VAPID_PUBLIC_KEY",
    "vapid_private_key": "SUA_VAPID_PRIVATE_KEY",
    "daily_api_key": "SUA_DAILY_KEY",
    "fitbit_client_id": "SEU_FITBIT_CLIENT_ID",
    "fitbit_client_secret": "SEU_FITBIT_CLIENT_SECRET",
    "garmin_token": "SEU_TOKEN_GARMIN"
  }'
```

### 1.7 Executar migrations SQL

```bash
# Conectar ao RDS via bastion ou AWS Session Manager
psql "host=<rds-endpoint> dbname=sentido user=sentido sslmode=require"

\i database/migrations/001_extensions.sql
\i database/migrations/001_schema.sql
\i database/migrations/002_rls_policies.sql
\i database/migrations/003_pgcrypto_sensitive.sql
\i database/migrations/004_schema_additions.sql
\i database/migrations/005_security_hardening.sql
```

---

## 2. Deploy de Nova Versão

O deploy é **automático** via GitHub Actions ao fazer push em `main`.

### Deploy manual (emergência)

```bash
# 1. Build e push da imagem
aws ecr get-login-password --region sa-east-1 | \
  docker login --username AWS --password-stdin <ECR_REGISTRY>

docker build -t sentido-api:hotfix ./backend
docker tag sentido-api:hotfix <ECR_REGISTRY>/sentido-api:hotfix
docker push <ECR_REGISTRY>/sentido-api:hotfix

# 2. Forçar novo deploy no ECS
aws ecs update-service \
  --cluster sentido-cluster \
  --service sentido-api-service \
  --force-new-deployment \
  --region sa-east-1
```

---

## 3. Rollback

### Rollback automático
O ECS circuit breaker reverte automaticamente se o healthcheck falhar após deploy.

### Rollback manual para versão anterior

```bash
# Listar imagens disponíveis no ECR
aws ecr describe-images \
  --repository-name sentido-api \
  --query 'imageDetails[*].[imageTags,imagePushedAt]' \
  --output table

# Atualizar task definition com imagem anterior
aws ecs update-service \
  --cluster sentido-cluster \
  --service sentido-api-service \
  --task-definition sentido-api:<REVISAO_ANTERIOR> \
  --region sa-east-1
```

### Rollback do frontend

```bash
# Sincronizar versão anterior do S3 (de um backup ou build anterior)
aws s3 sync s3://sentido-web-production/backups/<DATA> \
            s3://sentido-web-production --delete

aws cloudfront create-invalidation \
  --distribution-id <CF_ID> \
  --paths "/*"
```

---

## 4. Monitoramento

### Dashboards

| Dashboard | URL |
|-----------|-----|
| CloudWatch | AWS Console → CloudWatch → Dashboards → Sentido-Producao |
| Grafana | https://grafana.sentido.app (importar `infra/grafana/dashboard-sentido.json`) |
| Logs API | AWS Console → CloudWatch → Log Groups → /sentido/api |

### Métricas críticas a observar

| Métrica | Limiar de alerta | Ação |
|---------|-----------------|------|
| CPU ECS | > 85% | Verificar gargalos, considerar escalar |
| P99 latência | > 2s | Analisar slow queries no RDS |
| Taxa 5xx | > 1% | Verificar logs `/sentido/api` |
| Tasks saudáveis | 0 | Rollback imediato |
| CPU RDS | > 80% | Verificar queries lentas |
| Memória Redis | > 80% | Aumentar instância ou limpar cache |
| Espaço RDS | < 5 GB | Limpar exports antigos ou ampliar storage |

### Verificar saúde da API

```bash
curl https://api.sentido.app/api/v1/health
# Resposta esperada: {"status":"ok","checks":{"database":{"status":"up"},"redis":{"status":"up"}}}
```

---

## 5. Gestão do Banco de Dados

### Conectar ao RDS (via Session Manager — sem abrir porta pública)

```bash
# Instalar plugin SSM
aws ssm start-session --target <BASTION_INSTANCE_ID>

# Dentro da sessão
psql "host=<RDS_ENDPOINT> dbname=sentido user=sentido sslmode=require"
```

### Backup manual

```bash
aws rds create-db-snapshot \
  --db-instance-identifier sentido-postgres \
  --db-snapshot-identifier sentido-manual-$(date +%Y%m%d)
```

### Restaurar backup

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier sentido-postgres-restored \
  --db-snapshot-identifier <SNAPSHOT_ID>
```

---

## 6. Escalonamento

### Escalar ECS manualmente

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/sentido-cluster/sentido-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### Escalar RDS (upgrade de instância)

```bash
aws rds modify-db-instance \
  --db-instance-identifier sentido-postgres \
  --db-instance-class db.t4g.medium \
  --apply-immediately
```

---

## 7. Resposta a Incidentes

### Severidade 1 — Downtime total (0 tasks saudáveis)

1. Verificar alarme `sentido-api-no-healthy-tasks` no CloudWatch
2. Checar logs: `aws logs tail /sentido/api --since 10m`
3. Se deploy recente: **rollback imediato** (ver seção 3)
4. Se infraestrutura: verificar RDS e Redis (health checks)
5. Escalar manualmente se necessário

### Severidade 2 — Degradação (latência alta ou erros 5xx)

1. Verificar alarmes `sentido-api-latency-p99` e `sentido-api-5xx-errors`
2. Analisar queries lentas no RDS Performance Insights
3. Verificar Redis: `redis-cli -h <HOST> -a <PASS> info stats`
4. Considerar escalar ECS (min 2 → 4 tasks)

### Severidade 3 — Alerta de capacidade

1. RDS storage baixo → `aws rds modify-db-instance --allocated-storage 50`
2. Redis memória alta → revisar TTLs das filas BullMQ
3. ECR > 10 imagens → lifecycle policy remove automaticamente

---

## 8. Rotação de Segredos

```bash
# Gerar novo JWT_SECRET
NEW_SECRET=$(openssl rand -base64 64)

# Atualizar no Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id sentido/production/app \
  --secret-string "{\"jwt_secret\": \"$NEW_SECRET\", ...}"

# Forçar redeploy do ECS para carregar novo segredo
aws ecs update-service \
  --cluster sentido-cluster \
  --service sentido-api-service \
  --force-new-deployment
```

> ⚠️ Rotacionar o JWT_SECRET invalida **todos os tokens ativos**. Usuários precisarão fazer login novamente.
