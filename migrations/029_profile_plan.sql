-- Plano contratado por cada conta (rótulo livre, sem lista fixa no banco —
-- as opções vivem no código do painel admin para poder mudar preço/nome sem migration)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT;
