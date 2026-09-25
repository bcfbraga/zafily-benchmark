-- Uma consulta só para a listagem do dashboard.
--
-- listLives fazia três idas sequenciais ao Postgres (lives, live_products, e as
-- RPCs de contagem). Como a função da Vercel roda em iad1 e o banco está em
-- São Paulo, cada ida custa ~200ms de travessia — o trabalho no banco é de
-- milissegundos. Juntar tudo aqui troca três travessias por uma.
--
-- A semântica replica exatamente o que o TypeScript montava:
--   product_count    — total de produtos
--   thumbnails       — até 4 image_url não nulas, na ordem de position
--   preview_products — até 5 produtos (inclusive sem imagem), na ordem
--   clicks           — total de cliques em produtos da vitrine
--   views            — soma das exibições diárias
CREATE OR REPLACE FUNCTION dashboard_lives(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(jsonb_agg(j ORDER BY pos), '[]'::jsonb)
  FROM (
    SELECT
      l.position AS pos,
      to_jsonb(l) || jsonb_build_object(
        'product_count', (SELECT count(*) FROM live_products p WHERE p.live_id = l.id),

        'thumbnails', coalesce((
          SELECT jsonb_agg(t.image_url ORDER BY t.position)
          FROM (
            SELECT image_url, position
            FROM live_products
            WHERE live_id = l.id AND image_url IS NOT NULL
            ORDER BY position
            LIMIT 4
          ) t
        ), '[]'::jsonb),

        'preview_products', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'id', v.id, 'name', v.name, 'image_url', v.image_url, 'price', v.price
          ) ORDER BY v.position)
          FROM (
            SELECT id, name, image_url, price, position
            FROM live_products
            WHERE live_id = l.id
            ORDER BY position
            LIMIT 5
          ) v
        ), '[]'::jsonb),

        'clicks', (
          SELECT count(*)
          FROM product_clicks pc
          JOIN live_products p ON p.id = pc.product_id
          WHERE p.live_id = l.id
        ),

        'views', (
          SELECT coalesce(sum(li.count), 0)
          FROM live_impressions li
          WHERE li.live_id = l.id
        )
      ) AS j
    FROM lives l
    WHERE l.user_id = p_user_id
  ) s;
$$;
