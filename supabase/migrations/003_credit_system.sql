-- Credit / Usage Tracking System
-- Each user message costs 1 credit. Tenants have a monthly credit limit.

-- Add credit columns to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS credit_limit INTEGER NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Credit usage log for audit trail
CREATE TABLE IF NOT EXISTS credit_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT,
  credits_consumed INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_log_tenant_id ON credit_usage_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_created_at ON credit_usage_log(created_at);

ALTER TABLE credit_usage_log ENABLE ROW LEVEL SECURITY;

-- Function: atomically increment credits and check limit
CREATE OR REPLACE FUNCTION increment_credits(p_tenant_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $func$
DECLARE
  v_credit_limit INTEGER;
  v_credits_used INTEGER;
BEGIN
  UPDATE tenants
  SET credits_used = credits_used + 1
  WHERE id = p_tenant_id
    AND credits_used < credit_limit
  RETURNING credit_limit, credits_used
  INTO v_credit_limit, v_credits_used;

  IF NOT FOUND THEN
    SELECT credit_limit, credits_used
    INTO v_credit_limit, v_credits_used
    FROM tenants
    WHERE id = p_tenant_id;

    RETURN json_build_object(
      'allowed', false,
      'credits_used', COALESCE(v_credits_used, 0),
      'credit_limit', COALESCE(v_credit_limit, 0)
    );
  END IF;

  INSERT INTO credit_usage_log (tenant_id, credits_consumed)
  VALUES (p_tenant_id, 1);

  RETURN json_build_object(
    'allowed', true,
    'credits_used', v_credits_used,
    'credit_limit', v_credit_limit
  );
END;
$func$;

-- Function: get current credit status
CREATE OR REPLACE FUNCTION get_credit_status(p_tenant_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $func$
DECLARE
  v_credit_limit INTEGER;
  v_credits_used INTEGER;
  v_billing_cycle_start TIMESTAMPTZ;
BEGIN
  SELECT credit_limit, credits_used, billing_cycle_start
  INTO v_credit_limit, v_credits_used, v_billing_cycle_start
  FROM tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Tenant not found');
  END IF;

  RETURN json_build_object(
    'credit_limit', v_credit_limit,
    'credits_used', v_credits_used,
    'credits_remaining', v_credit_limit - v_credits_used,
    'billing_cycle_start', v_billing_cycle_start,
    'percent_used', CASE WHEN v_credit_limit > 0
      THEN ROUND((v_credits_used::NUMERIC / v_credit_limit) * 100)
      ELSE 0
    END
  );
END;
$func$;

-- Function: reset credits for a tenant (admin/monthly reset)
CREATE OR REPLACE FUNCTION reset_credits(p_tenant_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $func$
BEGIN
  UPDATE tenants
  SET credits_used = 0,
      billing_cycle_start = NOW()
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Tenant not found');
  END IF;

  RETURN json_build_object('success', true, 'billing_cycle_start', NOW());
END;
$func$;
