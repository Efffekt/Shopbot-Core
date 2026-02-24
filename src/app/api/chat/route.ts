// Chat API - Gemini 2.5 Flash Lite via Vertex AI (global endpoint) with OpenAI fallback
// Primary model: gemini-2.5-flash-lite
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
import { getTenantConfigFromDB, getTenantSystemPrompt, validateOrigin } from "@/lib/tenants";
import { getGuardrails } from "@/lib/guardrails";
import { checkRateLimit, getClientIdentifier, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";
import { checkAndIncrementCredits, shouldSendWarningEmail } from "@/lib/credits";
import { sendCreditWarningIfNeeded } from "@/lib/email";
import { validateJsonContentType } from "@/lib/validate-content-type";

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

const ALLOWED_TEST_MODELS = [
  "gpt-4o-mini",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gpt-4.1-nano",
  "gpt-4.1-mini",
  "gpt-5-mini",
] as const;

function isOpenAIModel(modelId: string): boolean {
  return modelId.startsWith("gpt-");
}

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  storeId: z.string().max(100).regex(/^[a-z0-9-]+$/).optional(),
  sessionId: z.string().max(100).optional(),
  noStream: z.boolean().optional(),
  testModel: z.enum(ALLOWED_TEST_MODELS).optional(),
});

// --- URL sanitization: replace hallucinated URLs with search fallbacks ---

/** Strip www. prefix from a URL for comparison */
function normalizeUrl(url: string): string {
  return url.replace(/^(https?:\/\/)www\./, "$1");
}

/** Check if a URL is in the allowlist (handles www/non-www, trailing slash, query params, search URLs) */
function isUrlAllowed(url: string, allowedUrls: Set<string>): boolean {
  if (allowedUrls.size === 0) return true; // No allowlist = no filtering
  // Compare both with and without query params
  const normalized = normalizeUrl(url);
  const normalizedStripped = normalizeUrl(stripTrackingParams(url));
  for (const allowed of allowedUrls) {
    const normalizedAllowed = normalizeUrl(allowed);
    // Exact match or match ignoring trailing slash
    for (const candidate of [normalized, normalizedStripped]) {
      if (candidate === normalizedAllowed) return true;
      const a = candidate.endsWith("/") ? candidate.slice(0, -1) : candidate;
      const b = normalizedAllowed.endsWith("/") ? normalizedAllowed.slice(0, -1) : normalizedAllowed;
      if (a === b) return true;
    }
  }
  // Allow search URLs (the AI's sanctioned fallback pattern)
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/search" && parsed.searchParams.has("q")) return true;
  } catch { /* invalid URL — not allowed */ }
  return false;
}

