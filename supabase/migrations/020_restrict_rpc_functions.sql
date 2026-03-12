-- Migration 020: Revoke anon/authenticated access to all RPC functions
--
-- Problem: PL/pgSQL functions are callable via PostgREST RPC by anyone with the
-- anon key. This means an attacker could call increment_credits(), reset_credits(),
-- purge_expired_data(), get_unanswered_queries(), etc. directly.
--
-- Fix: Revoke EXECUTE from anon and authenticated roles. The service role
-- (used by supabaseAdmin in our app) is a superuser and bypasses these grants.

-- Credit system functions — can manipulate credits for any tenant
REVOKE EXECUTE ON FUNCTION increment_credits(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_credit_status(TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION reset_credits(TEXT) FROM anon, authenticated;

-- Conversation analytics — leaks customer queries and search terms
REVOKE EXECUTE ON FUNCTION get_conversation_stats(TEXT, INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_top_search_terms(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_unanswered_queries(TEXT, INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_daily_chat_volume(TEXT, INTEGER) FROM anon, authenticated;

-- Admin overview — leaks system-wide stats and tenant names
REVOKE EXECUTE ON FUNCTION get_admin_overview_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_most_active_tenants(INTEGER, INTEGER) FROM anon, authenticated;

-- Data retention — can trigger mass deletion
REVOKE EXECUTE ON FUNCTION purge_expired_data() FROM anon, authenticated;

-- Vector search — leaks document content for any tenant
-- (This function may have been created outside migrations via Supabase dashboard.
--  If it doesn't exist yet, this line will fail harmlessly.)
DO $func$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION match_site_content(vector, float, int, text) FROM anon, authenticated';
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'match_site_content not found — skipping (may use different signature)';
END;
$func$;
