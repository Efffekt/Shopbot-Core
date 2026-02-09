-- Additional indexes for analytics query performance
CREATE INDEX IF NOT EXISTS idx_conversations_store_handled
  ON conversations(store_id, was_handled);

CREATE INDEX IF NOT EXISTS idx_conversations_store_intent
  ON conversations(store_id, detected_intent);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type_created
  ON audit_log(entity_type, created_at DESC);

-- Enable RLS on documents table (defense-in-depth alongside RPC filter)
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by all API routes via supabaseAdmin)
CREATE POLICY "Service role full access on documents"
  ON documents FOR ALL
  USING (true)
  WITH CHECK (true);
