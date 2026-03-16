import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createLogger } from "@/lib/logger";

const log = createLogger("middleware");

// Paths that require Supabase Auth (tenant dashboard + admin panel)
const SUPABASE_AUTH_PATHS = ["/dashboard", "/admin"];


function requiresSupabaseAuth(pathname: string): boolean {
  return SUPABASE_AUTH_PATHS.some((path) => pathname.startsWith(path));
}

/** Generate a random nonce for CSP */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/** Add security headers (CSP, X-Frame-Options, etc.) to a page response */
function addSecurityHeaders(response: NextResponse, nonce: string): void {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Note: 'unsafe-inline' is kept alongside nonce for backwards compatibility with
  // browsers that don't support nonces. Browsers that support nonces ignore 'unsafe-inline'.
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://www.google.com https://www.googletagmanager.com https://*.g.doubleclick.net https://*.stripe.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googletagmanager.com https://*.g.doubleclick.net https://www.google.com https://api.stripe.com",
    "frame-src https://www.googletagmanager.com https://js.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "upgrade-insecure-requests",
  ];
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));
}

/** Refresh the Supabase session and return the user + updated response.
 *  This must run for ALL page routes so token refresh cookies propagate. */
async function refreshSupabaseSession(request: NextRequest): Promise<{ user: unknown; response: NextResponse }> {
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

  return { user, response };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for API routes — three tiers (no session refresh needed):
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

    // CSRF protection for internal (same-origin) state-changing requests.
    // Widget-facing and public-wildcard routes are intentionally open.
    const isStateMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    if (isStateMutating && !isPublicWildcard && !isWidgetFacing) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            log.warn("CSRF: origin mismatch", { origin, host, pathname });
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Non-OPTIONS: let route handlers own their response CORS headers
    return NextResponse.next();
  }

  // All page routes: refresh Supabase session so token cookies stay valid
  const { user, response } = await refreshSupabaseSession(request);

  // Protected routes: require authentication
  if (requiresSupabaseAuth(pathname) && !user) {
    log.warn("Unauthenticated access attempt", { pathname });
    const loginUrl = new URL("/login", request.url);
    const safeRedirectPrefixes = ["/dashboard", "/admin"];
    if (safeRedirectPrefixes.some((p) => pathname.startsWith(p))) {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const nonce = generateNonce();
  response.headers.set("x-nonce", nonce);
  addSecurityHeaders(response, nonce);
  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon\\.png|manifest\\.json).*)",
  ],
};
