# Plano Técnico — App de Acompanhamento Médico

**Versão:** 2.0
**Data:** Março 2026

---

## 1. Diagnóstico Inicial

Não há código existente — o projeto parte do zero. Este documento define a arquitetura completa para suportar os dois perfis (Paciente e Médico) com as seguintes funcionalidades confirmadas, em conformidade com a **LGPD (Lei 13.709/2018)**.

---

## 2. Análise de Requisitos por Perfil

### 2.1 Geral (Atualização)

---

## 3. Arquitetura Geral

```
CLIENTES (Frontend)
├── Web App (React)
├── Mobile (React Native)
│   ├── HealthKit / Health Connect
│   └── Wearable Sync Module
│
└── HTTPS / TLS 1.3 + WSS (WebSocket)
    └── API Gateway / BFF
        ├── Rate limiting · Auth · Logs · i18n headers
        └── Backend (NestJS / Node.js)
            ├── Serviço de Alertas/Push Notifications
            ├── Telemedicina (Chat + Vídeo)
            └── PDF Reports (Puppeteer)

ARMAZENAMENTO
├── PostgreSQL   — dados clínicos
├── Redis        — sessões, cache, pub/sub
├── Filas        — chats, workers, queues
├── AWS S3 / Supabase Storage — PDFs criptografados, gravações
├── FCM (Firebase Cloud Messaging) + APNs (Apple)
└── Twilio / Daily.co — RTC (voz e áudio p2p)
```

---

## 4. Banco de Dados — Modelagem Completa

### 4.1 Tecnologia: PostgreSQL

**Escolhido por:**
- Criptografia nativa (`pgcrypto`)
- Row Level Security (RLS)
- `pg_audit`, `JSONB` (dados heterogêneos)
- Compatível com MVP e escalável para RDS

### 4.2 Entidades Núcleo

#### `users`
```sql
id               UUID PK
email            TEXT (único)
password_hash    TEXT (NULL se OAuth)
role             ENUM('patient', 'doctor')
full_name        TEXT
locale           TEXT DEFAULT 'pt-BR'
created_at       TIMESTAMPTZ
deleted_at       TIMESTAMPTZ (soft delete)
date_of_birth    DATE
emergency_contact TEXT
specialty        TEXT (médico)
crm_link         TEXT (médico)
```

#### `consent_records`
```sql
id               UUID PK
patient_id       FK → users
doctor_id        FK → users
status           ENUM('pending', 'active', 'revoked')
access_level     TEXT
consent_given    BOOLEAN
```

#### `mood_entries` / `symptom_records`
```sql
id               UUID PK
user_id          FK → users
score            INT (1–10)
label            TEXT
symptom          TEXT
severity         TEXT
dose             TEXT
taken            BOOLEAN
is_private       BOOLEAN DEFAULT TRUE  -- NUNCA acessado sem consentimento
```

#### `clinical_observations`
```sql
id               UUID PK
patient_id       FK → users
doctor_id        FK → users
triggered_by     ENUM('system', 'doctor')
severity         ENUM('info', 'warn', 'critical')
is_read          BOOLEAN DEFAULT FALSE
```

#### `audit_logs`
```sql
id               UUID PK
user_id          FK → users
action           TEXT  -- ex: 'EXPORT_PDF', 'READ_HISTORY'
target_resource  TEXT
ip_address       TEXT
created_at       TIMESTAMPTZ  -- IMUTÁVEL, nunca alterado
```

#### `device_tokens`
```sql
id               UUID PK
user_id          FK → users
platform         ENUM('ios', 'android', 'web')
token            TEXT
is_active        BOOLEAN
last_used_at     TIMESTAMPTZ
```

#### `user_preferences`
```sql
reminder_time    TIME
quiet_hours      JSONB  -- { start, end }
appointment_reminders BOOLEAN
language         TEXT
```

#### `oauth_accounts`
```sql
provider         ENUM('google', 'apple')
provider_user_id TEXT
UNIQUE (provider, provider_user_id)
```

#### `appointments`
```sql
id               UUID PK
patient_id       FK
doctor_id        FK
scheduled_at     TIMESTAMPTZ
status           ENUM('pending', 'confirmed', 'cancelled')
room_id          TEXT  -- ID da sala de vídeo
meeting_url      TEXT
```

