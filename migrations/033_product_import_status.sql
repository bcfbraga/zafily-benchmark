-- Estado da importação de cada produto.
--
-- Até aqui um link que falhava (loja fora do ar, 403, página sem dados) era
-- gravado com todos os campos nulos e ficava indistinguível de um produto que
-- a usuária ainda não terminou de preencher. A coluna guarda o resultado da
-- busca para que a vitrine possa sinalizar o link com problema.
--
--   ok      → nome e imagem encontrados
--   partial → veio um dos dois; dá para publicar, mas fica capenga
--   failed  → não veio nada aproveitável
--
-- NULL = produto anterior a esta migration; a interface deduz o estado pelos
-- campos vazios nesse caso.
ALTER TABLE live_products ADD COLUMN IF NOT EXISTS import_status TEXT;
ALTER TABLE live_products ADD COLUMN IF NOT EXISTS import_error  TEXT;

-- Só se busca "os produtos com problema" dentro de uma vitrine, nunca no banco
-- inteiro, então o índice acompanha live_id e cobre apenas as linhas com falha.
CREATE INDEX IF NOT EXISTS live_products_import_status_idx
  ON live_products(live_id, import_status)
  WHERE import_status IS NOT NULL AND import_status <> 'ok';
