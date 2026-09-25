-- Aggregated count helpers for live_views / product_clicks.
--
-- The app used to fetch raw rows and count them in JS. PostgREST caps the
-- rows returned per request (default 1000), so once a popular live passed
-- that many clicks or views, older rows silently dropped out of the count —
-- totals looked like they reset instead of staying historical. Aggregating
-- inside Postgres returns one row per live/product regardless of how many
-- underlying click/view rows exist, so the row cap never comes into play.

create or replace function live_view_counts(p_live_ids uuid[])
returns table(live_id uuid, count bigint)
language sql stable as $$
  select live_id, count(*) from live_views where live_id = any(p_live_ids) group by live_id;
$$;

create or replace function product_click_counts(p_product_ids uuid[])
returns table(product_id uuid, count bigint)
language sql stable as $$
  select product_id, count(*) from product_clicks where product_id = any(p_product_ids) group by product_id;
$$;
