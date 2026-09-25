-- Affiliate integrations table
-- Run this against your Postgres/Supabase database

CREATE TABLE IF NOT EXISTS affiliate_integrations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL,
  provider             TEXT NOT NULL DEFAULT 'awin',
  advertiser_id        INTEGER NOT NULL DEFAULT 17648,
  publisher_id         TEXT NOT NULL,
  encrypted_token      TEXT NOT NULL,   -- AES-256-GCM, never expose raw value
  status               TEXT NOT NULL CHECK (status IN (
                         'connected',
                         'pending_program_approval',
                         'error',
                         'disconnected'
                       )),
  last_checked_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_provider
  ON affiliate_integrations (user_id, provider);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_affiliate_integrations_updated_at
  BEFORE UPDATE ON affiliate_integrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
