import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firecrawl as a class constructor
vi.mock("@mendable/firecrawl-js", () => ({
  default: class MockFirecrawl {
    apiKey: string;
    constructor(opts: { apiKey: string }) {
      this.apiKey = opts.apiKey;
    }
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("firecrawl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("exports null when FIRECRAWL_API_KEY is not set", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "");

    const { firecrawl } = await import("@/lib/firecrawl");
    expect(firecrawl).toBeNull();
  });

  it("creates Firecrawl instance when API key is set", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test-key");

    const { firecrawl } = await import("@/lib/firecrawl");
    expect(firecrawl).not.toBeNull();
    expect((firecrawl as unknown as { apiKey: string }).apiKey).toBe("fc-test-key");
  });
});
