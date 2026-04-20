-- Extensões necessárias
-- Executar como superuser antes de qualquer migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- crypt(), gen_salt(), pgp_sym_encrypt()
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- métricas de queries (CloudWatch / Grafana)
