import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

import { shouldSendWarningEmail, checkAndIncrementCredits } from "@/lib/credits";
import { supabaseAdmin } from "@/lib/supabase";

describe("shouldSendWarningEmail", () => {
  it("returns null when below 80%", () => {
    expect(shouldSendWarningEmail(70, 100)).toBeNull();
    expect(shouldSendWarningEmail(0, 100)).toBeNull();
    expect(shouldSendWarningEmail(79, 100)).toBeNull();
  });

  it("returns '80' when at or above 80%", () => {
    expect(shouldSendWarningEmail(80, 100)).toBe("80");
    expect(shouldSendWarningEmail(90, 100)).toBe("80");
    expect(shouldSendWarningEmail(99, 100)).toBe("80");
  });

  it("returns '100' when at or above 100%", () => {
    expect(shouldSendWarningEmail(100, 100)).toBe("100");
    expect(shouldSendWarningEmail(150, 100)).toBe("100");
  });

  it("returns null when credit limit is 0", () => {
    expect(shouldSendWarningEmail(50, 0)).toBeNull();
  });

  it("returns null when credit limit is negative", () => {
    expect(shouldSendWarningEmail(50, -10)).toBeNull();
  });
});

describe("checkAndIncrementCredits", () => {
  const mockRpc = supabaseAdmin.rpc as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allowed when credits are available", async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: true, credits_used: 5, credit_limit: 100 },
      error: null,
    });

    const result = await checkAndIncrementCredits("test-tenant");
    expect(result.allowed).toBe(true);
    expect(result.creditsUsed).toBe(5);
    expect(result.creditLimit).toBe(100);
    expect(result.percentUsed).toBe(5);
  });

  it("returns not allowed when credits exhausted", async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: false, credits_used: 100, credit_limit: 100 },
      error: null,
    });

    const result = await checkAndIncrementCredits("test-tenant");
    expect(result.allowed).toBe(false);
    expect(result.percentUsed).toBe(100);
  });

  it("fails closed on database error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const result = await checkAndIncrementCredits("test-tenant");
    expect(result.allowed).toBe(false);
  });

  it("calculates percentUsed correctly", async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: true, credits_used: 33, credit_limit: 100 },
      error: null,
    });

    const result = await checkAndIncrementCredits("test-tenant");
    expect(result.percentUsed).toBe(33);
  });

  it("handles zero credit limit without division error", async () => {
    mockRpc.mockResolvedValue({
      data: { allowed: true, credits_used: 0, credit_limit: 0 },
      error: null,
    });

    const result = await checkAndIncrementCredits("test-tenant");
    expect(result.percentUsed).toBe(0);
  });
});
