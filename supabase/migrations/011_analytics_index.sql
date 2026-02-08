-- Migration 011: Add optimized index for analytics queries
-- Analytics routes frequently query conversations by (store_id, created_at) without was_handled filter

CREATE INDEX IF NOT EXISTS idx_conversations_store_created
  ON conversations (store_id, created_at DESC);
