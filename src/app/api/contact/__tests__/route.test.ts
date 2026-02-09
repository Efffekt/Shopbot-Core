import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
  RATE_LIMITS: { contact: { maxRequests: 5, windowMs: 3600000 } },
}));

vi.mock("@/lib/email", () => ({
  sendContactNotification: vi.fn(async () => {}),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { POST } from "../route";
import { checkRateLimit } from "@/lib/ratelimit";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://preik.no/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "1.2.3.4",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts valid contact submission", async () => {
    const res = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        message: "Hello world",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("accepts submission with company field", async () => {
    const res = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        company: "Test AS",
        message: "Hello",
      })
    );
    expect(res.status).toBe(200);
  });

  it("rejects missing name", async () => {
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        message: "Hello",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid input");
  });

  it("rejects invalid email", async () => {
    const res = await POST(
      makeRequest({
        name: "Test",
        email: "not-an-email",
        message: "Hello",
      })
    );
    expect(res.status).toBe(400);
  });

  it("rejects missing message", async () => {
    const res = await POST(
      makeRequest({
        name: "Test",
        email: "test@example.com",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3600000,
      retryAfterMs: 3600000,
    });

    const res = await POST(
      makeRequest({
        name: "Test",
        email: "test@example.com",
        message: "Hello",
      })
    );

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("rejects oversized payload", async () => {
    const res = await POST(
      makeRequest(
        { name: "Test", email: "test@example.com", message: "Hello" },
        { "content-length": "20000" }
      )
    );

    expect(res.status).toBe(413);
  });

  it("sets CORS headers for allowed origins", async () => {
    const res = await POST(
      makeRequest(
        { name: "Test", email: "test@example.com", message: "Hello" },
        { origin: "https://preik.no" }
      )
    );

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://preik.no");
  });

  it("does not set CORS for unknown origins", async () => {
    const res = await POST(
      makeRequest(
        { name: "Test", email: "test@example.com", message: "Hello" },
        { origin: "https://evil.com" }
      )
    );

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
