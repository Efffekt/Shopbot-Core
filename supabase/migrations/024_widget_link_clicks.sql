-- Widget Link Click Tracking
-- Tracks when users click outbound links in chatbot responses
-- Used for UTM attribution and conversion analytics

CREATE TABLE IF NOT EXISTS widget_link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  store_id TEXT NOT NULL,
  session_id TEXT,
  clicked_url TEXT NOT NULL,
  link_text TEXT,
  page_url TEXT,
  client_timestamp TEXT,
  message_count INTEGER,
  ip_hash TEXT
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_widget_link_clicks_store_id ON widget_link_clicks(store_id);
CREATE INDEX IF NOT EXISTS idx_widget_link_clicks_created_at ON widget_link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_widget_link_clicks_session ON widget_link_clicks(store_id, session_id);

-- Enable RLS
ALTER TABLE widget_link_clicks ENABLE ROW LEVEL SECURITY;

-- Service role full access (API inserts via supabaseAdmin)
CREATE POLICY "Service role has full access on widget_link_clicks"
  ON widget_link_clicks FOR ALL USING (true) WITH CHECK (true);

-- Data retention: auto-delete after 90 days (matches conversation retention)
-- Uses the existing pg_cron setup from migration 018
SELECT cron.schedule(
  'cleanup-widget-link-clicks',
  '0 3 * * *',
  $func$DELETE FROM widget_link_clicks WHERE created_at < NOW() - INTERVAL '90 days';$func$
);

-- Helper: Get click stats for a store
CREATE OR REPLACE FUNCTION get_click_stats(
  p_store_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
AS $func$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clicks', COUNT(*),
    'unique_sessions', COUNT(DISTINCT session_id),
    'unique_urls', COUNT(DISTINCT clicked_url),
    'clicks_per_day', ROUND(COUNT(*)::numeric / GREATEST(p_days, 1), 1)
  ) INTO result
  FROM widget_link_clicks
  WHERE store_id = p_store_id
    AND created_at > NOW() - (p_days || ' days')::interval;

  RETURN result;
END;
$func$;

-- Helper: Get top clicked URLs for a store
CREATE OR REPLACE FUNCTION get_top_clicked_urls(
  p_store_id TEXT,
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(url TEXT, link_label TEXT, clicks BIGINT, unique_sessions BIGINT)
LANGUAGE plpgsql
AS $func$
BEGIN
  RETURN QUERY
  SELECT
    clicked_url AS url,
    MAX(link_text) AS link_label,
    COUNT(*) AS clicks,
    COUNT(DISTINCT session_id) AS unique_sessions
  FROM widget_link_clicks
  WHERE store_id = p_store_id
    AND created_at > NOW() - (p_days || ' days')::interval
  GROUP BY clicked_url
  ORDER BY clicks DESC
  LIMIT p_limit;
END;
$func$;
