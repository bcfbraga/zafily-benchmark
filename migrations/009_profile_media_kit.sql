-- Dados de mídia kit exibidos nas propostas comerciais públicas
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS followers_label TEXT,
  ADD COLUMN IF NOT EXISTS reach_label TEXT,
  ADD COLUMN IF NOT EXISTS views_label TEXT,
  ADD COLUMN IF NOT EXISTS engagement_label TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS link_url TEXT;
