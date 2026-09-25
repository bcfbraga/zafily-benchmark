-- Profiles: username para URLs públicas
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lives
CREATE TABLE IF NOT EXISTS lives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  live_date DATE,
  live_time TIME,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

-- Produtos da live
CREATE TABLE IF NOT EXISTS live_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  image_url TEXT,
  price TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lives_user_idx ON lives(user_id);
CREATE INDEX IF NOT EXISTS lives_slug_idx ON lives(user_id, slug);
CREATE INDEX IF NOT EXISTS live_products_live_idx ON live_products(live_id, position);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lives_updated_at
  BEFORE UPDATE ON lives
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
