-- Migration 022: Add indexes for efficient data retention purge on audit_log and conversation_feedback

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_asc
  ON audit_log(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_conversation_feedback_created_at_asc
  ON conversation_feedback(created_at ASC);
