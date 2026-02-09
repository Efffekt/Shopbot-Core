import { NextResponse } from "next/server";

/**
 * Validates that a request has a JSON-compatible Content-Type header.
 * Returns an error response if invalid, or null if valid.
 */
export function validateJsonContentType(request: Request): NextResponse | null {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 }
    );
  }
  return null;
}
