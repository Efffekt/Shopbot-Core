import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { trackCompleteRegistration, extractFbCookies } from "@/lib/facebook";
import { getClientIp } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
    }

    // Fire CompleteRegistration event for new sign-ups
    if (data.user) {
      const { fbc, fbp } = extractFbCookies(request.headers.get("cookie"));
      trackCompleteRegistration({
        email: data.user.email,
        externalId: data.user.id,
        ip: getClientIp(request.headers),
        userAgent: request.headers.get("user-agent") || undefined,
        sourceUrl: request.url,
        fbc,
        fbp,
      }).catch(() => {});
    }
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