#### `wearable_data` (assíncrono / fila)
```sql
source           ENUM('fitbit', 'garmin', 'samsung', 'apple', 'google')
scope            TEXT  -- quais dados autorizados
data_type        ENUM('steps', 'heart_rate', 'sleep', 'glucose', 'weight', 'calories')
value            NUMERIC
unit             TEXT  -- ex: 'mg/dL'
extras           JSONB
device_name      TEXT
status           ENUM('partial', 'complete', 'error')
```

#### `pdf_exports`
```sql
id               UUID PK
user_id          FK
period_from      DATE
period_to        DATE
includes         JSONB  -- ['moods', 'symptoms', ...]
file_url         TEXT   -- URL temporária no S3
expires_at       TIMESTAMPTZ
```

### 4.3 Row Level Security (RLS)

```sql
-- Paciente lê apenas os próprios dados
CREATE POLICY patient_own ON mood_entries
  USING (user_id = current_user_id()::UUID);

-- Médico lê dados de pacientes vinculados com consentimento
CREATE POLICY doctor_linked ON mood_entries
  USING (
    user_id IN (
      SELECT patient_id FROM consent_records
      WHERE doctor_id = current_user_id()::UUID
        AND status = 'active'
    )
  );

-- Chat: apenas remetente ou destinatário lêem mensagens
-- Controla saúde do owner
```

---

## 5. Backend — Stack e Módulos

### 5.1 Stack Principal

```
src/
├── auth/
│   ├── strategies/jwt.strategy.ts
│   ├── guards/jwt-auth.guard.ts    ← NOVO
│   └── auth.module.ts
├── notifications/
│   └── workers/  (BullMQ)
│       ├── enviar/
│       ├── agendar/
│       └── cancelar/
├── pdf/
│   ├── pdf.worker.ts   ← gera PDF com Puppeteer
│   ├── pdf.template.ts ← template HTML do relatório
│   └── pdf.service.ts  ← faz upload ao S3
└── common/
    ├── filters/http-exception.filter.ts
    └── interceptors/
```

### 5.2 Internacionalização

Suporte a JSON de tradução: `en-US`, `es-ES`, `pt-BR`

```ts
// Exemplo de interceptor i18n
.intercept(common/i18n.interceptor)
```

### 5.3 Fluxo de Autenticação (JWT + Roles)

```
POST /auth/login       → retorna JWT
POST /auth/logout
GET  /auth/redirect    → OAuth (Google/Apple)

[Guard JWT verifica token, extrai role]
[Role Guard valida permissão da rota]
[Defesa final: RLS no banco]
[Audit log gerado em todas as operações críticas]
```

### 5.4 Rotas Principais

```
POST   /auth/login
POST   /auth/logout
GET    /auth/redirect?to=...

GET    /appointments/:id
POST   /appointments/invite
GET    /appointments/mine
DELETE /appointments/:id      ← cancela, não deleta
POST   /conversations/manual  ← inicia consulta
GET    /conversations/:id     ← carrega conversa

POST   /records/export        ← solicita PDF
GET    /records/export/:id    ← download (URL expira 24h)
DELETE /records/:id           ← exclusão soft (15 dias)
```

---

## 6. Frontend — Telas e Fluxo

### Áreas do App

```
/onboarding     → cadastro e consentimento
/dashboard      → resumo do dia: humor + sintomas + alertas + gráficos
/records        → histórico de registros
/appointments   → agenda de consultas
/settings       → preferências, idioma, indicadores
/export         → solicitar e baixar relatório PDF
```

### Internacionalização (i18n)

- **Português Brasil (padrão)**
- **Inglês (EN-US)**
- **Espanhol (ES-ES)**
- Detecção automática pelo navegador, com opção manual de configuração
- Todas as strings da UI traduzidas

### LGPD — UX Explícito

- Painel de consentimento em 2 etapas (Art. 18 da LGPD)
- O usuário pode: ver quem acessa seus dados, revogar acesso, solicitar exportação, e excluir conta com prazo definido

---

## 7. Segurança

### 7.1 Controle de Acesso (RBAC)

- `is_admin = true` → acesso total
- Roles granulares por rota (patient / doctor)
- Tokens imutáveis em audit log

### 7.2 Boas Práticas

