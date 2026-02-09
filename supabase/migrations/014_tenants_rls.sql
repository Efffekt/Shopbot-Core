-- Enable RLS on tenants table for defense-in-depth
-- All API routes use supabaseAdmin (service role) which bypasses RLS,
-- but this prevents accidental exposure via anon client.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS by default).
-- No anon/authenticated policies = anon client gets zero rows.
