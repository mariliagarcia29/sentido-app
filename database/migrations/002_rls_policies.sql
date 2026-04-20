-- ============================================================
-- Row Level Security — Sentido App
-- Executar como owner do banco (não superuser) após criar tabelas
-- ============================================================

-- Função auxiliar: retorna o UUID do usuário autenticado via JWT claim
-- O backend deve setar: SET LOCAL app.current_user_id = '<uuid>';
-- em cada transação (via TypeORM subscriber ou middleware)
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT current_setting('app.current_user_id', true)::UUID;
$$ LANGUAGE sql STABLE;

-- ──────────────────────────────────────────────────────────────
-- MOOD ENTRIES
-- ──────────────────────────────────────────────────────────────
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Paciente lê e escreve apenas os próprios registros
CREATE POLICY mood_patient_own ON mood_entries
  FOR ALL
  USING (user_id = current_user_id());

-- Médico lê registros de pacientes com consentimento ativo
CREATE POLICY mood_doctor_linked ON mood_entries
  FOR SELECT
  USING (
    user_id IN (
      SELECT patient_id FROM consent_records
      WHERE doctor_id = current_user_id()
        AND status = 'active'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- SYMPTOM RECORDS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE symptom_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY symptom_patient_own ON symptom_records
  FOR ALL
  USING (user_id = current_user_id());

CREATE POLICY symptom_doctor_linked ON symptom_records
  FOR SELECT
  USING (
    is_private = false AND
    user_id IN (
      SELECT patient_id FROM consent_records
      WHERE doctor_id = current_user_id()
        AND status = 'active'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- MEDICATION RECORDS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY medication_patient_own ON medication_records
  FOR ALL
  USING (user_id = current_user_id());

CREATE POLICY medication_doctor_linked ON medication_records
  FOR SELECT
  USING (
    user_id IN (
      SELECT patient_id FROM consent_records
      WHERE doctor_id = current_user_id()
        AND status = 'active'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- CLINICAL OBSERVATIONS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE clinical_observations ENABLE ROW LEVEL SECURITY;

-- Paciente lê suas próprias observações
CREATE POLICY obs_patient_own ON clinical_observations
  FOR SELECT
  USING (patient_id = current_user_id());

-- Médico lê/cria apenas para pacientes com consentimento ativo
CREATE POLICY obs_doctor_linked ON clinical_observations
  FOR ALL
  USING (
    doctor_id = current_user_id() AND
    patient_id IN (
      SELECT patient_id FROM consent_records
      WHERE doctor_id = current_user_id()
        AND status = 'active'
    )
  );

-- Sistema pode inserir (alertas automáticos) via BYPASSRLS role
-- O service account do backend deve ter BYPASSRLS apenas para o worker de alertas

-- ──────────────────────────────────────────────────────────────
-- WEARABLE DATA
-- ──────────────────────────────────────────────────────────────
ALTER TABLE wearable_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY wearable_patient_own ON wearable_data
  FOR ALL
  USING (user_id = current_user_id());

CREATE POLICY wearable_doctor_linked ON wearable_data
  FOR SELECT
  USING (
    user_id IN (
      SELECT patient_id FROM consent_records
      WHERE doctor_id = current_user_id()
        AND status = 'active'
    )
  );

-- ──────────────────────────────────────────────────────────────
-- PDF EXPORTS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY export_own ON pdf_exports
  FOR ALL
  USING (user_id = current_user_id());

-- ──────────────────────────────────────────────────────────────
-- AUDIT LOGS — imutáveis: INSERT only, sem UPDATE/DELETE
-- ──────────────────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON audit_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY audit_read_own ON audit_logs
  FOR SELECT
  USING (user_id = current_user_id());

-- ──────────────────────────────────────────────────────────────
-- CONSENT RECORDS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_participant ON consent_records
  FOR ALL
  USING (
    patient_id = current_user_id() OR
    doctor_id  = current_user_id()
  );

-- ──────────────────────────────────────────────────────────────
-- CHAT MESSAGES — apenas participantes da consulta
-- ──────────────────────────────────────────────────────────────
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_participant ON chat_messages
  FOR ALL
  USING (
    room_id IN (
      SELECT room_id FROM appointments
      WHERE patient_id = current_user_id()
         OR doctor_id  = current_user_id()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- APPOINTMENTS
-- ──────────────────────────────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointment_participant ON appointments
  FOR ALL
  USING (
    patient_id = current_user_id() OR
    doctor_id  = current_user_id()
  );

-- ──────────────────────────────────────────────────────────────
-- DEVICE TOKENS — apenas o próprio usuário
-- ──────────────────────────────────────────────────────────────
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_own ON device_tokens
  FOR ALL
  USING (user_id = current_user_id());
