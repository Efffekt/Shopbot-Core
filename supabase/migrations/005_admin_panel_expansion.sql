-- Admin Panel Expansion
-- Indexes and DB functions for admin overview, active tenant tracking

-- Composite index for conversation filtering
CREATE INDEX IF NOT EXISTS idx_conversations_store_handled_created
  ON conversations(store_id, was_handled, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_detected_intent
  ON conversations(detected_intent);

-- Add features JSONB column to tenants (if not exists)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Function: get aggregate admin overview stats
CREATE OR REPLACE FUNCTION get_admin_overview_stats()
RETURNS JSON
LANGUAGE plpgsql
AS $func$
DECLARE
  v_total_tenants INTEGER;
  v_total_conversations BIGINT;
  v_conversations_30d BIGINT;
  v_total_documents BIGINT;
  v_tenants_near_limit INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_tenants FROM tenants;

  SELECT COUNT(*) INTO v_total_conversations FROM conversations;

  SELECT COUNT(*) INTO v_conversations_30d
  FROM conversations
  WHERE created_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_total_documents FROM documents;

  SELECT COUNT(*) INTO v_tenants_near_limit
  FROM tenants
  WHERE credit_limit > 0
    AND credits_used::NUMERIC / credit_limit > 0.8;

  RETURN json_build_object(
    'total_tenants', v_total_tenants,
    'total_conversations', v_total_conversations,
    'conversations_30d', v_conversations_30d,
    'total_documents', v_total_documents,
    'tenants_near_limit', v_tenants_near_limit
  );
END;
$func$;

-- Function: get most active tenants over a period
CREATE OR REPLACE FUNCTION get_most_active_tenants(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(tenant_id TEXT, tenant_name TEXT, conversation_count BIGINT, credit_usage INTEGER)
LANGUAGE plpgsql
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    COUNT(c.id) AS conversation_count,
    t.credits_used AS credit_usage
  FROM tenants t
  LEFT JOIN conversations c
    ON c.store_id = t.id
    AND c.created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY t.id, t.name, t.credits_used
  ORDER BY conversation_count DESC
  LIMIT p_limit;
END;
$func$;
