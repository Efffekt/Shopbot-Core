export interface TenantFull {
  id: string;
  name: string;
  allowed_domains: string[];
  language: string;
  persona: string;
  created_at: string;
  credit_limit: number;
  credits_used: number;
  billing_cycle_start: string;
  features: Record<string, boolean>;
}

export interface ConversationRecord {
  id: string;
  created_at: string;
  store_id: string;
  session_id: string | null;
  user_query: string;
  ai_response: string | null;
  detected_intent: string;
  was_handled: boolean;
  referred_to_email: boolean;
  metadata: Record<string, unknown>;
}

export interface CreditLogEntry {
  id: string;
  tenant_id: string;
  created_at: string;
  session_id: string | null;
  credits_consumed: number;
}

export interface AdminOverviewStats {
  total_tenants: number;
  total_conversations: number;
  conversations_30d: number;
  total_documents: number;
  tenants_near_limit: number;
}

export interface ActiveTenant {
  tenant_id: string;
  tenant_name: string;
  conversation_count: number;
  credit_usage: number;
}

export interface GlobalUser {
  id: string;
  email: string;
  created_at: string;
  memberships: {
    tenant_id: string;
    tenant_name: string;
    role: string;
  }[];
}
