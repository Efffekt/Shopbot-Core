// Chat API - Gemini 2.5 Flash Lite via Vertex AI (global endpoint) with OpenAI fallback
// IMPORTANT: The primary model MUST remain "gemini-2.5-flash-lite". Do not change it.
import { NextRequest } from "next/server";
import { z } from "zod";
import { embed, streamText, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createVertex } from "@ai-sdk/google-vertex";
import { createLogger } from "@/lib/logger";

// Limits
const MAX_BODY_BYTES = 32_000; // ~32KB max request body
const MAX_MESSAGE_LENGTH = 4_000; // per-message text limit
const MAX_MESSAGES = 50; // max conversation history

import { supabaseAdmin } from "@/lib/supabase";

const log = createLogger("api/chat");

// Parse service account credentials - handle escaped newlines in private_key
function getCredentials() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!key) {
    log.error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
    return undefined;
  }

  try {
    const creds = JSON.parse(key);

    // Safety net - ensures newlines are real using split/join method
    if (creds.private_key) {
      creds.private_key = creds.private_key.split(String.raw`\n`).join('\n');
    }

    return creds;
  } catch (e) {
    log.error("Failed to parse service account credentials", { error: e as Error });
    return undefined;
  }
}

// Create Vertex AI client with global endpoint (avoids regional burst limits / 429 errors)
function getVertex() {
  const credentials = getCredentials();

  if (!credentials) {
    log.error("No valid credentials — Vertex AI will fail");
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    log.error("GOOGLE_CLOUD_PROJECT is not set");
  }
  // Use global endpoint to avoid regional burst limits (429 errors)
  const location = "global";

  const vertex = createVertex({
    project: project || "",
    location: location,
    googleAuthOptions: {
      credentials: credentials,
    },
  });

  return vertex;
}

// Startup: verify credentials once
const startupCreds = getCredentials();
log.info("Chat API initialized", { credentialsOk: !!startupCreds });

