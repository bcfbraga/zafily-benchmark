-- Fluxo de aprovação/convite para o formulário "Solicitar acesso"
ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS invite_token UUID,
  ADD COLUMN IF NOT EXISTS invite_token_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS access_requests_invite_token_idx
  ON access_requests(invite_token) WHERE invite_token IS NOT NULL;
