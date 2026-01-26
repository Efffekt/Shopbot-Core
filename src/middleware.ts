import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require Basic Authentication
// SECURITY: All admin/scrape/ingest endpoints require authentication
const PROTECTED_PATHS = [
  "/admin",
  "/api/scrape",
  "/api/ingest",
  "/api/admin",
];

// Paths that should remain public (no auth)
// Only the chat endpoint is public - it has its own domain/rate limiting protection
const PUBLIC_API_PATHS = ["/api/chat"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path requires authentication
  if (isProtectedPath(pathname)) {
    if (!verifyBasicAuth(request)) {
      console.warn(`🚫 Unauthorized access attempt to: ${pathname}`);
      return unauthorizedResponse();
    }
  }

  // Handle CORS preflight for API routes
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
