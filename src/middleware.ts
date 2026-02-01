import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Paths that require Basic Authentication (admin panel)
// SECURITY: All admin/scrape/ingest endpoints require authentication
const BASIC_AUTH_PATHS = [
  "/admin",
  "/api/scrape",
  "/api/ingest",
  "/api/admin",
];

// Paths that require Supabase Auth (tenant dashboard)
const SUPABASE_AUTH_PATHS = ["/dashboard"];

// Paths that should remain public (no auth)
// Only the chat endpoint is public - it has its own domain/rate limiting protection
const PUBLIC_API_PATHS = ["/api/chat", "/api/user/tenants", "/api/tenant"];

function requiresBasicAuth(pathname: string): boolean {
  return BASIC_AUTH_PATHS.some((path) => pathname.startsWith(path));
}

function requiresSupabaseAuth(pathname: string): boolean {
  return SUPABASE_AUTH_PATHS.some((path) => pathname.startsWith(path));
}

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));
}

function verifyBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(":");

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD not set in environment");
    return false;
  }

  return username === validUsername && password === validPassword;
}

function unauthorizedResponse(): NextResponse {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ShopBot Admin"',
      "Content-Type": "text/plain",
    },
  });
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

  // Check if path requires Basic Authentication (admin panel)
  if (requiresBasicAuth(pathname)) {
    if (!verifyBasicAuth(request)) {
      console.warn(`🚫 Unauthorized access attempt to: ${pathname}`);
      return unauthorizedResponse();
    }
  }

  // Check if path requires Supabase Auth (tenant dashboard)
  if (requiresSupabaseAuth(pathname)) {
    const { authenticated, response } = await verifySupabaseAuth(request);
    if (!authenticated) {
      console.warn(`🚫 Unauthenticated access attempt to dashboard: ${pathname}`);
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Handle CORS preflight for API routes
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Expose-Headers": "Content-Type, X-RateLimit-Remaining, X-RateLimit-Reset",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Expose-Headers", "Content-Type, X-RateLimit-Remaining, X-RateLimit-Reset");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/dashboard/:path*"],
};
