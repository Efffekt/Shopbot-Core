import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Hoisted mocks
const { mockFrom, mockGetStripe, mockLogAudit, mockSendWelcomeEmail } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetStripe: vi.fn(),
  mockLogAudit: vi.fn(),
  mockSendWelcomeEmail: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => mockGetStripe(),
  PLANS: {
    starter: { name: "Start", credits: 1000, priceKr: 299, priceId: "price_starter", features: [] },
    pro: { name: "Vekst", credits: 5000, priceKr: 899, priceId: "price_pro", features: [] },
  },
  getPlanByPriceId: (priceId: string) => {
    if (priceId === "price_starter") return { key: "starter", plan: { credits: 1000 } };
    if (priceId === "price_pro") return { key: "pro", plan: { credits: 5000 } };
    return null;
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mockLogAudit,
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { POST } from "../route";

const WEBHOOK_SECRET = "whsec_test_secret";

function makeRequest(body: string, signature: string | null = "sig_test") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;
  return new NextRequest("https://preik.ai/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    mockSendWelcomeEmail.mockResolvedValue(undefined);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await POST(makeRequest("{}", null));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing stripe-signature");
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Webhook not configured");
  });

  it("returns 400 when signature verification fails", async () => {
    mockGetStripe.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error("Invalid signature");
        }),
      },
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("handles checkout.session.completed and provisions tenant", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          mode: "subscription",
          subscription: "sub_123",
          customer: "cus_123",
          metadata: {
            userId: "user-1",
            userEmail: "user@test.com",
            tenantSlug: "test-shop",
            companyName: "Test Shop",
            plan: "starter",
          },
        },
      },
    };

    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: vi.fn().mockReturnValue(mockEvent) },
    });

    // No existing tenant with this subscription
    mockFrom.mockImplementation((table: string) => {
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "tenant_user_access") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", entityType: "tenant" })
    );
  });

  it("skips non-subscription checkout sessions", async () => {
    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          mode: "payment", // not subscription
          metadata: {},
        },
      },
    };

    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: vi.fn().mockReturnValue(mockEvent) },
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    // Should not have called from() for tenant creation
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("handles customer.subscription.deleted", async () => {
    const mockEvent = {
      type: "customer.subscription.deleted",
      data: {
        object: { id: "sub_123" },
      },
    };

    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: vi.fn().mockReturnValue(mockEvent) },
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "test-shop", contact_email: "admin@test.com" },
            error: null,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "subscription_cancelled" })
    );
  });

  it("returns ok for unhandled event types", async () => {
    const mockEvent = { type: "payment_intent.succeeded", data: { object: {} } };
    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent: vi.fn().mockReturnValue(mockEvent) },
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});
