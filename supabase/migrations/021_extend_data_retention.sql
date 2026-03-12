-- Migration 021: Extend purge_expired_data() to cover audit_log and conversation_feedback
--
-- Gap: audit_log and conversation_feedback were missing from the purge function,
-- meaning sensitive data (admin actions, feedback with comments) was stored indefinitely.
--
-- NOTE: Run the function creation and indexes as SEPARATE statements in Supabase dashboard.

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
  DELETE FROM conversations
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_conversations = ROW_COUNT;

  DELETE FROM contact_submissions
  WHERE created_at < NOW() - INTERVAL '180 days';
  GET DIAGNOSTICS v_contacts = ROW_COUNT;

  DELETE FROM credit_usage_log
  WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_credits = ROW_COUNT;

  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_audit = ROW_COUNT;

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