/** Build a keyword search fallback URL from a hallucinated URL */
function buildSearchFallback(url: string, baseDomain: string): string {
  // Strip query params, extract last path segment, split into words
  const urlWithoutParams = url.replace(/[?#].*$/, "").replace(/[.,;:!?)]+$/, "");
  const segments = urlWithoutParams.split("/").filter(Boolean);
  const slug = segments[segments.length - 1] || "";
  const words = slug.split("-").filter(Boolean);

  // Filter out noise: numbers, sizes, stopwords, and very short words
  const noise = new Set(["til", "med", "og", "for", "fra", "den", "det", "en", "et", "av", "som", "per", "stk", "sett", "pakke", "bat", "test", "nye", "kun", "var", "din", "vare", "alle", "best", "type"]);
  const keywords = words.filter((w) => {
    if (/\d/.test(w)) return false;       // contains digits (sizes, quantities)
    if (w.length <= 3) return false;       // too short to be meaningful
    if (noise.has(w.toLowerCase())) return false;
    return true;
  });

  // Pick the longest keyword — product type words are long, noise words are short
  const longest = keywords.sort((a, b) => b.length - a.length)[0] || "";
  const query = longest;
  return `${baseDomain}/search?q=${encodeURIComponent(query || slug)}`;
}

/** Strip tracking/internal query params from a URL, keeping only the clean path */
function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    // Keep meaningful params (variant, id) but strip tracking/search params
    const trackingPrefixes = ["utm_", "_pos", "_psq", "_ss", "_v", "fbclid", "gclid", "ref", "mc_"];
    const keysToRemove: string[] = [];
    parsed.searchParams.forEach((_val, key) => {
      if (trackingPrefixes.some((p) => key.startsWith(p) || key === p)) {
        keysToRemove.push(key);
      }
    });
    for (const key of keysToRemove) {
      parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Extract the base domain (without www.) from the allowlist, plus both www/non-www variants */
function extractDomainVariants(allowedUrls: Set<string>): { baseDomain: string; patterns: string[] } | null {
  const first = [...allowedUrls][0];
  if (!first) return null;
  const match = first.match(/^https?:\/\/[^/]+/);
  if (!match) return null;
  const baseDomain = normalizeUrl(match[0]); // without www.
  const host = baseDomain.replace(/^https?:\/\//, "");
  return {
    baseDomain,
    patterns: [
      `https://${host}`,
      `https://www.${host}`,
      `http://${host}`,
      `http://www.${host}`,
    ],
  };
}

/** Replace hallucinated URLs in text — both markdown links and bare URLs */
function sanitizeResponseUrls(text: string, allowedUrls: Set<string>): string {
  if (allowedUrls.size === 0) return text;
  const domainInfo = extractDomainVariants(allowedUrls);
  if (!domainInfo) return text;
  const { baseDomain } = domainInfo;

  // Pass 1: Sanitize markdown links [text](url)
  let result = text.replace(/\]\((https?:\/\/[^)]+)\)/g, (match, url: string) => {
    if (isUrlAllowed(url, allowedUrls)) return match;
    return `](${buildSearchFallback(url, baseDomain)})`;
  });

  // Pass 2: Sanitize bare URLs on any variant of the domain (www/non-www)
  const escapedPatterns = domainInfo.patterns
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const bareUrlRegex = new RegExp(
    `(?<!\\]\\()(?<!\\()(?:${escapedPatterns})\\/[^\\s)\\]>]*`,
    "g"
  );
  result = result.replace(bareUrlRegex, (match) => {
    const cleaned = match.replace(/[.,;:!?]+$/, "");
    if (isUrlAllowed(cleaned, allowedUrls)) return match;
    return buildSearchFallback(cleaned, baseDomain);
  });

  return result;
}

/** TransformStream that sanitizes URLs in streamed text, buffering around links and bare URLs */
function createUrlSanitizerTransform(allowedUrls: Set<string>): TransformStream<string, string> {
  if (allowedUrls.size === 0) return new TransformStream();

  let buffer = "";

  /** Find the earliest incomplete URL or markdown link at the tail of the buffer.
   *  Returns the index to split at, or -1 if everything is safe to flush. */
  function findBufferSplitPoint(buf: string): number {
    // Check for incomplete markdown link: last `[` without a closing `)`
    const lastBracket = buf.lastIndexOf("[");
    if (lastBracket !== -1) {
      const afterBracket = buf.substring(lastBracket);
      if (!afterBracket.match(/^\[[^\]]*\]\([^)]*\)/)) {
        return lastBracket;
      }
    }

    // Check for incomplete bare URL: "http" at the tail without trailing whitespace
    const lastHttp = buf.lastIndexOf("http");
    if (lastHttp !== -1) {
      const afterHttp = buf.substring(lastHttp);
      if (!/\s/.test(afterHttp)) {
        return lastHttp;
      }
    }

    return -1; // everything is complete
  }

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;

      const splitAt = findBufferSplitPoint(buffer);

      if (splitAt === -1) {
        // No potential incomplete URLs — flush entire buffer
        controller.enqueue(sanitizeResponseUrls(buffer, allowedUrls));
        buffer = "";
      } else if (splitAt > 0) {
        // Flush the safe prefix, keep the rest buffered
        controller.enqueue(sanitizeResponseUrls(buffer.substring(0, splitAt), allowedUrls));
        buffer = buffer.substring(splitAt);
      }
      // else: entire buffer is a potential incomplete URL, keep buffering
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(sanitizeResponseUrls(buffer, allowedUrls));
        buffer = "";
      }
    },
  });
}

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

    const contentTypeError = validateJsonContentType(request);
    if (contentTypeError) return contentTypeError;

    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, sessionId, noStream, testModel } = parsed.data;

    const storeId = parsed.data.storeId;

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: "Missing storeId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get tenant-specific configuration — reject unknown tenants
    const tenantConfig = await getTenantConfigFromDB(storeId);

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
    // But only if the conversation doesn't have product-related context from earlier messages
    const productKeywords = /produkt|pris|anbefal|kjøp|voks|polish|poler|båt|maskin|pad|pute|ullp|rengjør|vask|bunn|forseg/i;
    const hasProductContext = messages.some((m) => productKeywords.test(typeof m.content === "string" ? m.content : JSON.stringify(m.content)));
    const isSimpleMessage = lastUserText.length < 20 && !productKeywords.test(lastUserText) && !hasProductContext;
    console.log(`[CHAT DEBUG] reqId=${reqId} query="${lastUserText.slice(0, 120)}" length=${lastUserText.length} isSimpleMessage=${isSimpleMessage}`);

    const normalizedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractTextFromMessage(m),
    }));

    let context = "";
    let availableUrls: string[] = [];
    let systemPrompt: string;
    let docsFound = 0;

    if (isSimpleMessage) {
      // Fast path - just get system prompt, skip embedding/search
      systemPrompt = await getTenantSystemPrompt(storeId);
      timings.promptFetch = Date.now() - start;
    } else {
      // Full path - embedding + search + prompt in parallel where possible

      // Build embedding query: enrich short follow-ups with conversation context
      // e.g. "den er roterende" (16 chars) becomes "polleringspute som passer til ryobi den er roterende"
      let embeddingQuery = lastUserText;
      if (lastUserText.length < 60 && messages.length >= 3) {
        const userMessages = messages.filter((m) => m.role === "user");
        if (userMessages.length >= 2) {
          const prevUserText = extractTextFromMessage(userMessages[userMessages.length - 2]);
          embeddingQuery = `${prevUserText} ${lastUserText}`.slice(0, 500);
        }
      }
      console.log(`[CHAT DEBUG] reqId=${reqId} embeddingQuery="${embeddingQuery.slice(0, 120)}" (enriched=${embeddingQuery !== lastUserText})`);

      const embeddingStart = Date.now();
      const [embeddingResult, promptResult] = await Promise.all([
        embed({
          model: openai.embedding("text-embedding-3-small"),
          value: embeddingQuery,
          providerOptions: {
            openai: { dimensions: 1536 },
          },
        }),
        getTenantSystemPrompt(storeId),
      ]);

      systemPrompt = promptResult;
      const { embedding } = embeddingResult;
      timings.embedding = Date.now() - embeddingStart;
      console.log(`[CHAT DEBUG] reqId=${reqId} embedding generated in ${timings.embedding}ms for storeId=${storeId} dims=${embedding.length} type=${typeof embedding[0]} first3=[${embedding.slice(0, 3).map(v => v.toFixed(6)).join(",")}]`);

      // Debug: test RPC with a known embedding from the table itself
      try {
        const { data: knownDoc, error: knownErr } = await supabaseAdmin
          .from("documents")
          .select("id, content, embedding")
          .eq("store_id", storeId)
          .limit(1)
          .single();
        if (knownErr) {
          console.log(`[CHAT DEBUG] reqId=${reqId} KNOWN DOC ERROR: ${JSON.stringify(knownErr)}`);
        } else {
          const knownEmb = knownDoc.embedding;
          console.log(`[CHAT DEBUG] reqId=${reqId} KNOWN DOC: id=${knownDoc.id} embType=${typeof knownEmb} isArray=${Array.isArray(knownEmb)} length=${Array.isArray(knownEmb) ? knownEmb.length : "N/A"} sample=${JSON.stringify(knownEmb)?.slice(0, 80)}`);

          // Pass the DB embedding back through the RPC — should find itself
          const { data: selfMatch, error: selfErr } = await supabaseAdmin.rpc("match_site_content", {
            query_embedding: knownEmb,
            match_threshold: 0.0,
            match_count: 1,
            filter_store_id: storeId,
          });
          console.log(`[CHAT DEBUG] reqId=${reqId} SELF-MATCH TEST: found=${selfMatch?.length ?? 0} error=${selfErr ? JSON.stringify(selfErr) : "none"}`);

          // Also try with the AI-generated embedding for comparison
          console.log(`[CHAT DEBUG] reqId=${reqId} AI EMBEDDING: isArray=${Array.isArray(embedding)} length=${embedding.length} sample=${JSON.stringify(embedding)?.slice(0, 80)}`);
        }
      } catch (e) {
        console.log(`[CHAT DEBUG] reqId=${reqId} KNOWN DOC EXCEPTION: ${e}`);
      }

      // Vector search — fetch extra to allow deduplication
      const searchStart = Date.now();
      const { data: rawDocs, error: searchError } = await supabaseAdmin.rpc(
        "match_site_content",
        {
          query_embedding: embedding,
          match_threshold: 0.3,
          match_count: 50,
          filter_store_id: storeId,
        }
      );
      timings.vectorSearch = Date.now() - searchStart;

      // Deduplicate: many URL variants of the same page produce identical content chunks.
      // Keep highest-similarity entry per unique content (first 200 chars as key).
      type DocRow = { id: string; content: string; metadata?: { source?: string; url?: string }; similarity?: number };
      let relevantDocs: DocRow[] | null = null;
      if (rawDocs && rawDocs.length > 0) {
        const seen = new Set<string>();
        const deduped: DocRow[] = [];
        for (const doc of rawDocs as DocRow[]) {
          const key = doc.content.slice(0, 200);
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(doc);
          if (deduped.length >= 8) break;
        }
        relevantDocs = deduped;
        console.log(`[CHAT DEBUG] reqId=${reqId} vectorSearch took ${timings.vectorSearch}ms, rawDocs=${rawDocs.length}, afterDedup=${deduped.length}, threshold=0.3`);
      } else {
        relevantDocs = rawDocs;
        console.log(`[CHAT DEBUG] reqId=${reqId} vectorSearch took ${timings.vectorSearch}ms, docsFound=0, threshold=0.3`);
      }
      docsFound = relevantDocs?.length || 0;

      if (searchError) {
        console.log(`[CHAT DEBUG] reqId=${reqId} VECTOR SEARCH ERROR: ${JSON.stringify(searchError)}`);
        log.warn("Vector search failed, continuing without context", { reqId, storeId, error: searchError });
        // Continue with system prompt only — don't crash the chat
      }

      if (!relevantDocs || relevantDocs.length === 0) {
        console.log(`[CHAT DEBUG] reqId=${reqId} NO DOCUMENTS FOUND for query="${lastUserText.slice(0, 120)}" storeId=${storeId} — bot will answer without context`);

        // Debug peek: show top 5 closest docs regardless of threshold
        const { data: peekDocs, error: peekError } = await supabaseAdmin.rpc("match_site_content", {
          query_embedding: embedding,
          match_threshold: 0.0,
          match_count: 5,
          filter_store_id: storeId,
        });
        if (peekError) {
          console.log(`[CHAT DEBUG] reqId=${reqId} PEEK ERROR: ${JSON.stringify(peekError)}`);
        }
        if (peekDocs && peekDocs.length > 0) {
          console.log(`[CHAT DEBUG] reqId=${reqId} PEEK top ${peekDocs.length} closest docs (threshold=0):`);
          for (const doc of peekDocs as { content: string; metadata?: { source?: string; url?: string }; similarity?: number }[]) {
            const url = doc.metadata?.source || doc.metadata?.url || "NO URL";
            console.log(`[CHAT DEBUG]   similarity=${(doc.similarity ?? 0).toFixed(4)} source=${url} content="${doc.content.slice(0, 150)}"`);
          }
        } else {
          console.log(`[CHAT DEBUG] reqId=${reqId} PEEK returned 0 docs even with threshold=0 — no documents exist for this store`);
        }
      }

      // Machine-type compatibility filter: remove product docs that are incompatible with user's stated machine
      if (relevantDocs && relevantDocs.length > 0 && tenantConfig.features.boatExpertise) {
        const userTexts = messages
          .filter((m) => m.role === "user")
          .map((m) => extractTextFromMessage(m))
          .join(" ")
          .toLowerCase();

        let machineType: "roterende" | "da" | null = null;
        if (/\broterende\b/.test(userTexts)) {
          machineType = "roterende";
        } else if (/\b(da|dual.?action|oscillerende|random.?orbit)\b/.test(userTexts)) {
          machineType = "da";
        }

        if (machineType) {
          const before = relevantDocs.length;
          relevantDocs = relevantDocs.filter((doc) => {
            const url = (doc.metadata?.source || doc.metadata?.url || "").toLowerCase();
            // Only filter product pages, not blog/guide pages
            if (!url.includes("/products/") && !url.includes("/collections/")) return true;
            const snippet = doc.content.slice(0, 300).toLowerCase();

            if (machineType === "roterende") {
              if (/uten.roterende/.test(url) || /uten.roterende/.test(snippet)) return false;
              if (/(?:med|for|til).da.maskin/.test(url)) return false;
              if (/^til deg som .* (?:da|oscillerende)/i.test(doc.content.slice(0, 80))) return false;
            } else if (machineType === "da") {
              if (/passer kun til.*roterende/.test(snippet)) return false;
            }
            return true;
          });
          if (before !== relevantDocs.length) {
            console.log(`[CHAT DEBUG] reqId=${reqId} machineFilter: removed ${before - relevantDocs.length} incompatible docs (userMachine=${machineType}, remaining=${relevantDocs.length})`);
          }
        }
      }

      // Rewrite stale/renamed product references in context docs (temporary until re-scrape)
      if (relevantDocs && relevantDocs.length > 0 && storeId === "baatpleiebutikken") {
        const urlRewrites: Record<string, string> = {
          "/products/tix-kraft": "/products/batproff-kraftvask-til-bat-kraftvask-for-polering",
          "/products/hostvask-pakkepris-spar-10": "/products/varvask-pakkepris-spar-10",
        };
        for (const doc of relevantDocs as { content: string; metadata?: { source?: string; url?: string } }[]) {
          // Rewrite stale URLs
          for (const [oldPath, newPath] of Object.entries(urlRewrites)) {
            if (doc.metadata?.source?.includes(oldPath)) {
              doc.metadata.source = doc.metadata.source.replace(oldPath, newPath);
            }
            if (doc.metadata?.url?.includes(oldPath)) {
              doc.metadata.url = doc.metadata.url.replace(oldPath, newPath);
            }
          }
          // Rewrite stale product names in content
          doc.content = doc.content.replace(/\bTix Kraft\b/gi, "Båtproff Kraftvask");
          doc.content = doc.content.replace(/\bTIX KRAFT\b/g, "Båtproff Kraftvask");
        }
      }

      if (relevantDocs && relevantDocs.length > 0) {
        // Extract unique valid URLs from context chunks for the allowlist (strip tracking params)
        const contextUrls = new Set<string>();
        for (const doc of relevantDocs as { content: string; metadata?: { source?: string; url?: string }; similarity?: number }[]) {
          const url = doc.metadata?.source || doc.metadata?.url;
          if (url && url.startsWith("http")) {
            contextUrls.add(stripTrackingParams(url));
          }
          // Also extract product/collection URLs from markdown links within content text
          // e.g. [Product Name](https://shop.no/products/some-product)
          const contentUrlRegex = /\]\((https?:\/\/[^)]*\/(?:products|collections)\/[^)]+)\)/g;
          let contentUrlMatch;
          while ((contentUrlMatch = contentUrlRegex.exec(doc.content)) !== null) {
            contextUrls.add(stripTrackingParams(contentUrlMatch[1]));
          }
        }
        availableUrls = [...contextUrls];

        // Ensure core product URLs are always available for this tenant.
        // The system prompt instructs the model to recommend these products,
        // but vector search may only return blog posts without product page URLs.
        if (storeId === "baatpleiebutikken") {
          const coreProductUrls = [
            "https://www.baatpleiebutikken.no/products/batproff-kraftvask-til-bat-kraftvask-for-polering",
            "https://www.baatpleiebutikken.no/products/rex-one-step-revolusjoner-poleringen",
            "https://www.baatpleiebutikken.no/products/easy-gloss-polish-wax-hurtigpolering",
            "https://www.baatpleiebutikken.no/products/topfinish-2-nano-refinishing-polish-lett-oksidert-bat",
          ];
          for (const url of coreProductUrls) {
            const slug = url.split("/products/")[1];
            if (!availableUrls.some((u) => u.includes(slug))) {
              availableUrls.push(url);
            }
          }
        }

        // DEBUG: log context documents to trace wrong URL associations
        console.log(`[CHAT DEBUG] reqId=${reqId} context documents (${relevantDocs.length}):`);
        for (const doc of relevantDocs as { content: string; metadata?: { source?: string; url?: string }; similarity?: number }[]) {
          const url = doc.metadata?.source || doc.metadata?.url || "NO URL";
          console.log(`[CHAT DEBUG]   url=${url} similarity=${(doc.similarity ?? 0).toFixed(3)} content="${doc.content.slice(0, 120)}"`);
        }

        const docLabel = tenantConfig.language === "en" ? "DOC" : "DOK";
        context = relevantDocs
          .map((doc: { content: string; metadata?: { source?: string; url?: string } }, index: number) => {
            const rawUrl = doc.metadata?.source || doc.metadata?.url || "NO URL AVAILABLE";
            const url = rawUrl.startsWith("http") ? stripTrackingParams(rawUrl) : rawUrl;
            return `[${docLabel}-${index + 1}]\nKILDE: ${url}\n${doc.content}`;
          })
          .join("\n\n");
      }
    }

    timings.preAI = Date.now() - start;

    const aiStart = Date.now();
    // Build system prompt with guardrails from centralized module
    const lang = tenantConfig.language;
    const guardrails = getGuardrails(lang);

    // Build URL allowlist from context chunks
    let urlAllowlist = "";
    if (availableUrls.length > 0) {
      // Categorize URLs into products vs guides/articles
      const productUrls: string[] = [];
      const guideUrls: string[] = [];
      for (const u of availableUrls) {
        if (u.includes("/blogs/") || u.includes("/pages/")) {
          guideUrls.push(u);
        } else {
          productUrls.push(u);
        }
      }

      // Extract base domain for search URL fallback (e.g. "https://baatpleiebutikken.no")
      let searchUrlHint = "";
      try {
        const firstUrl = new URL(availableUrls[0]);
        const baseDomain = `${firstUrl.protocol}//${firstUrl.host}`;
        searchUrlHint = lang === "en"
          ? `\nIf a product does NOT have a matching URL above, use a search URL: ${baseDomain}/search?q=SEARCH+TERMS (use simple keywords from the user's question, do NOT invent product names). A search link is always better than a wrong product link.`
          : `\nHvis et produkt IKKE har en matchende URL over, bruk en søkelenke: ${baseDomain}/search?q=SØKEORD (bruk enkle søkeord fra brukerens spørsmål, IKKE finn opp produktnavn). En søkelenke er alltid bedre enn en feil produktlenke.`;
      } catch { /* invalid URL, skip hint */ }

      if (lang === "en") {
        const sections: string[] = [];
        if (productUrls.length > 0) {
          sections.push(`Product links:\n${productUrls.map((u) => `- ${u}`).join("\n")}`);
        }
        if (guideUrls.length > 0) {
          sections.push(`Guides and articles:\n${guideUrls.map((u) => `- ${u}`).join("\n")}`);
        }
        urlAllowlist = `AVAILABLE LINKS (use ONLY these, do NOT invent URLs):\n\n${sections.join("\n\n")}${searchUrlHint}`;
      } else {
        const sections: string[] = [];
        if (productUrls.length > 0) {
          sections.push(`Produktlenker:\n${productUrls.map((u) => `- ${u}`).join("\n")}`);
        }
        if (guideUrls.length > 0) {
          sections.push(`Guider og artikler:\n${guideUrls.map((u) => `- ${u}`).join("\n")}`);
        }
        urlAllowlist = `TILGJENGELIGE LENKER (bruk KUN disse, IKKE finn opp URL-er):\n\n${sections.join("\n\n")}${searchUrlHint}`;
      }
    }

    // Prompt assembly order:
    // WITH_CONTEXT: systemPrompt → contextRules → contextHeader+context → groundingFooter → urlAllowlist → securityFooter
    // NO_CONTEXT:   systemPrompt → noContextRules → securityFooter
    // SIMPLE:       systemPrompt → simpleMessage → securityFooter
    let fullSystemPrompt: string;
    let promptPath: string;
    if (context) {
      // When context docs exist, the question IS on-topic.
      // Strip canned rejection templates from tenant prompt to prevent GPT-4o-mini
      // from pattern-matching the quoted rejection response and outputting it verbatim.
      let contextSystemPrompt = systemPrompt.replace(
        /[Hh]vis brukeren stiller spørsmål som ikke er relatert[\s\S]*?skal du svare:\s*"[^"]*"/,
        ""
      ).replace(
        /[Ii]f the user asks[\s\S]*?(?:respond|answer) with:\s*"[^"]*"/,
        ""
      );
      // Clean up any leftover double-newlines from the removal
      contextSystemPrompt = contextSystemPrompt.replace(/\n{3,}/g, "\n\n").trim();

      fullSystemPrompt = [
        contextSystemPrompt,
        guardrails.contextRules,
        `${guardrails.contextHeader}\n${context}`,
        guardrails.groundingFooter,
        urlAllowlist,
        guardrails.securityFooter,
      ].filter(Boolean).join("\n\n");
      promptPath = "WITH_CONTEXT";
    } else if (!isSimpleMessage) {
      fullSystemPrompt = [systemPrompt, guardrails.noContextRules, guardrails.securityFooter].join("\n\n");
      promptPath = "NO_CONTEXT";
    } else {
      fullSystemPrompt = [systemPrompt, guardrails.simpleMessage, guardrails.securityFooter].join("\n\n");
      promptPath = "SIMPLE_MESSAGE";
    }
    console.log(`[CHAT DEBUG] reqId=${reqId} promptPath=${promptPath} contextLength=${context.length} availableUrls=${availableUrls.length} systemPromptLength=${fullSystemPrompt.length}`);

    // Build URL allowlist Set for response sanitization
    const allowedUrlSet = new Set(availableUrls);

    // Non-streaming mode for WebViews/in-app browsers
    const primaryModelId = testModel || "gpt-4o-mini";
    console.log(`[CHAT DEBUG] reqId=${reqId} storeId=${storeId} primaryModelId=${primaryModelId} testModel=${testModel} nonStreaming=${useNonStreaming}`);

    if (useNonStreaming) {
      let modelUsed: string = primaryModelId;
      let result: { text: string } | undefined;

      const vertex = getVertex();
      const primaryProvider = isOpenAIModel(primaryModelId)
        ? openai(primaryModelId)
        : vertex(primaryModelId);

      const models: { provider: Parameters<typeof generateText>[0]["model"]; name: string }[] = [
        { provider: primaryProvider, name: primaryModelId },
      ];
      if (primaryModelId !== "gpt-4o-mini") {
        models.push({ provider: openai("gpt-4o-mini"), name: "gpt-4o-mini" });
      } else {
        models.push({ provider: vertex("gemini-2.5-flash-lite"), name: "gemini-2.5-flash-lite" });
      }

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

      // Sanitize hallucinated URLs before sending
      const sanitizedText = sanitizeResponseUrls(result!.text, allowedUrlSet);

      // Return JSON response for non-streaming clients
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: sanitizedText,
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

    // Streaming mode (default) - GPT-4o-mini primary, Gemini fallback
    let modelUsed: string = primaryModelId;

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
    const primaryProvider = isOpenAIModel(primaryModelId)
      ? openai(primaryModelId)
      : vertex(primaryModelId);

    const models: { provider: Parameters<typeof streamText>[0]["model"]; name: string }[] = [
      { provider: primaryProvider, name: primaryModelId },
    ];
    if (primaryModelId !== "gpt-4o-mini") {
      models.push({ provider: openai("gpt-4o-mini"), name: "gpt-4o-mini" });
    } else {
      models.push({ provider: vertex("gemini-2.5-flash-lite"), name: "gemini-2.5-flash-lite" });
    }

    for (let i = 0; i < models.length; i++) {
      const { provider, name } = models[i];
      modelUsed = name;

      try {
        console.log(`[CHAT DEBUG] reqId=${reqId} streaming attempt #${i} model=${name}`);
        const result = streamText({
          model: provider,
          system: fullSystemPrompt,
          messages: normalizedMessages,
          abortSignal: AbortSignal.timeout(15_000),
          onFinish: async ({ text, finishReason, usage }) => {
            timings.aiTotal = Date.now() - aiStart;
            timings.total = Date.now() - start;

            console.log(`[CHAT DEBUG] reqId=${reqId} onFinish model=${modelUsed} finishReason=${finishReason} textLength=${text.length} text="${text.slice(0, 200)}"`);

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

        // Pipe through URL sanitizer to replace hallucinated links with search URLs
        // DEBUG: intercept stream to log chunks
        let debugChunkCount = 0;
        let debugTotalLength = 0;
        const debugTransform = new TransformStream<string, string>({
          transform(chunk, controller) {
            debugChunkCount++;
            debugTotalLength += chunk.length;
            if (debugChunkCount <= 5) {
              console.log(`[CHAT DEBUG] reqId=${reqId} stream chunk #${debugChunkCount} length=${chunk.length} content="${chunk.slice(0, 100)}"`);
            }
            controller.enqueue(chunk);
          },
          flush() {
            console.log(`[CHAT DEBUG] reqId=${reqId} stream DONE totalChunks=${debugChunkCount} totalLength=${debugTotalLength}`);
          },
        });

        const sanitizedStream = result.textStream
          .pipeThrough(debugTransform)
          .pipeThrough(createUrlSanitizerTransform(allowedUrlSet))
          .pipeThrough(new TextEncoderStream());

        return new Response(sanitizedStream, {
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
