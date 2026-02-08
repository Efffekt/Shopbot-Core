import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Upstash so the module doesn't try to connect
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn(),
}));
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(),
}));

import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/ratelimit";

describe("getClientIdentifier", () => {
  it("prefers sessionId when provided", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4" });
    expect(getClientIdentifier("abc123", headers)).toBe("session:abc123");
  });

  it("falls back to x-forwarded-for when no sessionId", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIdentifier(undefined, headers)).toBe("ip:1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "10.0.0.1" });
    expect(getClientIdentifier(undefined, headers)).toBe("ip:10.0.0.1");
  });

  it("returns unknown when no identifiers", () => {
    const headers = new Headers();
    expect(getClientIdentifier(undefined, headers)).toBe("ip:unknown");
  });
});

describe("checkRateLimit (in-memory fallback)", () => {
  // Ensure no Upstash env vars so it uses in-memory
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows requests under the limit", async () => {
    const config = { maxRequests: 3, windowMs: 60000 };
    const result = await checkRateLimit("test:user1:" + Date.now(), config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests over the limit", async () => {
    const config = { maxRequests: 2, windowMs: 60000 };
    const key = "test:user2:" + Date.now();

    await checkRateLimit(key, config); // 1
    await checkRateLimit(key, config); // 2
    const result = await checkRateLimit(key, config); // 3 — blocked

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks remaining count correctly", async () => {
    const config = { maxRequests: 5, windowMs: 60000 };
    const key = "test:user3:" + Date.now();

    const r1 = await checkRateLimit(key, config);
    expect(r1.remaining).toBe(4);

    const r2 = await checkRateLimit(key, config);
    expect(r2.remaining).toBe(3);
  });
});

describe("RATE_LIMITS", () => {
  it("has expected presets", () => {
    expect(RATE_LIMITS.chat.maxRequests).toBe(30);
    expect(RATE_LIMITS.ingest.maxRequests).toBe(5);
    expect(RATE_LIMITS.scrape.maxRequests).toBe(3);
    expect(RATE_LIMITS.contact.maxRequests).toBe(5);
    expect(RATE_LIMITS.admin.maxRequests).toBe(60);
  });

  it("ingest and scrape have hourly windows", () => {
    expect(RATE_LIMITS.ingest.windowMs).toBe(3600000);
    expect(RATE_LIMITS.scrape.windowMs).toBe(3600000);
  });
});
