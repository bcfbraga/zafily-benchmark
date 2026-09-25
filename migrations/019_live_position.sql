ALTER TABLE lives ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

UPDATE lives l SET position = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS rn
  FROM lives
) sub
WHERE l.id = sub.id;

CREATE INDEX IF NOT EXISTS lives_position_idx ON lives(user_id, position);
