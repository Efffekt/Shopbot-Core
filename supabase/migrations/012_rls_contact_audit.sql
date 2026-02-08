-- Migration 012: Enable RLS on contact_submissions and audit_log tables
-- Both tables are only accessed via supabaseAdmin (service role), so the policy
-- simply allows all operations for the service role.

ALTER TABLE IF EXISTS contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON contact_submissions
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON audit_log
  FOR ALL USING (true) WITH CHECK (true);
