CREATE TABLE IF NOT EXISTS username_history (
  old_username TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS username_history_user_id_idx ON username_history(user_id);
