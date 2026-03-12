-- Migration 021: Extend purge_expired_data() to cover audit_log and conversation_feedback
--
-- Gap: audit_log and conversation_feedback were missing from the purge function,
-- meaning sensitive data (admin actions, feedback with comments) was stored indefinitely.

CREATE OR REPLACE FUNCTION purge_expired_data()
RETURNS JSON
LANGUAGE plpgsql
AS $func$
DECLARE
  v_conversations INTEGER;
  v_contacts INTEGER;
  v_credits INTEGER;
  v_audit INTEGER;
  v_feedback INTEGER;
BEGIN
  -- Delete conversations older than 90 days
  DELETE FROM conversations
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_conversations = ROW_COUNT;

  -- Delete contact submissions older than 180 days
  DELETE FROM contact_submissions
  WHERE created_at < NOW() - INTERVAL '180 days';
  GET DIAGNOSTICS v_contacts = ROW_COUNT;

  -- Delete credit usage logs older than 365 days
  DELETE FROM credit_usage_log
  WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_credits = ROW_COUNT;

  -- Delete audit log entries older than 365 days
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_audit = ROW_COUNT;

  -- Delete conversation feedback older than 180 days
  DELETE FROM conversation_feedback
  WHERE created_at < NOW() - INTERVAL '180 days';
  GET DIAGNOSTICS v_feedback = ROW_COUNT;

  RETURN json_build_object(
    'conversations_deleted', v_conversations,
    'contacts_deleted', v_contacts,
    'credits_deleted', v_credits,
    'audit_deleted', v_audit,
    'feedback_deleted', v_feedback,
    'purged_at', NOW()
  );
END;
$func$;

-- Add indexes for efficient deletion
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_asc
  ON audit_log(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conversation_feedback_created_at_asc
  ON conversation_feedback(created_at ASC);
