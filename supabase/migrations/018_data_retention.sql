-- Data Retention Policy
-- Auto-delete old data to comply with GDPR data minimisation principle.
-- Conversations: 90 days, contact submissions: 180 days, credit usage log: 365 days.

-- Function to purge expired data
CREATE OR REPLACE FUNCTION purge_expired_data()
RETURNS JSON
LANGUAGE plpgsql
AS $func$
DECLARE
  v_conversations INTEGER;
  v_contacts INTEGER;
  v_credits INTEGER;
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

  RETURN json_build_object(
    'conversations_deleted', v_conversations,
    'contacts_deleted', v_contacts,
    'credits_deleted', v_credits,
    'purged_at', NOW()
  );
END;
$func$;

-- Schedule daily cleanup at 03:00 UTC via pg_cron (if extension is available)
-- Note: pg_cron must be enabled in Supabase dashboard under Database > Extensions
-- Run this manually in SQL editor after enabling pg_cron:
--
--   SELECT cron.schedule(
--     'purge-expired-data',
--     '0 3 * * *',
--     $$SELECT purge_expired_data()$$
--   );

-- Add index on created_at for efficient deletion (conversations already has one)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at_asc
  ON contact_submissions(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_created_at_asc
  ON credit_usage_log(created_at ASC);
