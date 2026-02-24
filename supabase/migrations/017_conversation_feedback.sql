-- Conversation feedback / flagging system
-- Tenant dashboard users flag Q&A pairs; superadmins review tickets

CREATE TABLE IF NOT EXISTS conversation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_by_email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'annet'
    CHECK (category IN ('feil_svar', 'manglende_info', 'feil_lenke', 'annet')),
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'resolved')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cf_created_at ON conversation_feedback(created_at DESC);
CREATE INDEX idx_cf_tenant ON conversation_feedback(tenant_id, created_at DESC);
CREATE INDEX idx_cf_conversation ON conversation_feedback(conversation_id);
CREATE INDEX idx_cf_status ON conversation_feedback(status, created_at DESC);

ALTER TABLE conversation_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON conversation_feedback
  FOR ALL USING (true) WITH CHECK (true);
