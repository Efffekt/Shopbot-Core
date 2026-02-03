// Chat API - Gemini 2.0 Flash via Vertex AI (global endpoint) with OpenAI fallback
import { NextRequest } from "next/server";
import { z } from "zod";
import { embed, streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createVertex } from "@ai-sdk/google-vertex";

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;
import { supabaseAdmin } from "@/lib/supabase";

// Parse service account credentials - handle escaped newlines in private_key
function getCredentials() {
  console.log("🔑 [getCredentials] Starting credential parse...");
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!key) {
    console.error("❌ [getCredentials] GOOGLE_SERVICE_ACCOUNT_KEY is not set!");
    return undefined;
  }

  console.log(`🔑 [getCredentials] Key length: ${key.length}, starts with: ${key.slice(0, 50)}...`);

  try {
    // Parse the JSON
    console.log("🔑 [getCredentials] Parsing JSON...");
    const creds = JSON.parse(key);

    // Safety net - ensures newlines are real using split/join method
    if (creds.private_key) {
      const originalKey = creds.private_key;
      creds.private_key = creds.private_key.split(String.raw`\n`).join('\n');
      console.log(`🔑 [getCredentials] Private key newline fix applied`);
      console.log(`🔑 [getCredentials] Private key starts with: ${creds.private_key.slice(0, 50)}`);
      console.log(`🔑 [getCredentials] Private key ends with: ${creds.private_key.slice(-50)}`);
      console.log(`🔑 [getCredentials] Contains actual newlines: ${creds.private_key.includes('\n')}`);
      console.log(`🔑 [getCredentials] Newline count: ${(creds.private_key.match(/\n/g) || []).length}`);
    }

    console.log("✅ [getCredentials] Parse SUCCESS:", {
      type: creds.type,
      project_id: creds.project_id,
      client_email: creds.client_email,
      private_key_length: creds.private_key?.length || 0,
    });
    return creds;
  } catch (e) {
    console.error("❌ [getCredentials] Parse FAILED:", (e as Error).message);
    console.error("❌ [getCredentials] Key preview (first 200 chars):", key.slice(0, 200));
    return undefined;
  }
}

// Create Vertex AI client with global endpoint (avoids regional burst limits / 429 errors)
function getVertex() {
  console.log("🏗️ [getVertex] Creating Vertex AI client...");
  const credentials = getCredentials();

  if (!credentials) {
    console.error("❌ [getVertex] No valid credentials! Vertex AI WILL FAIL!");
    console.error("❌ [getVertex] Will fall back to metadata service which will timeout on Vercel!");
  } else {
    console.log("✅ [getVertex] Got credentials for:", credentials.client_email);
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  // Use global endpoint to avoid regional burst limits (429 errors)
  const location = "global";
  console.log(`🏗️ [getVertex] Project: ${project}, Location: ${location}`);

  const vertex = createVertex({
    project: project!,
    location: location,
    googleAuthOptions: {
      credentials: credentials,
    },
  });

  console.log("✅ [getVertex] Vertex AI client created");
  return vertex;
}

// Startup logging
console.log("========================================");
console.log("🔧 [STARTUP] Chat API initializing...");
console.log("🔧 [STARTUP] GOOGLE_CLOUD_PROJECT:", process.env.GOOGLE_CLOUD_PROJECT);
console.log("🔧 [STARTUP] GOOGLE_SERVICE_ACCOUNT_KEY set:", !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
console.log("🔧 [STARTUP] GOOGLE_SERVICE_ACCOUNT_KEY length:", process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0);
console.log("🔧 [STARTUP] Testing credential parse at startup...");
const startupCreds = getCredentials();
console.log("🔧 [STARTUP] Startup credential test:", startupCreds ? "SUCCESS" : "FAILED");
console.log("========================================");

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is a rate limit error
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const isRateLimit = message.includes('429') ||
           message.includes('rate limit') ||
           message.includes('resource exhausted') ||
           message.includes('quota');

    if (isRateLimit) {
      console.warn(`🚦 Rate limit detected: ${error.message}`);
    }
    return isRateLimit;
  }
  return false;
}
import { getTenantConfig, getTenantSystemPrompt, validateOrigin, DEFAULT_TENANT } from "@/lib/tenants";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/ratelimit";

const partSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().optional(),
  parts: z.array(partSchema).optional(),
  id: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1),
  storeId: z.string().optional(),
  sessionId: z.string().optional(),
  noStream: z.boolean().optional(), // For WebViews/in-app browsers that don't support streaming
});

// Detect WebView/in-app browsers that don't support streaming
function isWebView(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return (
    ua.includes('fban') || // Facebook
    ua.includes('fbav') || // Facebook
    ua.includes('instagram') ||
    ua.includes('messenger') ||
    ua.includes('webview') ||
    ua.includes('wv)') || // Android WebView
    (ua.includes('iphone') && !ua.includes('safari')) || // iOS WebView (no Safari = WebView)
    (ua.includes('ipad') && !ua.includes('safari'))
  );
}

// Patterns that indicate the AI couldn't fully answer
const UNHANDLED_PATTERNS = [
  "jeg fant ikke",
  "jeg vet ikke",
  "har ikke informasjon",
  "finner ikke",
  "ikke tilgjengelig",
  "kan ikke finne",
  "mangler informasjon",
  "couldn't find",
  "could not find",
  "don't have information",
  "no information about",
];

// Detect intent from user query
function detectIntent(query: string): "product_query" | "support" | "general" | "unknown" {
  const q = query.toLowerCase();

  // Support patterns
  if (
    q.includes("reklam") ||
    q.includes("retur") ||
    q.includes("bytte") ||
    q.includes("klage") ||
    q.includes("kontakt") ||
    q.includes("snakke med") ||
    q.includes("menneske") ||
    q.includes("hjelp") ||
    q.includes("support") ||
    q.includes("help")
  ) {
    return "support";
  }

  // Product query patterns
  if (
    q.includes("pris") ||
    q.includes("koster") ||
    q.includes("kjøp") ||
    q.includes("produkt") ||
    q.includes("voks") ||
    q.includes("polish") ||
    q.includes("båtløft") ||
    q.includes("rengjør") ||
    q.includes("anbefal") ||
    q.includes("price") ||
    q.includes("product") ||
    q.includes("buy") ||
    q.includes("recommend")
  ) {
    return "product_query";
  }

  // General questions
  if (
    q.includes("hvordan") ||
    q.includes("hva er") ||
    q.includes("kan jeg") ||
    q.includes("how") ||
    q.includes("what is") ||
    q.includes("where")
  ) {
    return "general";
  }

  return "unknown";
}

// Check if response indicates an unhandled query
function checkIfHandled(response: string): boolean {
  const lower = response.toLowerCase();
  return !UNHANDLED_PATTERNS.some((pattern) => lower.includes(pattern));
}

// Check if response referred to email
function checkEmailReferral(response: string): boolean {
  return response.toLowerCase().includes("post@vbaat.no") ||
         response.toLowerCase().includes("email") ||
         response.toLowerCase().includes("e-post");
}

