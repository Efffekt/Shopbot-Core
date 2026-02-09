import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockVerifySuperAdmin, mockFrom, mockCrawl, mockEmbedMany } = vi.hoisted(() => ({
  mockVerifySuperAdmin: vi.fn(),
  mockFrom: vi.fn(),
  mockCrawl: vi.fn(),
  mockEmbedMany: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  verifySuperAdmin: () => mockVerifySuperAdmin(),
}));

vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock("@/lib/firecrawl", () => ({
  firecrawl: { crawl: (...args: unknown[]) => mockCrawl(...args) },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
  RATE_LIMITS: { ingest: { maxRequests: 5, windowMs: 3600000 } },
}));

vi.mock("@/lib/url-safety", () => ({
  isSafeUrl: (url: string) => url.startsWith("https://"),
}));

vi.mock("@/lib/chunking", () => ({
  splitIntoChunks: (text: string) => [text.slice(0, 200)],
}));

vi.mock("ai", () => ({
  embedMany: (...args: unknown[]) => mockEmbedMany(...args),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: { embedding: vi.fn().mockReturnValue("text-embedding-3-small") },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { POST } from "../route";

function makeRequest(body: unknown) {
  return new NextRequest("https://preik.no/api/ingest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ingest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized requests", async () => {
    mockVerifySuperAdmin.mockResolvedValue({
      authorized: false,
      error: "Not authenticated",
    });

    const res = await POST(makeRequest({ url: "https://example.com", storeId: "test" }));
    expect(res.status).toBe(401);
  });

  it("rejects invalid URL", async () => {
    mockVerifySuperAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    const res = await POST(makeRequest({ url: "http://localhost", storeId: "test" }));
    expect(res.status).toBe(400);
  });

  it("rejects missing storeId", async () => {
    mockVerifySuperAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    const res = await POST(makeRequest({ url: "https://example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when crawl fails", async () => {
    mockVerifySuperAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockCrawl.mockResolvedValue({ status: "failed", data: [] });

    const res = await POST(makeRequest({ url: "https://example.com", storeId: "test" }));
    expect(res.status).toBe(500);
  });

  it("succeeds with valid crawl results", async () => {
    mockVerifySuperAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    mockCrawl.mockResolvedValue({
      status: "completed",
      data: [
        {
          markdown: "# Hello World\nThis is content.",
          metadata: { sourceURL: "https://example.com" },
        },
      ],
    });

    mockEmbedMany.mockResolvedValue({
      embeddings: [new Array(1536).fill(0)],
    });

    const res = await POST(makeRequest({ url: "https://example.com", storeId: "test" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagesCount).toBe(1);
    expect(body.chunksCount).toBe(1);
  });
});