// Check if error is a rate limit error
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('429') ||
           message.includes('rate limit') ||
           message.includes('resource exhausted') ||
           message.includes('quota');
  }
  return false;
}
import { getTenantConfig, getTenantSystemPrompt, validateOrigin } from "@/lib/tenants";
import { checkRateLimit, getClientIdentifier, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";
import { checkAndIncrementCredits, shouldSendWarningEmail } from "@/lib/credits";
import { sendCreditWarningIfNeeded } from "@/lib/email";

const partSchema = z.object({
  type: z.string(),
  text: z.string().max(MAX_MESSAGE_LENGTH).optional(),
});

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(MAX_MESSAGE_LENGTH).optional(),
  parts: z.array(partSchema).optional(),
  id: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  storeId: z.string().max(100).regex(/^[a-z0-9-]+$/).optional(),
  sessionId: z.string().max(100).optional(),
  noStream: z.boolean().optional(),
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
    log.error("Failed to log conversation", { error: error as Error });
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

// Generate a short request ID for log correlation
function requestId() {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest) {
  const reqId = requestId();
  // Declare outside try so catch block can use the validated origin
  let corsOrigin = "";

  try {
    // === SECURITY: Request size limit ===
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request too large" }),
        { status: 413, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId, noStream } = parsed.data;

    const storeId = parsed.data.storeId;

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "Missing storeId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get tenant-specific configuration — reject unknown tenants
    const tenantConfig = getTenantConfig(storeId);

    if (!tenantConfig) {
      return new Response(
        JSON.stringify({ error: "Unknown store" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Capture request origin for CORS — set after origin validation below
    const requestOrigin = request.headers.get("origin");

    // Use non-streaming for mobile/WebViews, streaming for desktop
    const userAgent = request.headers.get("user-agent");
    const useNonStreaming = noStream === true || isWebView(userAgent);

    // === SECURITY: Domain Validation ===
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const originValidation = validateOrigin(tenantConfig, origin, referer);

    if (!originValidation.allowed) {
      log.warn("Origin blocked", { reqId, storeId, reason: originValidation.reason });
      // No CORS header — browser will block the response for unvalidated origins
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Origin not allowed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Origin validated — safe to reflect in CORS headers
    corsOrigin = requestOrigin || "*";

    // === SECURITY: Rate Limiting ===
    // Two layers: per-session + per-IP (prevents sessionId spoofing bypass)
    const clientId = getClientIdentifier(sessionId, request.headers);
    const clientIp = getClientIp(request.headers);
    const [rateLimit, ipRateLimit] = await Promise.all([
      checkRateLimit(`chat:${storeId}:${clientId}`, RATE_LIMITS.chat),
      checkRateLimit(`chatIp:${storeId}:ip:${clientIp}`, RATE_LIMITS.chatIp),
    ]);

    if (!rateLimit.allowed || !ipRateLimit.allowed) {
      log.warn("Rate limited", { reqId, storeId, clientId, ipBlocked: !ipRateLimit.allowed });
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
            "Access-Control-Allow-Origin": corsOrigin,
            ...(corsOrigin !== "*" && { "Vary": "Origin" }),
          },
        }
      );
    }

    // === CREDIT CHECK ===
    const creditCheck = await checkAndIncrementCredits(storeId);
    if (!creditCheck.allowed) {
      log.warn("Credit limit reached", { reqId, storeId, used: creditCheck.creditsUsed, limit: creditCheck.creditLimit });
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: "Chatboten har nådd sin månedlige grense. Kontakt bedriften direkte for hjelp.",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin,
            ...(corsOrigin !== "*" && { "Vary": "Origin" }),
          },
        }
      );
    }

    // Fire-and-forget credit warning email if threshold crossed
    const warningLevel = shouldSendWarningEmail(creditCheck.creditsUsed, creditCheck.creditLimit);
    if (warningLevel) {
      sendCreditWarningIfNeeded(storeId, warningLevel).catch((err) => {
        log.warn("Failed to send credit warning email", { storeId, error: err as Error });
      });
    }

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

    log.info("Chat request", {
      reqId,
      storeId,
      tenant: tenantConfig.name,
      query: lastUserText.slice(0, 80),
      messageCount: messages.length,
      nonStreaming: useNonStreaming,
      creditsUsed: creditCheck.creditsUsed,
      rateLimitRemaining: rateLimit.remaining,
    });

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

      // Vector search
      const searchStart = Date.now();
      const { data: relevantDocs, error: searchError } = await supabaseAdmin.rpc(
        "match_site_content",
        {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 12,
          filter_store_id: storeId,
        }
      );
      timings.vectorSearch = Date.now() - searchStart;
      docsFound = relevantDocs?.length || 0;

      if (searchError) {
        log.warn("Vector search failed, continuing without context", { reqId, storeId, error: searchError });
        // Continue with system prompt only — don't crash the chat
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

    const aiStart = Date.now();
    // Build context-aware system prompt with anti-hallucination guardrails
    // Language-aware and content-generic — works for any tenant type (store, docs, support)
    const lang = tenantConfig.language;
    const guardrails = lang === "en"
      ? {
          withContext:
            `IMPORTANT RESTRICTION: Below is ALL the information you have access to. ` +
            `You must ONLY reference facts, names, details, and URLs that are explicitly present in the context below. ` +
            `NEVER invent or assume information that is not in the context. ` +
            `If the context does not contain enough information to answer fully, say so honestly.`,
          noContext:
            `CONTEXT FROM DATABASE:\n` +
            `NO RELEVANT DOCUMENTS FOUND. You have NO data available for this query. ` +
            `Do NOT make up information. Be honest that you could not find relevant information.`,
          contextHeader: `CONTEXT FROM DATABASE:`,
        }
      : {
          withContext:
            `VIKTIG RESTRIKSJON: Nedenfor er ALL informasjon du har tilgang til. ` +
            `Du skal KUN referere til fakta, navn, detaljer og URL-er som er eksplisitt nevnt i konteksten nedenfor. ` +
            `ALDRI finn opp eller anta informasjon som ikke finnes i konteksten. ` +
            `Hvis konteksten ikke inneholder nok informasjon til å svare fullstendig, si det ærlig.`,
          noContext:
            `KONTEKST FRA DATABASE:\n` +
            `INGEN RELEVANTE DOKUMENTER FUNNET. Du har INGEN data tilgjengelig for dette spørsmålet. ` +
            `IKKE finn opp informasjon. Si ærlig at du ikke fant relevant informasjon i databasen.`,
          contextHeader: `KONTEKST FRA DATABASE:`,
        };

    let fullSystemPrompt: string;
    if (context) {
      fullSystemPrompt = `${systemPrompt}\n\n${guardrails.withContext}\n\n${guardrails.contextHeader}\n${context}`;
    } else if (!isSimpleMessage) {
      fullSystemPrompt = `${systemPrompt}\n\n${guardrails.noContext}`;
    } else {
      fullSystemPrompt = systemPrompt;
    }

    // Non-streaming mode for WebViews/in-app browsers
    if (useNonStreaming) {
      let modelUsed = "gemini-2.5-flash-lite";
      let result: { text: string } | undefined;

      const vertex = getVertex();
      const geminiModel = vertex("gemini-2.5-flash-lite");
      const openaiModel = openai("gpt-4o-mini");

      const models = [
        { provider: geminiModel, name: "gemini-2.5-flash-lite" },
        { provider: openaiModel, name: "gpt-4o-mini" },
      ];

      for (let i = 0; i < models.length; i++) {
        const { provider, name } = models[i];
        modelUsed = name;

        try {
          result = await generateText({
            model: provider,
            system: fullSystemPrompt,
            messages: normalizedMessages,
            abortSignal: AbortSignal.timeout(15_000),
          });
          if (result.text.length === 0) {
            log.error("Empty AI response", { reqId, storeId, model: name, mode: "non-streaming" });
          }
          break;
        } catch (error) {
          const isLast = i === models.length - 1;
          if (isRateLimitError(error) && !isLast) {
            log.warn("Model rate limited, falling back", { reqId, storeId, from: name, to: models[i + 1].name });
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

      log.info("Request complete", {
        reqId, storeId, model: modelUsed, mode: "non-streaming",
        docsFound, ...timings,
      });

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
            "Access-Control-Allow-Origin": corsOrigin,
            ...(corsOrigin !== "*" && { "Vary": "Origin" }),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          },
        }
      );
    }

    // Streaming mode (default) - Gemini primary, OpenAI fallback
    let modelUsed = "gemini-2.5-flash-lite";

    // Safari/Mobile compatible streaming headers - CRITICAL for iOS
    const streamHeaders: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": corsOrigin,
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
    };
    if (corsOrigin !== "*") {
      streamHeaders["Vary"] = "Origin";
    }

    const vertex = getVertex();
    const geminiModel = vertex("gemini-2.5-flash-lite");
    const openaiModel = openai("gpt-4o-mini");

    const models = [
      { provider: geminiModel, name: "gemini-2.5-flash-lite" },
      { provider: openaiModel, name: "gpt-4o-mini" },
    ];

    for (let i = 0; i < models.length; i++) {
      const { provider, name } = models[i];
      modelUsed = name;

      try {
        const result = streamText({
          model: provider,
          system: fullSystemPrompt,
          messages: normalizedMessages,
          abortSignal: AbortSignal.timeout(15_000),
          onFinish: async ({ text, finishReason, usage }) => {
            timings.aiTotal = Date.now() - aiStart;
            timings.total = Date.now() - start;

            log.info("Request complete", {
              reqId, storeId, model: modelUsed, mode: "streaming",
              docsFound, responseLength: text.length, finishReason,
              ...(usage && { usage }),
              ...timings,
            });

            if (text.length === 0) {
              log.error("Empty AI response", { reqId, storeId, model: modelUsed, finishReason });
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

        return result.toTextStreamResponse({
          headers: streamHeaders,
        });
      } catch (error) {
        const isLast = i === models.length - 1;
        if (isRateLimitError(error) && !isLast) {
          log.warn("Model rate limited, falling back", { reqId, storeId, from: name, to: models[i + 1].name });
          continue;
        }
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error("All retry attempts exhausted");
  } catch (error: unknown) {
    log.error("Chat API error", { reqId, error: error as Error });

    // Log full error server-side but never expose details to client
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log.error("Chat API unhandled error detail", { reqId, errorMessage });

    // Only include CORS header if origin was validated earlier
    const errorHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (corsOrigin) {
      errorHeaders["Access-Control-Allow-Origin"] = corsOrigin;
      if (corsOrigin !== "*") errorHeaders["Vary"] = "Origin";
    }

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: errorHeaders }
    );
  }
}
