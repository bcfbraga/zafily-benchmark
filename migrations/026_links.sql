-- Tiles do grid bento da aba "Links" da página pública
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  tile_size TEXT NOT NULL DEFAULT '1x1' CHECK (tile_size IN ('1x1', '2x1', '1x2', '2x2')),
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS links_user_idx ON links(user_id, position);

CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS link_clicks_link_idx ON link_clicks(link_id);

create or replace function link_click_counts(p_link_ids uuid[])
returns table(link_id uuid, count bigint)
language sql stable as $$
  select link_id, count(*) from link_clicks where link_id = any(p_link_ids) group by link_id;
$$;
