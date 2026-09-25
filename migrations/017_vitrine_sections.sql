-- Seções da galeria de vitrines (agrupamento definido pelo afiliado)
CREATE TABLE IF NOT EXISTS vitrine_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vitrine_sections_user_idx ON vitrine_sections(user_id, position);

CREATE TRIGGER vitrine_sections_updated_at
  BEFORE UPDATE ON vitrine_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE lives ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES vitrine_sections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS lives_section_idx ON lives(section_id);
