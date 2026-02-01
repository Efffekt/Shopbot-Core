// Chat API - Gemini 3 Flash Preview
import { NextRequest } from "next/server";
import { z } from "zod";
import { embed, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { supabaseAdmin } from "@/lib/supabase";
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
});

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
  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId } = parsed.data;

    // Extract storeId with fallback to default tenant
    const storeId = parsed.data.storeId || DEFAULT_TENANT;

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

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: lastUserText,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
    });

    const embeddingDone = Date.now();
    console.log(`⏱️ Embedding took: ${embeddingDone - start}ms`);

    // Vector search with tenant isolation - CRITICAL for multi-tenancy
    // match_count: 15 gives AI more context to find product URLs
    const { data: relevantDocs, error: searchError } = await supabaseAdmin.rpc(
      "match_site_content",
      {
        query_embedding: embedding,
        match_threshold: 0.35,
        match_count: 15,
        filter_store_id: storeId, // Tenant-isolated vector search
      }
    );

    const dbDone = Date.now();
    console.log(`⏱️ Supabase search took: ${dbDone - embeddingDone}ms (store: ${storeId})`);

    if (searchError) {
      console.error("Search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Search failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const context =
      relevantDocs && relevantDocs.length > 0
        ? relevantDocs
            .map((doc: { content: string; metadata?: { source?: string; url?: string } }) => {
              const url = doc.metadata?.source || doc.metadata?.url || "NO URL AVAILABLE";
              return `--- DOCUMENT START ---\nSOURCE-URL: ${url}\nCONTENT: ${doc.content}\n--- DOCUMENT END ---`;
            })
            .join("\n\n")
        : "";

    const normalizedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractTextFromMessage(m),
    }));

    const aiStart = Date.now();
    console.log(`⏱️ Preparation took: ${aiStart - dbDone}ms`);
    console.log(`⏱️ Total before AI: ${aiStart - start}ms`);

    // Use tenant-specific system prompt (fetches from DB with fallback to hardcoded)
    const systemPrompt = await getTenantSystemPrompt(storeId);

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: context
        ? `${systemPrompt}\n\nCONTEXT FROM DATABASE:\n${context}`
        : systemPrompt,
      messages: normalizedMessages,
      onFinish: async ({ text }) => {
        // Log conversation after streaming completes (fire and forget)
        logConversation({
          storeId,
          sessionId,
          userQuery: lastUserText,
          aiResponse: text,
          metadata: {
            docsFound: relevantDocs?.length || 0,
            timestamp: new Date().toISOString(),
            tenant: tenantConfig.name,
            model: "gemini-3-flash-preview",
          },
        });
      },
    });

    // Safari/Mobile compatible streaming headers - CRITICAL for iOS
    const streamHeaders = {
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
    };

    return result.toUIMessageStreamResponse({
      headers: streamHeaders,
    });
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
