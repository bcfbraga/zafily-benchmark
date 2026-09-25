-- Exibições de vitrine, agregadas por dia.
--
-- Antes, `live_views` só ganhava uma linha quando alguém abria a página da
-- vitrine — mas os cliques também saem do carrossel em /{username}/vitrines,
-- onde nenhuma view era registrada. O denominador ficava menor que o numerador
-- e o painel chegava a mostrar "209% CTR".
--
-- É agregada (uma linha por vitrine por dia) em vez de uma linha por evento
-- porque a listagem exibe todas as vitrines de uma vez: por evento, cada
-- carregamento geraria ~8 linhas e a tabela cresceria centenas de MB por ano.
CREATE TABLE IF NOT EXISTS live_impressions (
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (live_id, day)
);

CREATE INDEX IF NOT EXISTS live_impressions_live_idx ON live_impressions(live_id);

-- Preserva o histórico que já existia em live_views.
INSERT INTO live_impressions (live_id, day, count)
SELECT live_id, created_at::date, count(*)
FROM live_views
GROUP BY live_id, created_at::date
ON CONFLICT (live_id, day) DO NOTHING;

-- Incremento atômico para as N vitrines exibidas num carregamento.
CREATE OR REPLACE FUNCTION bump_live_impressions(p_live_ids uuid[])
RETURNS void
LANGUAGE sql AS $$
  INSERT INTO live_impressions (live_id, day, count)
  SELECT unnest(p_live_ids), CURRENT_DATE, 1
  ON CONFLICT (live_id, day) DO UPDATE SET count = live_impressions.count + 1;
$$;

CREATE OR REPLACE FUNCTION live_impression_counts(p_live_ids uuid[])
RETURNS TABLE(live_id uuid, count bigint)
LANGUAGE sql STABLE AS $$
  SELECT live_id, COALESCE(SUM(count), 0)::bigint
  FROM live_impressions
  WHERE live_id = ANY(p_live_ids)
  GROUP BY live_id;
$$;
