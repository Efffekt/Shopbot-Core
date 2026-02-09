import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFrom, mockResetCredits } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockResetCredits: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/credits", () => ({
  resetCredits: (...args: unknown[]) => mockResetCredits(...args),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { GET } from "../route";

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("https://preik.no/api/cron/reset-credits", {
    method: "GET",
    headers,
  });
}

describe("GET /api/cron/reset-credits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
  });

  it("rejects unauthorized requests", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("rejects wrong bearer token", async () => {
    const res = await GET(makeRequest({ authorization: "Bearer wrong-secret" }));
    expect(res.status).toBe(401);
  });

  it("skips if already ran recently (idempotency)", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [{ id: 1 }] }),
          }),
        }),
      }),
    });

    const res = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.skipped).toBe(true);
  });

  it("resets credits for eligible tenants", async () => {
    // audit_log check (no recent run), audit_log insert, tenants query, conversations cleanup
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      callCount++;
      if (table === "audit_log" && callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
        };
      }
      if (table === "audit_log" && callCount === 2) {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              gt: vi.fn().mockResolvedValue({
                data: [
                  { id: "t1", name: "Tenant 1", billing_cycle_start: "2024-01-01", credits_used: 50 },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "conversations") {
        return {
          delete: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        };
      }
      return {};
    });

    mockResetCredits.mockResolvedValue(true);

    const res = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.reset).toBe(1);
    expect(body.conversationsDeleted).toBe(5);
    expect(mockResetCredits).toHaveBeenCalledWith("t1");
  });

  it("reports no tenants need reset", async () => {
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      callCount++;
      if (table === "audit_log" && callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [] }),
              }),
            }),
          }),
        };
      }
      if (table === "audit_log" && callCount === 2) {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "tenants") {
        return {
          select: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              gt: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest({ authorization: "Bearer test-cron-secret" }));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.reset).toBe(0);
  });
});
