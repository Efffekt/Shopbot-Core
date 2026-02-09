import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getUser: () => mockGetUser(),
  createSupabaseServerClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

vi.mock("@/lib/tenants", () => ({
  TENANT_CONFIGS: {
    "test-tenant": { name: "Test Tenant", persona: "A helpful bot" },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { GET } from "../route";

describe("GET /api/user/tenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns tenant list for authenticated user", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockEq.mockResolvedValue({
      data: [{ tenant_id: "test-tenant", role: "admin" }],
      error: null,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tenants).toHaveLength(1);
    expect(body.tenants[0]).toEqual({
      id: "test-tenant",
      name: "Test Tenant",
      role: "admin",
      persona: "A helpful bot",
    });
  });

  it("uses tenant_id as name when no config exists", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockEq.mockResolvedValue({
      data: [{ tenant_id: "unknown-tenant", role: "viewer" }],
      error: null,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.tenants[0].name).toBe("unknown-tenant");
    expect(body.tenants[0].persona).toBeNull();
  });

  it("returns 500 on database error", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockEq.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });

  it("sets cache headers", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1" });
    mockEq.mockResolvedValue({ data: [], error: null });

    const res = await GET();
    expect(res.headers.get("Cache-Control")).toContain("private");
  });
});
