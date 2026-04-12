import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetUser, mockFrom, mockGetStripe, mockCheckRateLimit } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockGetStripe: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  getUser: mockGetUser,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => mockGetStripe(),
  PLANS: {
    starter: { name: "Start", credits: 1000, priceKr: 299, priceId: "price_starter", features: [] },
    pro: { name: "Vekst", credits: 5000, priceKr: 899, priceId: "price_pro", features: [] },
    business: { name: "Proff", credits: 20000, priceKr: 0, priceId: "", features: [] },
  },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  RATE_LIMITS: { stripeCheckout: { maxRequests: 5, windowMs: 3600000 } },
  getClientIp: () => "127.0.0.1",
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/lib/validate-content-type", () => ({
  validateJsonContentType: vi.fn(() => null),
}));

vi.mock("@/lib/facebook", () => ({
  trackInitiateCheckout: vi.fn().mockResolvedValue(undefined),
  extractFbCookies: () => ({}),
}));

import { POST } from "../route";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://preik.ai/api/stripe/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://preik.ai",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
  });

  it("returns 401 when not logged in", async () => {
    mockGetUser.mockResolvedValue(null);
    const res = await POST(makeRequest({ plan: "starter", companyName: "Test AS" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterMs: 3600000 });

    const res = await POST(makeRequest({ plan: "starter", companyName: "Test AS" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });

  it("returns 400 for invalid plan", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    const res = await POST(makeRequest({ plan: "nonexistent", companyName: "Test AS" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for business plan (contact-only)", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    const res = await POST(makeRequest({ plan: "business", companyName: "Test AS" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing company name", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    const res = await POST(makeRequest({ plan: "starter" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for short company name", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    const res = await POST(makeRequest({ plan: "starter", companyName: "A" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 when tenant slug already exists", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "test-as" }, error: null }),
        }),
      }),
    });

    const res = await POST(makeRequest({ plan: "starter", companyName: "Test AS" }));
    expect(res.status).toBe(409);
  });

  it("returns 413 for oversized payload", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    const res = await POST(makeRequest(
      { plan: "starter", companyName: "Test AS" },
      { "content-length": "100000" }
    ));
    expect(res.status).toBe(413);
  });

  it("creates checkout session on success", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    mockGetStripe.mockReturnValue({
      customers: {
        create: vi.fn().mockResolvedValue({ id: "cus_123" }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ client_secret: "cs_secret_test" }),
        },
      },
    });

    const res = await POST(makeRequest({ plan: "starter", companyName: "Test AS" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clientSecret).toBe("cs_secret_test");
  });
});