// Log conversation to database (fire and forget)
async function logConversation(data: {
  storeId: string;
  sessionId?: string;
  userQuery: string;
  aiResponse: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const intent = detectIntent(data.userQuery);
    const wasHandled = checkIfHandled(data.aiResponse);
    const referredToEmail = checkEmailReferral(data.aiResponse);

    await supabaseAdmin.from("conversations").insert({
      store_id: data.storeId,
      session_id: data.sessionId || null,
      user_query: data.userQuery,
      ai_response: data.aiResponse,
      detected_intent: intent,
      was_handled: wasHandled,
      referred_to_email: referredToEmail,
      metadata: data.metadata || {},
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error("Failed to log conversation:", error);
  }
}

type Message = z.infer<typeof messageSchema>;

function extractTextFromMessage(message: Message): string {
  if (message.parts && message.parts.length > 0) {
    return message.parts
      .filter((part) => part.type === "text" && part.text)
      .map((part) => part.text!)
      .join("");
  }
  return message.content || "";
}

export async function POST(request: NextRequest) {
  console.log("\n\n========== NEW REQUEST ==========");
  console.log("⏰ [POST] Request received at:", new Date().toISOString());

  try {
    const body = await request.json();
    console.log("📥 [POST] Body parsed, storeId:", body.storeId);
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId, noStream } = parsed.data;

    // Extract storeId with fallback to default tenant
    const storeId = parsed.data.storeId || DEFAULT_TENANT;

    // Use non-streaming for mobile/WebViews, streaming for desktop
    const userAgent = request.headers.get("user-agent");
    const useNonStreaming = noStream === true || isWebView(userAgent);
    console.log(`📱 [${storeId}] noStream=${noStream}, useNonStreaming=${useNonStreaming}`);

    // Get tenant-specific configuration
    const tenantConfig = getTenantConfig(storeId);

    // === SECURITY: Domain Validation ===
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const originValidation = validateOrigin(tenantConfig, origin, referer);

    if (!originValidation.allowed) {
      console.warn(`🚫 Origin blocked: ${originValidation.reason}`);
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Origin not allowed" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // === SECURITY: Rate Limiting ===
    const clientId = getClientIdentifier(sessionId, request.headers);
    const rateLimitKey = `chat:${storeId}:${clientId}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.chat);

    if (!rateLimit.allowed) {
      console.warn(`🚫 Rate limited: ${clientId} for tenant ${storeId}`);
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Please wait before sending more messages",
          retryAfterMs: rateLimit.retryAfterMs,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimit.retryAfterMs || 60000) / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt),
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`🏪 Chat request for tenant: ${storeId} (${tenantConfig.name}) [${rateLimit.remaining} remaining]`);

    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const lastUserText = extractTextFromMessage(lastUserMessage);

    // Performance timing
    const start = Date.now();
    const timings: Record<string, number> = {};

    console.log(`\n📨 [${storeId}] New request: "${lastUserText.slice(0, 50)}${lastUserText.length > 50 ? '...' : ''}"`);

    // Fast path: skip embedding/search for very short messages (greetings, etc)
    const isSimpleMessage = lastUserText.length < 20 && !/produkt|pris|anbefal|kjøp|voks|polish|båt/i.test(lastUserText);

    const normalizedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractTextFromMessage(m),
    }));

    let context = "";
    let systemPrompt: string;
    let docsFound = 0;

    if (isSimpleMessage) {
      // Fast path - just get system prompt, skip embedding/search
      systemPrompt = await getTenantSystemPrompt(storeId);
      timings.promptFetch = Date.now() - start;
      console.log(`⚡ [${storeId}] FAST PATH - prompt: ${timings.promptFetch}ms`);
    } else {
      // Full path - embedding + search + prompt in parallel where possible
      const embeddingStart = Date.now();
      const [embeddingResult, promptResult] = await Promise.all([
        embed({
          model: openai.embedding("text-embedding-3-small"),
          value: lastUserText,
          providerOptions: {
            openai: { dimensions: 1536 },
          },
        }),
        getTenantSystemPrompt(storeId),
      ]);

      systemPrompt = promptResult;
      const { embedding } = embeddingResult;
      timings.embedding = Date.now() - embeddingStart;
      console.log(`⏱️ [${storeId}] Embedding + prompt: ${timings.embedding}ms`);

      // Vector search
      const searchStart = Date.now();
      const { data: relevantDocs, error: searchError } = await supabaseAdmin.rpc(
        "match_site_content",
        {
          query_embedding: embedding,
          match_threshold: 0.4,
          match_count: 8,
          filter_store_id: storeId,
        }
      );
      timings.vectorSearch = Date.now() - searchStart;
      docsFound = relevantDocs?.length || 0;
      console.log(`⏱️ [${storeId}] Vector search: ${timings.vectorSearch}ms (${docsFound} docs)`);

      if (searchError) {
        console.error("Search error:", searchError);
        return new Response(
          JSON.stringify({ error: "Search failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (relevantDocs && relevantDocs.length > 0) {
        context = relevantDocs
          .map((doc: { content: string; metadata?: { source?: string; url?: string } }) => {
            const url = doc.metadata?.source || doc.metadata?.url || "NO URL AVAILABLE";
            return `--- DOCUMENT START ---\nSOURCE-URL: ${url}\nCONTENT: ${doc.content}\n--- DOCUMENT END ---`;
          })
          .join("\n\n");
      }
    }

    timings.preAI = Date.now() - start;
    console.log(`⏱️ [${storeId}] Total pre-AI: ${timings.preAI}ms${useNonStreaming ? ' (non-streaming mode)' : ''}`);

    const aiStart = Date.now();
    const fullSystemPrompt = context
      ? `${systemPrompt}\n\nCONTEXT FROM DATABASE:\n${context}`
      : systemPrompt;

    // Non-streaming mode for WebViews/in-app browsers
    if (useNonStreaming) {
      let modelUsed = "gemini-2.5-flash-lite";
      let result: { text: string } | undefined;

      // Gemini via Vertex AI (global), OpenAI fallback on rate limit
      console.log(`🏗️ [${storeId}] Creating Vertex AI client for non-streaming...`);
      const vertex = getVertex();
      console.log(`🏗️ [${storeId}] Creating model instances (non-streaming)...`);
      const geminiModel = vertex("gemini-2.5-flash-lite");
      const openaiModel = openai("gpt-4o-mini");
      console.log(`✅ [${storeId}] Model instances created (non-streaming)`);

      const models = [
        { provider: geminiModel, name: "gemini-2.5-flash-lite" },
        { provider: openaiModel, name: "gpt-4o-mini" },
      ];

      for (let i = 0; i < models.length; i++) {
        const { provider, name } = models[i];
        modelUsed = name;

        try {
          console.log(`\n🚀 [${storeId}] ====== TRYING ${name} (non-streaming) ======`);
          console.log(`📝 [${storeId}] System prompt length: ${fullSystemPrompt.length} chars`);
          console.log(`📝 [${storeId}] Messages count: ${normalizedMessages.length}`);
          result = await generateText({
            model: provider,
            system: fullSystemPrompt,
            messages: normalizedMessages,
          });
          console.log(`✅ [${storeId}] Got response: ${result.text.length} chars`);
          console.log(`📄 [${storeId}] Response preview: "${result.text.slice(0, 200)}..."`);
          if (result.text.length === 0) {
            console.error(`❌ [${storeId}] EMPTY RESPONSE in non-streaming mode!`);
          }
          break;
        } catch (error) {
          console.error(`❌ [${storeId}] Error (non-streaming):`, error);
          const isLast = i === models.length - 1;
          if (isRateLimitError(error) && !isLast) {
            console.log(`⚠️ [${storeId}] ${name} rate limited, trying ${models[i + 1].name}...`);
            continue;
          }
          throw error;
        }
      }

      if (!result) {
        throw new Error("Failed to generate response");
      }

      timings.aiTotal = Date.now() - aiStart;
      timings.total = Date.now() - start;
      console.log(`✅ [${storeId}] AI response (non-streaming, ${modelUsed}): ${timings.aiTotal}ms | TOTAL: ${timings.total}ms`);

      // Log conversation
      logConversation({
        storeId,
        sessionId,
        userQuery: lastUserText,
        aiResponse: result!.text,
        metadata: {
          docsFound,
          timestamp: new Date().toISOString(),
          tenant: tenantConfig.name,
          model: modelUsed,
          timings,
          nonStreaming: true,
        },
      });

      // Return JSON response for non-streaming clients
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: result!.text,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          },
        }
      );
    }

    // Streaming mode (default) - Gemini primary, OpenAI fallback
    let modelUsed = "gemini-2.5-flash-lite";

    // Safari/Mobile compatible streaming headers - CRITICAL for iOS
    const streamHeaders = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
    };

    // Gemini via Vertex AI (global), OpenAI fallback on rate limit
    console.log(`🏗️ [${storeId}] Creating Vertex AI client for streaming...`);
    const vertex = getVertex();
    console.log(`🏗️ [${storeId}] Creating model instances...`);
    const geminiModel = vertex("gemini-2.5-flash-lite");
    const openaiModel = openai("gpt-4o-mini");
    console.log(`✅ [${storeId}] Model instances created`);

    const models = [
      { provider: geminiModel, name: "gemini-2.5-flash-lite" },
      { provider: openaiModel, name: "gpt-4o-mini" },
    ];

    for (let i = 0; i < models.length; i++) {
      const { provider, name } = models[i];
      modelUsed = name;

      try {
        console.log(`\n🚀 [${storeId}] ====== TRYING ${name} ======`);
        console.log(`📝 [${storeId}] System prompt: ${fullSystemPrompt.length} chars`);
        console.log(`📝 [${storeId}] Messages: ${normalizedMessages.length}`);
        console.log(`📝 [${storeId}] First message role: ${normalizedMessages[0]?.role}`);
        console.log(`📝 [${storeId}] Last message: "${normalizedMessages[normalizedMessages.length - 1]?.content?.slice(0, 100)}..."`);

        const result = streamText({
          model: provider,
          system: fullSystemPrompt,
          messages: normalizedMessages,
          onChunk: ({ chunk }) => {
            if (chunk.type === 'text-delta') {
              console.log(`📦 [${storeId}] Chunk: "${chunk.text.slice(0, 50)}..."`);
            }
          },
          onFinish: async ({ text, finishReason, usage }) => {
            timings.aiTotal = Date.now() - aiStart;
            timings.total = Date.now() - start;
            console.log(`✅ [${storeId}] ${modelUsed}: ${timings.aiTotal}ms | ${text.length} chars | ${finishReason}`);
            console.log(`📄 [${storeId}] Response: "${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"`);
            if (usage) {
              console.log(`📊 [${storeId}] Usage: ${JSON.stringify(usage)}`);
            }
            if (text.length === 0) {
              console.error(`❌ [${storeId}] EMPTY RESPONSE! finishReason: ${finishReason}, usage: ${JSON.stringify(usage)}`);
            }

            // Log conversation (fire and forget)
            logConversation({
              storeId,
              sessionId,
              userQuery: lastUserText,
              aiResponse: text,
              metadata: {
                docsFound,
                timestamp: new Date().toISOString(),
                tenant: tenantConfig.name,
                model: modelUsed,
                timings,
                finishReason,
              },
            });
          },
        });

        console.log(`🔄 [${storeId}] streamText() called, preparing response...`);
        console.log(`🔄 [${storeId}] Converting to text stream response...`);
        const response = result.toTextStreamResponse({
          headers: streamHeaders,
        });
        console.log(`✅ [${storeId}] Returning stream response to client!`);
        console.log(`✅ [${storeId}] Response status: ${response.status}`);
        console.log(`✅ [${storeId}] Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
        return response;
      } catch (error) {
        console.error(`❌ [${storeId}] Error with ${name}:`, error);
        console.error(`❌ [${storeId}] Error type: ${(error as Error).constructor.name}`);
        console.error(`❌ [${storeId}] Error message: ${(error as Error).message}`);
        console.error(`❌ [${storeId}] Error stack: ${(error as Error).stack}`);

        const isLast = i === models.length - 1;
        if (isRateLimitError(error) && !isLast) {
          console.log(`⚠️ [${storeId}] ${name} rate limited, trying ${models[i + 1].name}...`);
          continue;
        }
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error("All retry attempts exhausted");
  } catch (error: unknown) {
    // Log full error for Vercel Logs debugging
    console.error("❌ Chat API Error:", error);
    console.error("❌ Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      }
    );
  }
}
// 1769953427
