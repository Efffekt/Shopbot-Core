-- Shopify app integration: link Shopify shops to tenants
CREATE TABLE shopify_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL UNIQUE,
  shopify_shop_id BIGINT,
  access_token TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopify_shop_domain ON shopify_installations(shop_domain);
CREATE INDEX idx_shopify_tenant_id ON shopify_installations(tenant_id);

ALTER TABLE shopify_installations ENABLE ROW LEVEL SECURITY;
