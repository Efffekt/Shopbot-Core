-- Track when the widget is first detected on a customer's site
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS widget_first_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS widget_first_seen_domain TEXT;

-- Track onboarding nudge emails sent per tenant
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS onboarding_nudge_install_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_nudge_tips_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_nudge_reengage_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT FALSE;
