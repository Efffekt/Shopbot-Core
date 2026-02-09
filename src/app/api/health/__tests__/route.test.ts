import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET } from "../route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok when database is healthy", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe(true);
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
  });

  it("returns degraded (503) when database fails", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: { message: "connection refused" } }),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe(false);
  });

  it("returns degraded when database throws", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockRejectedValue(new Error("timeout")),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.checks.database).toBe(false);
  });

  it("sets Cache-Control header", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=30");
  });
});
