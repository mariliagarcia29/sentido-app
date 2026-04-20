# Sentido — App de Acompanhamento Médico

Plataforma de saúde digital com dois perfis — **Paciente** e **Médico** — em conformidade com a LGPD (Lei 13.709/2018).

---

## Funcionalidades

### Paciente
- Registro diário de humor (1–10), sintomas e medicações
- Histórico clínico com gráficos de evolução
- Agenda de consultas com videoatendimento integrado
- Wearables: Apple Health, Google Fit, Samsung Health, Fitbit, Garmin
- Exportação de histórico em PDF (criptografado no S3)
- Painel LGPD: ver quem acessa seus dados, revogar acesso, deletar conta

### Médico
- Dashboard de pacientes vinculados com score de risco
- Observações clínicas com severidade (info / aviso / crítico)
- Alertas automáticos de anomalias (humor baixo, medicação perdida, sintoma grave)
- Chat em tempo real + videochamada (Daily.co)
- Vínculo por consentimento explícito do paciente

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS v11 + TypeORM + PostgreSQL 16 |
| Cache / Filas | Redis 7 (Upstash em dev, ElastiCache em prod) |
| Frontend Web | React + Vite + Tailwind CSS v4 |
| Mobile | React Native + Expo (iOS e Android) |
| Push | Firebase Admin SDK (FCM/APNs) + Web Push (VAPID) |
| Vídeo | Daily.co (RTC) |
| Storage | AWS S3 (SSE-AES256) + CloudFront |
| Infra | ECS Fargate + RDS Multi-AZ + Terraform |
| CI/CD | GitHub Actions → ECR → ECS |
| Monitoramento | CloudWatch + Grafana |

---

## Estrutura do Monorepo

```
app_saude/
├── backend/          # API NestJS
│   ├── src/
│   │   ├── auth/           # JWT + OAuth
│   │   ├── records/        # Humor, sintomas, medicações
│   │   ├── appointments/   # Consultas
│   │   ├── observations/   # Observações clínicas
│   │   ├── consent/        # Vínculos médico-paciente
│   │   ├── alerts/         # Detecção de anomalias
│   │   ├── notifications/  # Push (FCM + APNs + Web)
│   │   ├── telemedicine/   # Daily.co rooms + tokens
│   │   ├── chat/           # WebSocket (Socket.IO)
│   │   ├── wearables/      # Fitbit OAuth + Garmin webhook
│   │   ├── export/         # PDF assíncrono (BullMQ + Puppeteer)
│   │   ├── doctor/         # Painel médico + score de risco
│   │   ├── preferences/    # Configurações do usuário
│   │   └── health/         # Health check endpoint
│   ├── test/               # Testes e2e
│   └── Dockerfile
│
├── web/              # Frontend React
│   └── src/
│       ├── pages/patient/  # Dashboard, Records, Appointments, Export, Settings
│       ├── pages/doctor/   # Patients, PatientSummary, Consent
│       ├── components/     # UI reutilizável
│       ├── api/            # Axios client + endpoints tipados
│       ├── context/        # AuthContext
│       └── i18n/           # PT-BR, EN-US, ES-ES
│
├── mobile/           # App React Native (Expo)
│   └── src/
│       ├── screens/patient/  # Dashboard, Records, Appointments, Wearables...
│       ├── screens/doctor/   # Patients, PatientSummary, Consent
│       ├── navigation/       # RootNavigator, PatientTabs, DoctorStack
│       ├── services/api.ts   # Todas as chamadas de API
│       └── i18n/             # PT-BR, EN-US, ES-ES
│
├── database/
│   └── migrations/   # SQL: extensões, RLS policies, pgcrypto, índices
│
├── infra/
│   ├── terraform/    # AWS: VPC, RDS, ElastiCache, ECS, S3, CloudFront
│   ├── nginx/        # Reverse proxy + TLS
│   └── grafana/      # Dashboard JSON
│
├── .github/
│   └── workflows/    # ci.yml (lint+test+build), deploy.yml (ECR→ECS+S3)
│
├── docker-compose.yml       # Desenvolvimento local
├── docker-compose.prod.yml  # Produção (referência)
└── .env.example             # Variáveis de ambiente documentadas
```

---

## Início Rápido (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose
- npm v10 (o v11 tem bug com firebase-admin — use `nvm use 20`)

### 1. Clonar e configurar ambiente

```bash
git clone https://github.com/sua-org/app_saude.git
cd app_saude

cp .env.example .env
# Edite .env com suas credenciais
```

### 2. Subir serviços de infraestrutura

```bash
docker compose up -d postgres redis
```

### 3. Backend

```bash
cd backend
npm install --legacy-peer-deps

# Em dev, TypeORM sincroniza o schema automaticamente (synchronize: true)
# Para aplicar migrations SQL manualmente (staging/prod):
# psql -f database/migrations/001_extensions.sql ...  (ver infra/RUNBOOK.md)

npm run start:dev
# API disponível em http://localhost:3001/api/v1
# Swagger em http://localhost:3001/api/docs
```

### 4. Frontend Web

```bash
cd web
npm install
npm run dev
# http://localhost:5173
```

### 5. Mobile

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
# Escaneie o QR com o app Expo Go
```

---

## Testes

```bash
# Backend — unitários
cd backend && npm test

# Backend — e2e
cd backend && npm run test:e2e

# Cobertura
cd backend && npm run test:cov
```

---

## Deploy em Produção

Ver o [Runbook de Deploy](infra/RUNBOOK.md) para o passo a passo completo.

**Fluxo automático:**
1. Push para `main` → GitHub Actions executa CI
2. CI passa → build da imagem Docker e push para ECR
3. Frontend buildado e sincronizado com S3
4. CloudFront cache invalidado
5. ECS Fargate atualizado com rolling update (zero downtime)
6. Circuit breaker automático: rollback se healthcheck falhar

---

## Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Segredo para assinar JWTs (mín. 64 chars) |
| `DB_PASSWORD` | Senha do PostgreSQL |
| `DB_ENCRYPTION_KEY` | Chave AES-256 para pgcrypto |
| `REDIS_PASSWORD` | Senha do Redis |
| `GARMIN_VERIFICATION_TOKEN` | Token do webhook Garmin |
| `FIREBASE_PRIVATE_KEY` | Chave privada do Firebase Admin |
| `DAILY_API_KEY` | API key do Daily.co |

Ver [.env.example](.env.example) para a lista completa.

---

## Segurança

- **JWT** obrigatório — app não inicia sem `JWT_SECRET`
- **Rate limiting** — ThrottlerGuard global (60/min), rotas de auth (5–10/min)
- **Row Level Security** — PostgreSQL RLS em todas as tabelas de dados clínicos
- **Criptografia em repouso** — pgcrypto para campos sensíveis, S3 SSE-AES256 para PDFs
- **Headers HTTP** — Helmet com CSP + HSTS via Nginx e NestJS
- **CORS** — lista de origens explícita, sem wildcard
- **Payload limit** — 100 KB por requisição
- **ClassSerializerInterceptor** — `passwordHash` nunca exposto em respostas

Ver [security_sprint11.md](.claude/projects/memory/security_sprint11.md) para o relatório completo de auditoria.

---

## Licença

Proprietary — © 2026 Sentido. Todos os direitos reservados.
