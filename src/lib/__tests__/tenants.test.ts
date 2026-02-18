import { describe, it, expect, vi } from "vitest";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

// Mock supabase before importing tenants
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(),
  }),
}));

// Default: from() returns a chain that resolves to empty/no-op
mockFrom.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
});

import { getTenantConfig, validateOrigin, TENANT_CONFIGS, DEFAULT_TENANT, getAllTenantsFromDB } from "../tenants";

describe("getTenantConfig", () => {
  it("returns config for known tenant", () => {
    const config = getTenantConfig("baatpleiebutikken");
    expect(config).not.toBeNull();
    expect(config!.name).toBe("Båtpleiebutikken");
  });

  it("returns null for unknown tenant", () => {
    expect(getTenantConfig("nonexistent")).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(getTenantConfig(null)).toBeNull();
    expect(getTenantConfig(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getTenantConfig("")).toBeNull();
  });
});

describe("TENANT_CONFIGS", () => {
  it("all tenants have required fields", () => {
    for (const [id, config] of Object.entries(TENANT_CONFIGS)) {
      expect(config.id).toBe(id);
      expect(config.name).toBeTruthy();
      expect(config.language).toBeTruthy();
      expect(config.systemPrompt).toBeTruthy();
      expect(Array.isArray(config.allowedDomains)).toBe(true);
      expect(config.allowedDomains.length).toBeGreaterThan(0);
    }
  });

  it("DEFAULT_TENANT exists in configs", () => {
    expect(TENANT_CONFIGS[DEFAULT_TENANT]).toBeDefined();
  });
});

describe("validateOrigin", () => {
  const config = TENANT_CONFIGS["baatpleiebutikken"];

  it("rejects null origin and referer in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = validateOrigin(config, null, null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Missing origin");
    vi.unstubAllEnvs();
  });

  it("rejects unauthorized domain in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = validateOrigin(config, "https://evil.com", null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("not authorized");
    vi.unstubAllEnvs();
  });

  it("allows authorized domain in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = validateOrigin(config, "https://baatpleiebutikken.no", null);
    expect(result.allowed).toBe(true);
    vi.unstubAllEnvs();
  });

  it("allows subdomain matching in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = validateOrigin(config, "https://www.baatpleiebutikken.no", null);
    expect(result.allowed).toBe(true);
    vi.unstubAllEnvs();
  });

  it("allows all origins in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = validateOrigin(config, "https://anything.com", null);
    expect(result.allowed).toBe(true);
    vi.unstubAllEnvs();
  });

  it("falls back to referer when origin is null", () => {
    vi.stubEnv("NODE_ENV", "production");
    const result = validateOrigin(config, null, "https://baatpleiebutikken.no/page");
    expect(result.allowed).toBe(true);
    vi.unstubAllEnvs();
  });

  it("normalizes full URLs stored in allowedDomains", () => {
    vi.stubEnv("NODE_ENV", "production");
    const tenantWithUrls = {
      ...config,
      allowedDomains: ["https://nbenergi.no/", "https://www.nbenergi.no"],
    };
    expect(validateOrigin(tenantWithUrls, "https://nbenergi.no", null).allowed).toBe(true);
    expect(validateOrigin(tenantWithUrls, "https://www.nbenergi.no", null).allowed).toBe(true);
    vi.unstubAllEnvs();
  });
});

describe("getAllTenantsFromDB", () => {
  it("returns hardcoded tenants when DB query fails", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: "DB down" } }),
    });

    const tenants = await getAllTenantsFromDB();

    // Should still return hardcoded tenants
    expect(tenants.length).toBeGreaterThan(0);
    const ids = tenants.map((t) => t.id);
    expect(ids).toContain("baatpleiebutikken");
  });

  it("merges DB tenants with hardcoded tenants", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          { id: "nbenergi", name: "NB Energi" },
          { id: "baatpleiebutikken", name: "Båtpleiebutikken DB" },
        ],
        error: null,
      }),
    });

    const tenants = await getAllTenantsFromDB();

    const ids = tenants.map((t) => t.id);
    expect(ids).toContain("nbenergi");
    expect(ids).toContain("baatpleiebutikken");
    // DB name should override hardcoded name
    const baat = tenants.find((t) => t.id === "baatpleiebutikken");
    expect(baat?.name).toBe("Båtpleiebutikken DB");
  });

  it("returns only hardcoded tenants when DB returns empty", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const tenants = await getAllTenantsFromDB();

    const ids = tenants.map((t) => t.id);
    expect(ids).toContain("baatpleiebutikken");
    expect(ids).toContain("preik-demo");
  });
});
