import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
          })),
        })),
      })),
    })),
  },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 59, resetAt: Date.now() + 60000 })),
  RATE_LIMITS: { admin: { maxRequests: 60, windowMs: 60000 } },
}));

vi.mock("@/lib/admin-emails", () => ({
  SUPER_ADMIN_EMAILS: ["super@test.com"],
  ADMIN_EMAILS: ["admin@test.com"],
}));

import { verifySuperAdmin, verifyAdmin, verifyAdminTenantAccess } from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { supabaseAdmin } from "@/lib/supabase";

describe("verifySuperAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

    const result = await verifySuperAdmin();
    expect(result.authorized).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });

  it("rejects users with unverified email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "super@test.com", email_confirmed_at: null } },
      error: null,
    });

    const result = await verifySuperAdmin();
    expect(result.authorized).toBe(false);
    expect(result.error).toBe("Email not verified");
  });

  it("rejects non-super-admin users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "nobody@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifySuperAdmin();
    expect(result.authorized).toBe(false);
    expect(result.error).toBe("Not authorized");
  });

  it("allows super admin users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "super@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifySuperAdmin();
    expect(result.authorized).toBe(true);
    expect(result.email).toBe("super@test.com");
  });

  it("enforces rate limiting", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "super@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false, remaining: 0, resetAt: Date.now() + 60000, retryAfterMs: 60000,
    });

    const result = await verifySuperAdmin();
    expect(result.authorized).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });
});

describe("verifyAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

    const result = await verifyAdmin();
    expect(result.authorized).toBe(false);
    expect(result.isSuperAdmin).toBe(false);
  });

  it("allows admin users (non-super)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "2", email: "admin@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifyAdmin();
    expect(result.authorized).toBe(true);
    expect(result.isSuperAdmin).toBe(false);
    expect(result.email).toBe("admin@test.com");
  });

  it("identifies super admins correctly", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "super@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifyAdmin();
    expect(result.authorized).toBe(true);
    expect(result.isSuperAdmin).toBe(true);
  });

  it("rejects users not in any admin list", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "3", email: "random@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifyAdmin();
    expect(result.authorized).toBe(false);
  });

  it("returns userId for admin users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-id-123", email: "admin@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifyAdmin();
    expect(result.userId).toBe("user-id-123");
  });
});

describe("verifyAdminTenantAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows super-admin access to any tenant without DB check", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "1", email: "super@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifyAdminTenantAccess("any-tenant");
    expect(result.authorized).toBe(true);
    expect(result.isSuperAdmin).toBe(true);
  });

  it("allows regular admin with tenant_user_access record", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-2", email: "admin@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });

    const result = await verifyAdminTenantAccess("tenant-1");
    expect(result.authorized).toBe(true);
    expect(result.isSuperAdmin).toBe(false);
  });

  it("denies regular admin without tenant_user_access record", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-2", email: "admin@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });
    // Override the mock to return null (no access)
    const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>;
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          })),
        })),
      })),
    });

    const result = await verifyAdminTenantAccess("other-tenant");
    expect(result.authorized).toBe(false);
    expect(result.error).toBe("No access to this tenant");
  });

  it("denies unauthenticated users", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

    const result = await verifyAdminTenantAccess("tenant-1");
    expect(result.authorized).toBe(false);
    expect(result.error).toBe("Not authenticated");
  });
});
