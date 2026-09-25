-- Optional per-proposal marketing content (all editable, all optional)
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS value_intro TEXT,
  ADD COLUMN IF NOT EXISTS value_points JSONB,
  ADD COLUMN IF NOT EXISTS conditions TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role_title TEXT;
