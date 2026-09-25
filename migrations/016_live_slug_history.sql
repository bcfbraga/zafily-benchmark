CREATE TABLE IF NOT EXISTS live_slug_history (
  live_id UUID NOT NULL REFERENCES lives(id) ON DELETE CASCADE,
  old_slug TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (live_id, old_slug)
);

CREATE INDEX IF NOT EXISTS live_slug_history_old_slug_idx ON live_slug_history(old_slug);
