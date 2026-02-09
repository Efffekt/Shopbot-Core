import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { SUPER_ADMIN_EMAILS, ADMIN_EMAILS } from "@/lib/admin-emails";

// Returns the correct redirect path after login based on user role.
// Keeps admin email lists server-only (no NEXT_PUBLIC_ exposure).
export async function GET() {
  const user = await getUser();

  if (!user?.email) {
    return NextResponse.json({ redirect: "/dashboard" });
  }

  const email = user.email.toLowerCase();

  if (SUPER_ADMIN_EMAILS.includes(email) || ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ redirect: "/admin" });
  }

  return NextResponse.json({ redirect: "/dashboard" });
}
