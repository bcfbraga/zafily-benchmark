ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS main_goal TEXT,
  ADD COLUMN IF NOT EXISTS platforms_used TEXT,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Grandfather every account that already exists today so nothing already
-- published breaks. Only accounts created from now on start as 'draft'.
UPDATE profiles SET account_status = 'active' WHERE account_status = 'draft';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('draft', 'pending_activation', 'active', 'suspended'));
