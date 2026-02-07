import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createLogger } from "@/lib/logger";

const log = createLogger("middleware");

// Paths that require Supabase Auth (tenant dashboard + admin panel)
const SUPABASE_AUTH_PATHS = ["/dashboard", "/admin"];

// Paths that should remain public (no auth)
// Only the chat endpoint is public - it has its own domain/rate limiting protection
const PUBLIC_API_PATHS = ["/api/chat", "/api/user/tenants", "/api/tenant"];

function requiresSupabaseAuth(pathname: string): boolean {
  return SUPABASE_AUTH_PATHS.some((path) => pathname.startsWith(path));
}

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));
}

async function verifySupabaseAuth(request: NextRequest): Promise<{ authenticated: boolean; response?: NextResponse }> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  return { authenticated: !!user, response };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires Supabase Auth (tenant dashboard + admin panel)
  if (requiresSupabaseAuth(pathname)) {
    const { authenticated, response } = await verifySupabaseAuth(request);
    if (!authenticated) {
      log.warn("Unauthenticated access attempt", { pathname });
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Handle CORS for API routes — three tiers:
  // 1. Public-wildcard: /api/widget, /api/health → Access-Control-Allow-Origin: *
  // 2. Widget-facing: /api/chat, /api/contact → reflect request Origin, Vary: Origin
  // 3. Internal (everything else) → no CORS headers (same-origin only)
  if (pathname.startsWith("/api/")) {
    const isPublicWildcard = pathname.startsWith("/api/widget") || pathname.startsWith("/api/health");
    const isWidgetFacing = pathname.startsWith("/api/chat") || pathname.startsWith("/api/contact");

    if (request.method === "OPTIONS") {
      const preflightHeaders: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Content-Length": "0",
      };

      if (isPublicWildcard) {
        preflightHeaders["Access-Control-Allow-Origin"] = "*";
      } else if (isWidgetFacing) {
        const origin = request.headers.get("origin");
        if (origin) {
          preflightHeaders["Access-Control-Allow-Origin"] = origin;
          preflightHeaders["Vary"] = "Origin";
        }
      }
      // Internal routes: no CORS headers → browser blocks cross-origin preflight

      return new NextResponse(null, { status: 200, headers: preflightHeaders });
    }

    // Non-OPTIONS: let route handlers own their response CORS headers
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/dashboard/:path*"],
};
