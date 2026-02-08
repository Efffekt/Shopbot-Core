-- Migration 010: Security hardening — FK constraints, composite indexes, missing tables
-- Run with: supabase db push or apply in Supabase dashboard

-- =============================================================================
-- 1. CREATE TABLE IF NOT EXISTS for tables that were created outside migrations
-- =============================================================================

-- Documents table (pgvector RAG store) — may already exist from manual setup
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  checksum TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Ensure all hardcoded tenants exist before adding FK constraints
--    These tenant IDs are used in conversations/documents/credits but may
--    only exist in the app's hardcoded config, not in the tenants table.
-- =============================================================================

INSERT INTO tenants (id, name) VALUES ('baatpleiebutikken', 'Båtpleiebutikken')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO tenants (id, name) VALUES ('preik-demo', 'Preik Demo')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO tenants (id, name) VALUES ('docs-site', 'Docs Project')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO tenants (id, name) VALUES ('rk-designsystem-docs', 'Norwegian Red Cross Design System')
  ON CONFLICT (id) DO NOTHING;

-- Also backfill any orphaned store_ids from conversations/documents/credit_usage_log
-- that reference tenants not yet in the tenants table
INSERT INTO tenants (id, name)
  SELECT DISTINCT store_id, store_id
  FROM conversations
  WHERE store_id NOT IN (SELECT id FROM tenants)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name)
  SELECT DISTINCT store_id, store_id
  FROM documents
  WHERE store_id NOT IN (SELECT id FROM tenants)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name)
  SELECT DISTINCT tenant_id, tenant_id
  FROM credit_usage_log
  WHERE tenant_id NOT IN (SELECT id FROM tenants)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 3. Foreign key constraints (wrapped in DO blocks to be idempotent)
-- =============================================================================

-- conversations.store_id → tenants(id)
DO $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_tenant'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT fk_conversations_tenant
      FOREIGN KEY (store_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $func$;

-- credit_usage_log.tenant_id → tenants(id)
DO $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_credit_usage_log_tenant'
  ) THEN
    ALTER TABLE credit_usage_log
      ADD CONSTRAINT fk_credit_usage_log_tenant
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $func$;

-- tenant_prompts.tenant_id → tenants(id)
DO $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_prompts_tenant'
  ) THEN
    ALTER TABLE tenant_prompts
      ADD CONSTRAINT fk_tenant_prompts_tenant
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $func$;

-- documents.store_id → tenants(id)
DO $func$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_tenant'
  ) THEN
    ALTER TABLE documents
      ADD CONSTRAINT fk_documents_tenant
      FOREIGN KEY (store_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $func$;

-- =============================================================================
-- 4. Indexes for common query patterns
-- =============================================================================

-- Tenant user access: reverse lookup (find users by tenant)
CREATE INDEX IF NOT EXISTS idx_tenant_user_access_tenant_id
  ON tenant_user_access(tenant_id);

-- Audit log: search by actor
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_email
  ON audit_log(actor_email);

-- Documents: lookup by store + content search
CREATE INDEX IF NOT EXISTS idx_documents_store_id
  ON documents(store_id);

-- Contact submissions: chronological listing
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON contact_submissions(created_at DESC);

-- Credit usage log: composite for tenant + time range queries
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_tenant_created
  ON credit_usage_log(tenant_id, created_at DESC);
