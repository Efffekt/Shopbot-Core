import { createSupabaseServerClient } from "./supabase-server";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "./admin-emails";

export async function verifySuperAdmin(): Promise<{ authorized: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, error: "Not authenticated" };
    }

    if (!user.email || !SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return { authorized: false, error: "Not authorized" };
    }

    return { authorized: true };
  } catch {
    return { authorized: false, error: "Authentication failed" };
  }
}

export async function verifyAdmin(): Promise<{
  authorized: boolean;
  isSuperAdmin: boolean;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, isSuperAdmin: false, error: "Not authenticated" };
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

    return { authorized: true, isSuperAdmin };
  } catch {
    return { authorized: false, isSuperAdmin: false, error: "Authentication failed" };
  }
}
