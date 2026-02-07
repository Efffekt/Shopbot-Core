-- Email system support columns
-- last_credit_warning tracks which warning level was last sent ("80" or "100")
-- contact_email is where credit warnings are sent

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS last_credit_warning TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Update reset_credits to also clear the warning flag
CREATE OR REPLACE FUNCTION reset_credits(p_tenant_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $func$
BEGIN
  UPDATE tenants
  SET credits_used = 0,
      billing_cycle_start = NOW(),
      last_credit_warning = NULL
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Tenant not found');
  END IF;

  RETURN json_build_object('success', true, 'billing_cycle_start', NOW());
END;
$func$;
