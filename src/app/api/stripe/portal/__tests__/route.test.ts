import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetUser, mockFrom, mockGetStripe } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockGetStripe: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  getUser: mockGetUser,
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => mockGetStripe(),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { POST } from "../route";

function makeRequest(body: unknown) {
  return new NextRequest("https://preik.ai/api/stripe/portal", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://preik.ai" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not logged in", async () => {
    mockGetUser.mockResolvedValue(null);
    const res = await POST(makeRequest({ tenantId: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when tenantId is missing", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not admin", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: "viewer" }, error: null }),
          }),
        }),
      }),
    });

    const res = await POST(makeRequest({ tenantId: "test" }));
    expect(res.status).toBe(403);
  });

  it("returns 404 when tenant has no stripe_customer_id", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });

    // First call: tenant_user_access check
    // Second call: tenants check
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: null }, error: null }),
          }),
        }),
      };
    });

    const res = await POST(makeRequest({ tenantId: "test" }));
    expect(res.status).toBe(404);
  });

  it("returns portal URL on success", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "test@test.com" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { stripe_customer_id: "cus_123" }, error: null }),
          }),
        }),
      };
    });

    mockGetStripe.mockReturnValue({
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/session/test" }),
        },
      },
    });

    const res = await POST(makeRequest({ tenantId: "test" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://billing.stripe.com/session/test");
  });
});
