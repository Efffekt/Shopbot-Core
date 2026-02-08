import { createSupabaseServerClient } from "./supabase-server";
import { supabaseAdmin } from "./supabase";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "./admin-emails";
import { checkRateLimit, RATE_LIMITS } from "./ratelimit";

export async function verifySuperAdmin(): Promise<{ authorized: boolean; email?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, error: "Not authenticated" };
    }

    if (!user.email_confirmed_at) {
      return { authorized: false, error: "Email not verified" };
    }

    if (!user.email || !SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return { authorized: false, error: "Not authorized" };
    }

    // Rate limit by email
    const rl = await checkRateLimit(`admin:${user.email}`, RATE_LIMITS.admin);
    if (!rl.allowed) {
      return { authorized: false, error: "Rate limit exceeded" };
    }

    return { authorized: true, email: user.email };
  } catch {
    return { authorized: false, error: "Authentication failed" };
  }
}

export async function verifyAdmin(): Promise<{
  authorized: boolean;
  isSuperAdmin: boolean;
  email?: string;
  userId?: string;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, isSuperAdmin: false, error: "Not authenticated" };
    }

    if (!user.email_confirmed_at) {
      return { authorized: false, isSuperAdmin: false, error: "Email not verified" };
    }

    const email = user.email?.toLowerCase();
    if (!email) {
      return { authorized: false, isSuperAdmin: false, error: "Not authorized" };
    }

    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
    const isAdmin = ADMIN_EMAILS.includes(email);

    if (!isSuperAdmin && !isAdmin) {
      return { authorized: false, isSuperAdmin: false, error: "Not authorized" };
    }

    // Rate limit by email
    const rl = await checkRateLimit(`admin:${email}`, RATE_LIMITS.admin);
    if (!rl.allowed) {
      return { authorized: false, isSuperAdmin: false, error: "Rate limit exceeded" };
    }

    return { authorized: true, isSuperAdmin, email, userId: user.id };
  } catch {
    return { authorized: false, isSuperAdmin: false, error: "Authentication failed" };
  }
}

/**
 * Verify admin has access to a specific tenant.
 * Super-admins bypass tenant check. Regular admins must have tenant_user_access.
 */
export async function verifyAdminTenantAccess(tenantId: string): Promise<{
  authorized: boolean;
  isSuperAdmin: boolean;
  email?: string;
  error?: string;
}> {
  const adminResult = await verifyAdmin();
  if (!adminResult.authorized) return adminResult;

  // Super-admins can access any tenant
  if (adminResult.isSuperAdmin) return adminResult;

  // Regular admins: check tenant_user_access
  if (!adminResult.userId) {
    return { authorized: false, isSuperAdmin: false, error: "Authentication failed" };
  }

  const { data: access } = await supabaseAdmin
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", adminResult.userId)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) {
    return { authorized: false, isSuperAdmin: false, error: "No access to this tenant" };
  }

  return adminResult;
}
