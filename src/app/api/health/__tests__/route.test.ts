import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET } from "../route";

// Helper to set env vars for each test
function setEnv(overrides: Record<string, string | undefined> = {}) {
  const defaults: Record<string, string | undefined> = {
    GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
      private_key: "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----\n",
      client_email: "test@project.iam.gserviceaccount.com",
    }),
    GOOGLE_CLOUD_PROJECT: "test-project",
    UPSTASH_REDIS_REST_URL: "https://fake-redis.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "fake-token",
  };

  const merged = { ...defaults, ...overrides };

  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Redis ping as healthy by default
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("PONG", { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok when all services are healthy", async () => {
    setEnv();
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
    expect(body.checks.vertexAi).toBe(true);
    expect(body.checks.redis).toBe(true);
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
  });

  it("returns degraded (503) when database fails", async () => {
    setEnv();
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
    expect(body.checks.vertexAi).toBe(true);
    expect(body.checks.redis).toBe(true);
  });

  it("returns degraded when database throws", async () => {
    setEnv();
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

  it("returns degraded when Vertex AI credentials are missing", async () => {
    setEnv({ GOOGLE_SERVICE_ACCOUNT_KEY: undefined, GOOGLE_CLOUD_PROJECT: undefined });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe(true);
    expect(body.checks.vertexAi).toBe(false);
  });

  it("returns degraded when Vertex AI credentials are malformed", async () => {
    setEnv({ GOOGLE_SERVICE_ACCOUNT_KEY: "not-valid-json" });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.checks.vertexAi).toBe(false);
  });

  it("returns degraded when Redis env vars are missing", async () => {
    setEnv({ UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database).toBe(true);
    expect(body.checks.redis).toBe(false);
  });

  it("returns degraded when Redis ping fails", async () => {
    setEnv();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ERR", { status: 500 }),
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.checks.redis).toBe(false);
  });

  it("returns degraded when Redis ping throws (network error)", async () => {
    setEnv();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.checks.redis).toBe(false);
  });

  it("sets Cache-Control header", async () => {
    setEnv();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=30");
  });
});
