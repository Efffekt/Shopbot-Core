import { createSupabaseServerClient } from "./supabase-server";

// Super admin emails that can access /admin routes
const SUPER_ADMIN_EMAILS = [
  "daniel@efffekt.no",
];

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
