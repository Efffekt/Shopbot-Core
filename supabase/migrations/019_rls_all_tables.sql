-- Migration 019: Enable RLS on all public tables flagged by Supabase security advisor
--
-- All these tables are accessed exclusively via supabaseAdmin (service role),
-- which bypasses RLS. By enabling RLS with NO permissive policies, anon and
-- authenticated clients get zero rows — defense-in-depth.

-- 1. Enable RLS (idempotent — no-op if already enabled)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop overly permissive policies that granted access to anon/authenticated.
--    Service role bypasses RLS by default, so these are unnecessary and harmful.
DROP POLICY IF EXISTS "Service role has full access" ON conversations;
DROP POLICY IF EXISTS "Service role full access" ON audit_log;
DROP POLICY IF EXISTS "Service role full access on documents" ON documents;
DROP POLICY IF EXISTS "Service role full access" ON contact_submissions;
