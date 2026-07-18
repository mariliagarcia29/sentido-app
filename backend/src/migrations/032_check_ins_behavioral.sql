-- Sprint C: campos comportamentais do check-in (Camada 2 — 6 pilares)
-- Estes campos são opcionais e preenchidos pelo passo 'behavioral' do CheckInModal
-- Camada 2: processos comportamentais (seção 3.4 do plano)

ALTER TABLE check_ins
  ADD COLUMN IF NOT EXISTS "medicationReaction"    VARCHAR(20)     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "physicalActivityMinutes" INT           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "nutritionQuality"       INT           DEFAULT NULL CHECK ("nutritionQuality" BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS "socialQuality"          INT           DEFAULT NULL CHECK ("socialQuality"    BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS "substancesUsed"         TEXT          DEFAULT NULL;
-- substancesUsed armazenado como texto simples (TypeORM simple-array: valores separados por vírgula)
