-- Cupons de afiliado exibidos na página pública (link da bio).
--
-- Cupom é um objeto próprio, não um campo da vitrine: o desconto que já existe
-- em `lives` pertence a UMA vitrine e morre com ela, enquanto estes valem para
-- a loja inteira e vivem no perfil, independentes de qualquer vitrine.
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_name TEXT NOT NULL,
  category TEXT,
  -- Texto livre de propósito: "20% OFF", "R$30 OFF acima de R$150" e "Frete
  -- grátis" são todos válidos e não cabem num número com unidade.
  discount_label TEXT NOT NULL,
  -- Anulável: existe oferta que é só link, sem código para copiar. Nesse caso a
  -- página mostra apenas "Ver loja".
  code TEXT,
  url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coupons_user_idx ON coupons(user_id, position);

-- Idempotente: `CREATE TRIGGER` sozinho falharia numa segunda execução, e o
-- resto do arquivo é todo `IF NOT EXISTS`. Rodar a migration duas vezes tem que
-- ser inofensivo.
DROP TRIGGER IF EXISTS coupons_updated_at ON coupons;
CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
