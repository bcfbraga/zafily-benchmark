-- Leads captados pelo formulário "Solicitar acesso" da landing page
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  social_handle TEXT,
  followers_range TEXT,
  platforms TEXT,
  current_delivery TEXT,
  biggest_difficulty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS access_requests_created_idx ON access_requests(created_at DESC);
