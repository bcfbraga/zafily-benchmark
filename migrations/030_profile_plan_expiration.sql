-- Data de vencimento do plano contratado (definida manualmente pelo admin ao atribuir um plano)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
