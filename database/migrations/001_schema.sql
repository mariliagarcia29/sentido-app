-- ============================================================
-- Schema inicial — todas as tabelas core do Sentido App
-- Executar após 001_extensions.sql, antes de 002_rls_policies.sql
-- Idempotente: usa CREATE TABLE IF NOT EXISTS e CREATE TYPE IF NOT EXISTS
-- ============================================================

-- ── ENUMs ─────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'doctor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_status AS ENUM ('pending', 'active', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE observation_severity AS ENUM ('info', 'warn', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE observation_trigger AS ENUM ('system', 'doctor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wearable_source AS ENUM ('fitbit', 'garmin', 'samsung', 'apple', 'google');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wearable_data_type AS ENUM ('steps', 'heart_rate', 'sleep', 'glucose', 'weight', 'calories');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE wearable_sync_status AS ENUM ('partial', 'complete', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE export_status AS ENUM ('pending', 'processing', 'done', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── USERS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT        NOT NULL UNIQUE,
  password_hash     TEXT,
  role              user_role   NOT NULL DEFAULT 'patient',
  full_name         TEXT        NOT NULL,
  locale            TEXT        NOT NULL DEFAULT 'pt-BR',
  date_of_birth     DATE,
  emergency_contact TEXT,
  is_admin          BOOLEAN     NOT NULL DEFAULT FALSE,
  specialty         TEXT,
  crm_link          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_deleted  ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- ── USER PREFERENCES ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
  id                    UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  reminder_time         TEXT,
  quiet_hours           JSONB,
  appointment_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  alert_notifications   BOOLEAN NOT NULL DEFAULT TRUE,
  language              TEXT    NOT NULL DEFAULT 'pt-BR'
);

-- ── CONSENT RECORDS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consent_records (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        consent_status NOT NULL DEFAULT 'pending',
  access_level  TEXT,
  consent_given BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_consent_patient ON consent_records (patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_doctor  ON consent_records (doctor_id);
CREATE INDEX IF NOT EXISTS idx_consent_status  ON consent_records (status);

-- ── MOOD ENTRIES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mood_entries (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      INT         NOT NULL CHECK (score BETWEEN 1 AND 10),
  label      TEXT,
  is_private BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mood_user_date ON mood_entries (user_id, created_at DESC);

-- ── SYMPTOM RECORDS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS symptom_records (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symptom    TEXT        NOT NULL,
  severity   TEXT        NOT NULL,
  is_private BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_symptom_user_date ON symptom_records (user_id, created_at DESC);

-- ── MEDICATION RECORDS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS medication_records (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  dose       TEXT,
  taken      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_medication_user_date ON medication_records (user_id, created_at DESC);

-- ── CLINICAL OBSERVATIONS ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS clinical_observations (
  id           UUID                 PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id   UUID                 NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id    UUID                 REFERENCES users(id) ON DELETE SET NULL,
  triggered_by observation_trigger  NOT NULL DEFAULT 'doctor',
  severity     observation_severity NOT NULL DEFAULT 'info',
  content      TEXT                 NOT NULL,
  is_read      BOOLEAN              NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obs_patient_unread ON clinical_observations (patient_id, is_read, created_at DESC);

-- ── AUDIT LOGS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL,
  target_resource TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_date ON audit_logs (user_id, created_at DESC);

-- ── DEVICE TOKENS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS device_tokens (
  id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform    device_platform NOT NULL,
  token       TEXT            NOT NULL UNIQUE,
  is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_user_active ON device_tokens (user_id, is_active);

-- ── APPOINTMENTS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id           UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id   UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id    UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ        NOT NULL,
  status       appointment_status NOT NULL DEFAULT 'pending',
  room_id      TEXT,
  meeting_url  TEXT,
  created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_patient ON appointments (patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_doctor  ON appointments (doctor_id, scheduled_at DESC);

-- ── CHAT MESSAGES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    TEXT         NOT NULL,
  sender_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT         NOT NULL,
  type       message_type NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_room_date ON chat_messages (room_id, created_at ASC);

-- ── WEARABLE DATA ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wearable_data (
  id          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source      wearable_source     NOT NULL,
  device_name TEXT,
  scope       TEXT,
  data_type   wearable_data_type  NOT NULL,
  value       NUMERIC(10, 2)      NOT NULL,
  unit        TEXT,
  extras      JSONB,
  status      wearable_sync_status NOT NULL DEFAULT 'complete',
  recorded_at TIMESTAMPTZ         NOT NULL,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wearable_user_type_date
  ON wearable_data (user_id, data_type, recorded_at DESC);

-- ── WEARABLE CONNECTIONS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS wearable_connections (
  id               UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         wearable_source NOT NULL,
  access_token     TEXT            NOT NULL DEFAULT '',
  refresh_token    TEXT,
  provider_user_id TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
  last_sync_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

-- ── PDF EXPORTS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pdf_exports (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_from DATE          NOT NULL,
  period_to   DATE          NOT NULL,
  includes    JSONB         NOT NULL DEFAULT '[]',
  status      export_status NOT NULL DEFAULT 'pending',
  file_url    TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_user_date ON pdf_exports (user_id, created_at DESC);

-- ── TOKEN BLACKLIST ───────────────────────────────────────────
-- (também criada em 005_security_hardening.sql — IF NOT EXISTS garante idempotência)

CREATE TABLE IF NOT EXISTS token_blacklist (
  jti        TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist (expires_at);

-- ── OAUTH ACCOUNTS ────────────────────────────────────────────
-- (também criada em 004_schema_additions.sql — IF NOT EXISTS garante idempotência)

DO $$ BEGIN
  CREATE TYPE oauth_provider AS ENUM ('google', 'apple');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         oauth_provider NOT NULL,
  provider_user_id TEXT          NOT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts (user_id);
