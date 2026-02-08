import { describe, it, expect, vi } from "vitest";

// Mock supabase before importing tenants
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({}) }) }) }),
  },
}));

import { getTenantConfig, validateOrigin, TENANT_CONFIGS, DEFAULT_TENANT } from "../tenants";

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
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = validateOrigin(config, null, null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Missing origin");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("rejects unauthorized domain in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = validateOrigin(config, "https://evil.com", null);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("not authorized");
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("allows authorized domain in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = validateOrigin(config, "https://baatpleiebutikken.no", null);
      expect(result.allowed).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("allows subdomain matching in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = validateOrigin(config, "https://www.baatpleiebutikken.no", null);
      expect(result.allowed).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("allows all origins in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const result = validateOrigin(config, "https://anything.com", null);
      expect(result.allowed).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("falls back to referer when origin is null", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = validateOrigin(config, null, "https://baatpleiebutikken.no/page");
      expect(result.allowed).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