- **Rate limiting:** 10 req/s por IP
- **CORS:** origens conhecidas apenas
- **Headers de segurança:** Helmet.js (CSP, HSTS, X-Frame-Options)
- **Secrets:** variáveis de ambiente via AWS Secrets Manager em produção
- **Backup:** automático; sessão expira após inatividade e desconecta

---

## 8. Notificações — Canais de Envio

| Canal     | Tecnologia                          |
|-----------|-------------------------------------|
| Android   | FCM (Firebase Cloud Messaging)      |
| iOS       | APNs (Apple Push Notification)      |
| Web       | Web Push API                        |
| Despacho  | BullMQ (filas assíncronas)          |

---

## 9. Telemedicina (Tempo Real)

```
WebSocket (Socket.IO)
├── Namespace por sala
├── Servidor faz broadcast para participantes
├── Token validado no handshake

Videochamada (Twilio / Daily.co)
├── SDK client-side
├── Ao entrar na sala → conecta via RTC
└── Mensagens persistidas no banco
    └── Pub/Sub Redis para instâncias múltiplas
```

---

## 10. Alertas e Anomalias

- Alertas gerados quando padrões anômalos são detectados:
  - Frequência cardíaca > 100 bpm por período prolongado
  - Humor consistentemente baixo por múltiplos dias
  - Medicação não tomada
- Score de risco calculado e exibido como card no painel do médico

---

## 11. Exportação PDF (Assíncrono)

```
a. BullMQ adiciona job à fila
b. Worker Puppeteer renderiza relatório em HTML
c. Converte para PDF
d. Faz upload ao S3 com SSE-S3 (criptografia server-side)
e. Gera URL temporária (expira em 24h)
f. Notifica o usuário por push
g. Dados ultra-sensíveis marcados com aviso antes de exportar
```

---

## 12. Decisões Técnicas

| Decisão                  | Definição                                                                    |
|--------------------------|------------------------------------------------------------------------------|
| Notificações push        | FCM (Android/Web) + APNs (iOS), configuráveis por tipo                       |
| Exportação PDF           | Puppeteer server-side, assíncrono, URL S3 com expiração                      |
| Internacionalização      | PT-BR (padrão), EN-US, ES-ES                                                 |
| Autenticação social      | Google OAuth2 + Apple Sign In (além de e-mail/senha)                         |
| Telemedicina             | Chat em tempo real (WebSocket) + videochamada (Twilio/Daily.co)              |
| Integração wearables     | HealthKit, Health Connect, Fitbit, Garmin                                    |

---

## 13. Infraestrutura

```
Banco de Dados:  PostgreSQL + RLS + pgcrypto
Cache/Filas:     Redis (Upstash em dev)
Push:            FCM + APNs
Vídeo:           Twilio / Daily.co (RTC)
Storage:         AWS S3 (Multi-AZ, criptografado)
CDN:             CloudFront (assets estáticos)
Monitoramento:   CloudWatch + Grafana
```

---

## 14. Plano de Execução — Sprints

**Estimativa total:** ~25 semanas até MVP completo

| Sprint | Entregas                                                                                          |
|--------|---------------------------------------------------------------------------------------------------|
| 1      | Monorepo setup, Docker, CI/CD básico, autenticação JWT + OAuth Google/Apple, cadastro paciente/médico |
| 2      | Módulo de registros do paciente (humor, sintomas, medicação, notas) + RLS + audit log             |
| 3      | Módulo médico (visualização, observações clínicas, vínculos/consentimento) + sistema de alertas   |
| 4      | Notificações push (FCM + APNs + Web Push) + lembretes configuráveis                              |
| 5      | Frontend Web — área do paciente (dashboard, registros, histórico) + área do médico               |
| 6      | Telemedicina: chat em tempo real (WebSocket) + videochamada (Twilio/Daily.co)                     |
| 7      | Exportação PDF + wearables (HealthKit + Health Connect)                                           |
| 8      | App Mobile React Native (Expo): todas as telas do paciente                                        |
| 9      | App Mobile: telas do médico + chat + vídeo + notificações nativas                                |
| 10     | i18n (EN + ES), wearables adicionais (Fitbit, Garmin), painel LGPD completo                     |
| 11     | Testes (unitário, integração, e2e), hardening de segurança, pentest básico, revisão              |
| 12     | Deploy em produção, monitoramento, documentação final                                             |

---

*Documento gerado a partir de plano_app.pages — Versão 2.0, Março 2026*
