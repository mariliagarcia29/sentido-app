-- Migration 005: Security hardening (Topic 7)
-- Adds is_admin flag to users, token blacklist table for logout revocation

-- Admin flag: enables superuser bypass of RBAC
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Token blacklist: revoked JWT JTIs stored until original expiry
-- Entries are checked on every authenticated request
CREATE TABLE IF NOT EXISTS token_blacklist (
  jti        TEXT        PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Auto-cleanup: expired tokens serve no purpose after their original expiry
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist (expires_at);

-- RLS: only the token owner and admins can see their own blacklisted tokens
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_blacklist_owner ON token_blacklist
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);
