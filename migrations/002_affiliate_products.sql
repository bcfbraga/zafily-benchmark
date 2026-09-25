CREATE TABLE IF NOT EXISTS affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  advertiser_id INTEGER NOT NULL,
  aw_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  deep_link TEXT NOT NULL,
  merchant_deep_link TEXT,
  category TEXT,
  brand TEXT,
  colour TEXT,
  in_stock BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, advertiser_id, aw_product_id)
);

CREATE INDEX IF NOT EXISTS affiliate_products_user_idx ON affiliate_products (user_id);
CREATE INDEX IF NOT EXISTS affiliate_products_category_idx ON affiliate_products (user_id, category);
