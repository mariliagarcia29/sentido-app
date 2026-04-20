-- ============================================================
-- pgcrypto — Criptografia de campos ultra-sensíveis
-- emergency_contact é criptografado com chave simétrica AES-256
-- A chave vem da variável de ambiente DB_ENCRYPTION_KEY
-- ============================================================

-- Função: criptografa texto com a chave do app
CREATE OR REPLACE FUNCTION encrypt_sensitive(plain TEXT) RETURNS TEXT AS $$
  SELECT encode(
    pgp_sym_encrypt(plain, current_setting('app.encryption_key')),
    'base64'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Função: descriptografa
CREATE OR REPLACE FUNCTION decrypt_sensitive(cipher TEXT) RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(
    decode(cipher, 'base64'),
    current_setting('app.encryption_key')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger: criptografa emergency_contact automaticamente antes de INSERT/UPDATE
CREATE OR REPLACE FUNCTION trg_encrypt_user_sensitive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.emergency_contact IS NOT NULL AND NEW.emergency_contact != '' THEN
    -- Evita re-criptografar se já estiver no formato base64 pgcrypto
    BEGIN
      PERFORM pgp_sym_decrypt(decode(NEW.emergency_contact, 'base64'), current_setting('app.encryption_key'));
      -- Se chegou aqui, já está criptografado
    EXCEPTION WHEN OTHERS THEN
      NEW.emergency_contact := encrypt_sensitive(NEW.emergency_contact);
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER encrypt_user_sensitive
  BEFORE INSERT OR UPDATE OF emergency_contact ON users
  FOR EACH ROW EXECUTE FUNCTION trg_encrypt_user_sensitive();

-- View auxiliar para o backend ler o campo descriptografado
CREATE OR REPLACE VIEW users_decrypted AS
  SELECT
    id, email, role, full_name, locale, date_of_birth,
    CASE
      WHEN emergency_contact IS NOT NULL AND emergency_contact != ''
      THEN decrypt_sensitive(emergency_contact)
      ELSE emergency_contact
    END AS emergency_contact,
    created_at, deleted_at
  FROM users;

-- ──────────────────────────────────────────────────────────────
-- Índices de desempenho para queries frequentes
-- ──────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mood_user_created
  ON mood_entries (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_doctor_status
  ON consent_records (doctor_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consent_patient_status
  ON consent_records (patient_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_obs_patient_created
  ON clinical_observations (patient_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wearable_user_type_date
  ON wearable_data (user_id, data_type, recorded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_created
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appt_patient_scheduled
  ON appointments (patient_id, scheduled_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appt_doctor_scheduled
  ON appointments (doctor_id, scheduled_at ASC);
