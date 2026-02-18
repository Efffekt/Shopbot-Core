import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// === Hoisted mocks ===
const {
  mockFrom,
  mockRpc,
  mockCheckRateLimit,
  mockGetClientIdentifier,
  mockGetClientIp,
  mockCheckAndIncrementCredits,
  mockShouldSendWarningEmail,
  mockSendCreditWarningIfNeeded,
  mockGetTenantConfigFromDB,
  mockGetTenantSystemPrompt,
  mockValidateOrigin,
  mockValidateJsonContentType,
  mockEmbed,
  mockStreamText,
  mockGenerateText,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockGetClientIdentifier: vi.fn(),
  mockGetClientIp: vi.fn(),
  mockCheckAndIncrementCredits: vi.fn(),
  mockShouldSendWarningEmail: vi.fn(),
  mockSendCreditWarningIfNeeded: vi.fn(),
  mockGetTenantConfigFromDB: vi.fn(),
  mockGetTenantSystemPrompt: vi.fn(),
  mockValidateOrigin: vi.fn(),
  mockValidateJsonContentType: vi.fn(),
  mockEmbed: vi.fn(),
  mockStreamText: vi.fn(),
  mockGenerateText: vi.fn(),
}));

// === Module mocks ===
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: { from: mockFrom, rpc: mockRpc },
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  getClientIdentifier: mockGetClientIdentifier,
  getClientIp: mockGetClientIp,
  RATE_LIMITS: {
    chat: { maxRequests: 30, windowMs: 60000 },
    chatIp: { maxRequests: 60, windowMs: 60000 },
  },
}));

vi.mock("@/lib/credits", () => ({
  checkAndIncrementCredits: mockCheckAndIncrementCredits,
  shouldSendWarningEmail: mockShouldSendWarningEmail,
}));

vi.mock("@/lib/email", () => ({
  sendCreditWarningIfNeeded: mockSendCreditWarningIfNeeded,
}));

vi.mock("@/lib/tenants", () => ({
  getTenantConfigFromDB: mockGetTenantConfigFromDB,
  getTenantSystemPrompt: mockGetTenantSystemPrompt,
  validateOrigin: mockValidateOrigin,
}));

vi.mock("@/lib/validate-content-type", () => ({
  validateJsonContentType: mockValidateJsonContentType,
}));

vi.mock("ai", () => ({
  embed: mockEmbed,
  streamText: mockStreamText,
  generateText: mockGenerateText,
}));

vi.mock("@ai-sdk/openai", () => {
  const openaiFn = Object.assign(
    vi.fn((model: string) => ({ modelId: model })),
    { embedding: vi.fn((model: string) => ({ modelId: model, type: "embedding" })) }
  );
  return { openai: openaiFn };
});

vi.mock("@ai-sdk/google-vertex", () => ({
  createVertex: vi.fn(() => vi.fn((model: string) => ({ modelId: model }))),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { POST } from "../route";
import { NextRequest } from "next/server";

// === Helpers ===

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): NextRequest {
  const defaultHeaders: Record<string, string> = {
    "content-type": "application/json",
    origin: "https://baatpleiebutikken.no",
  };
  const merged = { ...defaultHeaders, ...headers };
  const bodyStr = JSON.stringify(body);
  // Only auto-set content-length if not explicitly provided
  if (!headers["content-length"]) {
    merged["content-length"] = String(bodyStr.length);
  }

  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: merged,
    body: bodyStr,
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    messages: [{ role: "user", content: "Hei, hva koster bunnstoff?" }],
    storeId: "baatpleiebutikken",
    sessionId: "test-session-123",
    ...overrides,
  };
}

const MOCK_TENANT_CONFIG = {
  id: "baatpleiebutikken",
  name: "Båtpleiebutikken",
  language: "no" as const,
  persona: "boat care expert",
  systemPrompt: "Du er en båtpleie-ekspert.",
  allowedDomains: ["baatpleiebutikken.no"],
  features: { synonymMapping: false, codeBlockFormatting: false, boatExpertise: true },
};

function setupDefaultMocks() {
  mockValidateJsonContentType.mockReturnValue(null);
  mockGetTenantConfigFromDB.mockResolvedValue(MOCK_TENANT_CONFIG);
  mockValidateOrigin.mockReturnValue({ allowed: true });
  mockCheckRateLimit.mockResolvedValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 });
  mockGetClientIdentifier.mockReturnValue("session:test-session-123");
  mockGetClientIp.mockReturnValue("1.2.3.4");
  mockCheckAndIncrementCredits.mockResolvedValue({
    allowed: true, creditsUsed: 5, creditLimit: 1000, percentUsed: 0.5,
  });
  mockShouldSendWarningEmail.mockReturnValue(null);
  mockSendCreditWarningIfNeeded.mockResolvedValue(undefined);
  mockGetTenantSystemPrompt.mockResolvedValue("Du er en båtpleie-ekspert.");
  mockEmbed.mockResolvedValue({ embedding: new Array(1536).fill(0.1) });
  mockRpc.mockResolvedValue({
    data: [{ content: "Bunnstoff koster 500kr", metadata: { source: "https://baatpleiebutikken.no/bunnstoff" } }],
    error: null,
  });
  // For conversation logging
  mockFrom.mockReturnValue({
    insert: vi.fn().mockResolvedValue({ error: null }),
  });
}

