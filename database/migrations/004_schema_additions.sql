-- ============================================================
-- Adições de schema — Sprint 4
-- Executar após 003_pgcrypto_sensitive.sql
-- ============================================================

-- ── Campos de médico em users ─────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS crm_link  TEXT;

-- ── Consentimento explícito em consent_records ────────────────
ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Tabela oauth_accounts ─────────────────────────────────────
CREATE TYPE oauth_provider AS ENUM ('google', 'apple');

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         oauth_provider NOT NULL,
  provider_user_id TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts (user_id);

-- ── RLS para oauth_accounts ───────────────────────────────────
ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY oauth_own ON oauth_accounts
  FOR ALL
  USING (user_id = current_user_id());
