-- Conversations Analytics Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  store_id TEXT NOT NULL,
  session_id TEXT,
  user_query TEXT NOT NULL,
  ai_response TEXT,
  detected_intent TEXT DEFAULT 'unknown' CHECK (detected_intent IN ('product_query', 'support', 'general', 'unknown')),
  was_handled BOOLEAN DEFAULT true,
  referred_to_email BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_conversations_store_id ON conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_was_handled ON conversations(was_handled);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);

-- Enable Row Level Security (optional, for multi-tenant)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access" ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Helper function: Get conversation stats
CREATE OR REPLACE FUNCTION get_conversation_stats(
  p_store_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_conversations', COUNT(*),
    'handled_count', COUNT(*) FILTER (WHERE was_handled = true),
    'unhandled_count', COUNT(*) FILTER (WHERE was_handled = false),
    'email_referrals', COUNT(*) FILTER (WHERE referred_to_email = true),
    'product_queries', COUNT(*) FILTER (WHERE detected_intent = 'product_query'),
    'support_queries', COUNT(*) FILTER (WHERE detected_intent = 'support'),
    'handled_rate', ROUND(
      (COUNT(*) FILTER (WHERE was_handled = true))::numeric /
      NULLIF(COUNT(*), 0) * 100, 1
    )
  ) INTO result
  FROM conversations
  WHERE store_id = p_store_id
    AND created_at > NOW() - (p_days || ' days')::interval;

  RETURN result;
END;
$$;

-- Helper function: Get top search terms
CREATE OR REPLACE FUNCTION get_top_search_terms(
  p_store_id TEXT,
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(term TEXT, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    LOWER(word) as term,
    COUNT(*) as count
  FROM conversations,
    LATERAL unnest(
      regexp_split_to_array(
        regexp_replace(LOWER(user_query), '[^a-zæøå0-9\s]', '', 'g'),
        '\s+'
      )
    ) as word
  WHERE store_id = p_store_id
    AND created_at > NOW() - (p_days || ' days')::interval
    AND LENGTH(word) > 3
    AND word NOT IN (
      'hva', 'har', 'dere', 'kan', 'jeg', 'finn', 'finne', 'hvor', 'hvordan',
      'dette', 'den', 'det', 'eller', 'som', 'med', 'til', 'for', 'ikke',
      'what', 'the', 'and', 'for', 'that', 'this', 'with', 'you', 'have'
    )
  GROUP BY LOWER(word)
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

-- Helper function: Get unanswered queries
CREATE OR REPLACE FUNCTION get_unanswered_queries(
  p_store_id TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  created_at TIMESTAMPTZ,
  user_query TEXT,
  ai_response TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.created_at,
    c.user_query,
    c.ai_response
  FROM conversations c
  WHERE c.store_id = p_store_id
    AND c.was_handled = false
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Helper function: Get daily chat volume
CREATE OR REPLACE FUNCTION get_daily_chat_volume(
  p_store_id TEXT,
  p_days INTEGER DEFAULT 14
)
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as count
  FROM conversations
  WHERE store_id = p_store_id
    AND created_at > NOW() - (p_days || ' days')::interval
  GROUP BY DATE(created_at)
  ORDER BY date ASC;
END;
$$;