// === Tests ===

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
      private_key: "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----\n",
      client_email: "test@project.iam.gserviceaccount.com",
    });
    process.env.GOOGLE_CLOUD_PROJECT = "test-project";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Request validation ---

  describe("request validation", () => {
    it("rejects requests larger than 32KB", async () => {
      const req = makeRequest(validBody(), {
        "content-length": "40000",
      });

      const res = await POST(req);
      expect(res.status).toBe(413);

      const body = await res.json();
      expect(body.error).toBe("Request too large");
    });

    it("rejects non-JSON content-type", async () => {
      const errorResponse = new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 415 }
      );
      mockValidateJsonContentType.mockReturnValue(errorResponse);

      const req = makeRequest(validBody(), { "content-type": "text/plain" });
      const res = await POST(req);

      expect(res.status).toBe(415);
    });

    it("rejects invalid schema (empty messages array)", async () => {
      const req = makeRequest({ messages: [], storeId: "baatpleiebutikken" });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid request");
    });

    it("rejects missing storeId", async () => {
      const req = makeRequest({ messages: [{ role: "user", content: "hei" }] });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Missing storeId");
    });

    it("rejects unknown storeId", async () => {
      mockGetTenantConfigFromDB.mockResolvedValue(null);

      const req = makeRequest(validBody({ storeId: "nonexistent-store" }));
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Unknown store");
    });

    it("rejects messages without a user message", async () => {
      const req = makeRequest(validBody({
        messages: [{ role: "assistant", content: "hello" }],
      }));
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("No user message found");
    });

    it("rejects storeId with invalid characters", async () => {
      const req = makeRequest(validBody({ storeId: "INVALID_STORE!" }));
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  // --- Origin validation ---

  describe("origin validation", () => {
    it("rejects requests from unauthorized origins", async () => {
      mockValidateOrigin.mockReturnValue({ allowed: false, reason: "Domain not authorized" });

      const req = makeRequest(validBody(), { origin: "https://evil-site.com" });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
    });

    it("does not include CORS headers on rejected origins", async () => {
      mockValidateOrigin.mockReturnValue({ allowed: false, reason: "Domain not authorized" });

      const req = makeRequest(validBody(), { origin: "https://evil-site.com" });
      const res = await POST(req);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  // --- Rate limiting ---

  describe("rate limiting", () => {
    it("returns 429 when session rate limit exceeded", async () => {
      mockCheckRateLimit
        .mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterMs: 30000, resetAt: Date.now() + 30000 })
        .mockResolvedValueOnce({ allowed: true, remaining: 50 });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error).toBe("Too Many Requests");
      expect(res.headers.get("Retry-After")).toBeDefined();
    });

    it("returns 429 when IP rate limit exceeded", async () => {
      mockCheckRateLimit
        .mockResolvedValueOnce({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 })
        .mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterMs: 30000, resetAt: Date.now() + 30000 });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(429);
    });

    it("includes CORS header on rate limit response", async () => {
      mockCheckRateLimit.mockResolvedValue({
        allowed: false, remaining: 0, retryAfterMs: 30000, resetAt: Date.now() + 30000,
      });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://baatpleiebutikken.no");
    });

    it("checks both session and IP rate limits in parallel", async () => {
      const req = makeRequest(validBody());
      await POST(req);

      expect(mockCheckRateLimit).toHaveBeenCalledTimes(2);
      // First call: session-based
      expect(mockCheckRateLimit.mock.calls[0][0]).toContain("chat:");
      // Second call: IP-based
      expect(mockCheckRateLimit.mock.calls[1][0]).toContain("chatIp:");
    });
  });

  // --- Credit system ---

  describe("credit system", () => {
    it("returns friendly message when credits exhausted", async () => {
      mockCheckAndIncrementCredits.mockResolvedValue({
        allowed: false, creditsUsed: 1000, creditLimit: 1000, percentUsed: 100,
      });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.content).toContain("månedlige grense");
      expect(body.role).toBe("assistant");
    });

    it("includes CORS header on credit exhaustion response", async () => {
      mockCheckAndIncrementCredits.mockResolvedValue({
        allowed: false, creditsUsed: 1000, creditLimit: 1000, percentUsed: 100,
      });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://baatpleiebutikken.no");
    });

    it("triggers warning email at 80% threshold", async () => {
      mockShouldSendWarningEmail.mockReturnValue("80");

      const req = makeRequest(validBody({ noStream: true }));
      // Need to mock generateText for non-streaming
      mockGenerateText.mockResolvedValue({ text: "Bunnstoff er bra!" });

      await POST(req);

      expect(mockSendCreditWarningIfNeeded).toHaveBeenCalledWith("baatpleiebutikken", "80");
    });

    it("does not send warning email when below threshold", async () => {
      mockShouldSendWarningEmail.mockReturnValue(null);

      const req = makeRequest(validBody({ noStream: true }));
      mockGenerateText.mockResolvedValue({ text: "Bunnstoff er bra!" });

      await POST(req);

      expect(mockSendCreditWarningIfNeeded).not.toHaveBeenCalled();
    });
  });

  // --- Non-streaming (WebView) mode ---

  describe("non-streaming mode", () => {
    it("returns JSON response when noStream=true", async () => {
      mockGenerateText.mockResolvedValue({ text: "Bunnstoff koster 500kr." });

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.role).toBe("assistant");
      expect(body.content).toBe("Bunnstoff koster 500kr.");
    });

    it("returns JSON response for WebView user agents", async () => {
      mockGenerateText.mockResolvedValue({ text: "Hei!" });

      const req = makeRequest(
        validBody({ messages: [{ role: "user", content: "Hei" }] }),
        { "user-agent": "Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) FBAN/FBIOS" }
      );
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.role).toBe("assistant");
    });

    it("falls back to GPT-4o-mini on Gemini rate limit", async () => {
      const rateLimitError = new Error("429 Resource exhausted");
      mockGenerateText
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ text: "Fallback response" });

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockGenerateText).toHaveBeenCalledTimes(2);
      const body = await res.json();
      expect(body.content).toBe("Fallback response");
    });

    it("throws when all models fail", async () => {
      mockGenerateText
        .mockRejectedValueOnce(new Error("429 rate limit"))
        .mockRejectedValueOnce(new Error("API down"));

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });

    it("includes CORS and rate limit headers", async () => {
      mockGenerateText.mockResolvedValue({ text: "Response" });

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://baatpleiebutikken.no");
      expect(res.headers.get("Vary")).toBe("Origin");
      expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();
    });
  });

  // --- Streaming mode ---

  describe("streaming mode", () => {
    it("returns a streaming response by default", async () => {
      mockStreamText.mockReturnValue({
        textStream: new ReadableStream<string>({
          start(controller) {
            controller.enqueue("Hei!");
            controller.close();
          },
        }),
      });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://baatpleiebutikken.no");
    });

    it("falls back to GPT-4o-mini on Gemini rate limit in streaming mode", async () => {
      mockStreamText
        .mockImplementationOnce(() => { throw new Error("429 Resource exhausted"); })
        .mockReturnValueOnce({
          textStream: new ReadableStream<string>({
            start(controller) {
              controller.enqueue("Fallback");
              controller.close();
            },
          }),
        });

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockStreamText).toHaveBeenCalledTimes(2);
    });
  });

  // --- RAG pipeline ---

  describe("RAG pipeline", () => {
    it("skips embedding for short greetings", async () => {
      mockGenerateText.mockResolvedValue({ text: "Hei! Hvordan kan jeg hjelpe deg?" });

      const req = makeRequest(validBody({
        messages: [{ role: "user", content: "Hei" }],
        noStream: true,
      }));
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockEmbed).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("does not skip embedding for short product queries", async () => {
      mockGenerateText.mockResolvedValue({ text: "Her er prisinfo" });

      const req = makeRequest(validBody({
        messages: [{ role: "user", content: "pris bunnstoff" }],
        noStream: true,
      }));
      await POST(req);

      expect(mockEmbed).toHaveBeenCalled();
    });

    it("performs embedding + vector search for regular queries", async () => {
      mockGenerateText.mockResolvedValue({ text: "Bunnstoff info" });

      const req = makeRequest(validBody({ noStream: true }));
      await POST(req);

      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          value: "Hei, hva koster bunnstoff?",
        })
      );
      expect(mockRpc).toHaveBeenCalledWith("match_site_content", expect.objectContaining({
        match_threshold: 0.5,
        match_count: 12,
        filter_store_id: "baatpleiebutikken",
      }));
    });

    it("fetches system prompt and embedding in parallel", async () => {
      mockGenerateText.mockResolvedValue({ text: "Response" });

      const req = makeRequest(validBody({ noStream: true }));
      await POST(req);

      expect(mockGetTenantSystemPrompt).toHaveBeenCalledWith("baatpleiebutikken");
      expect(mockEmbed).toHaveBeenCalled();
    });

    it("continues without context when vector search fails", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "vector search failed" } });
      mockGenerateText.mockResolvedValue({ text: "Sorry, limited info" });

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("continues when vector search returns empty results", async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      mockGenerateText.mockResolvedValue({ text: "Ingen dokumenter funnet" });

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  // --- Conversation logging ---

  describe("conversation logging", () => {
    it("logs conversation after non-streaming response", async () => {
      mockGenerateText.mockResolvedValue({ text: "AI response" });

      const req = makeRequest(validBody({ noStream: true }));
      await POST(req);

      // Give fire-and-forget a tick to execute
      await new Promise((r) => setTimeout(r, 10));

      expect(mockFrom).toHaveBeenCalledWith("conversations");
    });

    it("does not fail request if logging fails", async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error("DB down")),
      });
      mockGenerateText.mockResolvedValue({ text: "AI response" });

      const req = makeRequest(validBody({ noStream: true }));
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  // --- Error handling ---

  describe("error handling", () => {
    it("returns 500 with generic message on unexpected errors", async () => {
      mockCheckAndIncrementCredits.mockRejectedValue(new Error("Unexpected"));

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Internal server error");
    });

    it("includes CORS header on error responses if origin was validated", async () => {
      // Origin validation passes, then credits throw
      mockCheckAndIncrementCredits.mockRejectedValue(new Error("DB down"));

      const req = makeRequest(validBody());
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://baatpleiebutikken.no");
    });

    it("does not expose error details to client", async () => {
      mockCheckAndIncrementCredits.mockRejectedValue(new Error("Secret DB connection string leaked"));

      const req = makeRequest(validBody());
      const res = await POST(req);

      const body = await res.json();
      expect(body.error).toBe("Internal server error");
      expect(JSON.stringify(body)).not.toContain("Secret");
    });
  });

  // --- WebView detection ---

  describe("WebView detection", () => {
    const webViewAgents = [
      ["Facebook iOS", "Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) FBAN/FBIOS"],
      ["Facebook Android", "Mozilla/5.0 (Linux; Android 13) FBAV/400"],
      ["Instagram", "Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) Instagram"],
      ["Messenger", "Mozilla/5.0 (iPhone; CPU OS 16_0 like Mac OS X) Messenger"],
      ["Android WebView", "Mozilla/5.0 (Linux; Android 13; wv)"],
      ["iOS no Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"],
    ];

    for (const [name, ua] of webViewAgents) {
      it(`uses non-streaming for ${name}`, async () => {
        mockGenerateText.mockResolvedValue({ text: "Response" });

        const req = makeRequest(
          validBody({ messages: [{ role: "user", content: "Hei" }] }),
          { "user-agent": ua }
        );
        await POST(req);

        expect(mockGenerateText).toHaveBeenCalled();
        expect(mockStreamText).not.toHaveBeenCalled();
      });
    }

    it("uses streaming for regular desktop browsers", async () => {
      mockStreamText.mockReturnValue({
        textStream: new ReadableStream<string>({
          start(controller) {
            controller.enqueue("stream");
            controller.close();
          },
        }),
      });

      const req = makeRequest(validBody(), {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36",
      });
      await POST(req);

      expect(mockStreamText).toHaveBeenCalled();
      expect(mockGenerateText).not.toHaveBeenCalled();
    });
  });

  // --- Message extraction ---

  describe("message handling", () => {
    it("extracts text from parts-based messages", async () => {
      mockGenerateText.mockResolvedValue({ text: "Response" });

      const req = makeRequest(validBody({
        messages: [{
          role: "user",
          parts: [{ type: "text", text: "Hva koster bunnstoff?" }],
        }],
        noStream: true,
      }));
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({ value: "Hva koster bunnstoff?" })
      );
    });

    it("uses last user message for embedding", async () => {
      mockGenerateText.mockResolvedValue({ text: "Response" });

      const req = makeRequest(validBody({
        messages: [
          { role: "user", content: "Hei" },
          { role: "assistant", content: "Hei! Hvordan kan jeg hjelpe?" },
          { role: "user", content: "Hva koster Meguiars polering?" },
        ],
        noStream: true,
      }));
      await POST(req);

      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({ value: "Hva koster Meguiars polering?" })
      );
    });
  });
});
