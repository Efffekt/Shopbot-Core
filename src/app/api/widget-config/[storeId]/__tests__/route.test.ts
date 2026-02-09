import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 59 })),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { GET, OPTIONS } from "../route";
import { checkRateLimit } from "@/lib/ratelimit";

function makeParams(storeId: string) {
  return { params: Promise.resolve({ storeId }) };
}

describe("GET /api/widget-config/[storeId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns config for valid storeId", async () => {
    const config = { accentColor: "#ff0000", greeting: "Hi!" };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { config }, error: null }),
        }),
      }),
    });

    const req = new NextRequest("https://preik.no/api/widget-config/test-store");
    const res = await GET(req, makeParams("test-store"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.config).toEqual(config);
  });

  it("returns null config for non-existent store", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
        }),
      }),
    });

    const req = new NextRequest("https://preik.no/api/widget-config/unknown");
    const res = await GET(req, makeParams("unknown"));
    const body = await res.json();

    expect(body.config).toBeNull();
  });

  it("returns null for invalid storeId (special chars)", async () => {
    const req = new NextRequest("https://preik.no/api/widget-config/bad%20id!");
    const res = await GET(req, makeParams("bad id!"));
    const body = await res.json();

    expect(body.config).toBeNull();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
      retryAfterMs: 60000,
    });

    const req = new NextRequest("https://preik.no/api/widget-config/test-store");
    const res = await GET(req, makeParams("test-store"));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("sets wildcard CORS headers", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { config: {} }, error: null }),
        }),
      }),
    });

    const req = new NextRequest("https://preik.no/api/widget-config/test-store");
    const res = await GET(req, makeParams("test-store"));

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("OPTIONS /api/widget-config/[storeId]", () => {
  it("returns 204 with CORS headers", async () => {
    const res = await OPTIONS();

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
