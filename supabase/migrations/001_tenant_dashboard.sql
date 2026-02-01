-- Store editable prompts per tenant
CREATE TABLE tenant_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  version INTEGER DEFAULT 1
);

-- Link users to tenants they can access
CREATE TABLE tenant_user_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Indexes
CREATE INDEX idx_tenant_prompts_tenant_id ON tenant_prompts(tenant_id);
CREATE INDEX idx_tenant_user_access_user_id ON tenant_user_access(user_id);

-- RLS Policies
ALTER TABLE tenant_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_user_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant prompts" ON tenant_prompts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_user_access WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update own tenant prompts" ON tenant_prompts FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM tenant_user_access WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert tenant prompts" ON tenant_prompts FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_user_access WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can see own access" ON tenant_user_access FOR SELECT
  USING (user_id = auth.uid());
