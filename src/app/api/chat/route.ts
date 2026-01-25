import { NextRequest } from "next/server";
import { z } from "zod";
import { embed, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabaseAdmin } from "@/lib/supabase";

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
  storeId: z.string().min(1),
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
    q.includes("hjelp")
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
    q.includes("anbefal")
  ) {
    return "product_query";
  }

  // General questions
  if (
    q.includes("hvordan") ||
    q.includes("hva er") ||
    q.includes("kan jeg")
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
  return response.toLowerCase().includes("post@vbaat.no");
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

const SYSTEM_PROMPT = `Du er produktspesialist for Båtpleiebutikken.

=== GULLREGEL: KONTEKST ER DIN ENESTE SANNHET ===
Din ENESTE kilde til produkter, priser og URL-er er "KONTEKST FRA DATABASE" nedenfor.

Selv om du VET at et produkt eksisterer i verden (f.eks. Jotun NonStop, International Micron):
→ Hvis det IKKE står i konteksten, EKSISTERER DET IKKE for denne samtalen.
→ Du selger KUN det som vises i konteksten.

=== URL-INTEGRITET (ABSOLUTT) ===
ALDRI konstruer en URL selv. Ikke én gang.

Hver kontekst-blokk har formatet:
--- DOKUMENT START ---
KILDE-URL: https://eksakt-url-her
INNHOLD: produktinfo...
--- DOKUMENT SLUTT ---

Regelen:
• KOPIER "KILDE-URL" nøyaktig som den står
• Hvis ingen KILDE-URL finnes → INGEN lenke
• Hvis URL ikke matcher produktet → INGEN lenke

=== NÅR DATA MANGLER ===
Scenario 1: Bruker spør om "bunnstoff til trebåt", kontekst viser kun "Seajet 033"
→ "For bunnstoff anbefaler jeg Seajet 033 fra vårt sortiment. Det er et selvpolerende bunnstoff som fungerer godt på de fleste båttyper."
→ Vis produktet med KILDE-URL fra konteksten

Scenario 2: Bruker spør om et merke/produkt som IKKE er i konteksten
→ "Jeg fant ingen [merke/produkt] i vårt sortiment."
→ Hvis relevante alternativer finnes i konteksten: "Fra vårt utvalg kan jeg anbefale:" + list dem
→ Hvis ingenting relevant: "Send en e-post til post@vbaat.no så hjelper vi deg videre."

Scenario 3: Konteksten er tom eller irrelevant
→ "Jeg fant ingen produkter i vårt system for dette, men send en e-post til post@vbaat.no så hjelper vi deg manuelt."

=== PRODUKTFORMAT ===
**Produktnavn** (nøyaktig som i konteksten)
Kort forklaring på hvorfor dette passer kundens behov.
Pris: [pris fra kontekst] ,-
👉 [Se produkt her]([EKSAKT KILDE-URL])

Regler:
• Maks 3 produkter
• Aldri --- eller ***
• Aldri lenke uten verifisert KILDE-URL

=== E-POST ===
Nevn post@vbaat.no kun når:
• Ingen produkter funnet i kontekst
• Bruker ber om menneske
• Reklamasjon/retur/klage
• Showroom (Husvikholmen 8, Drøbak - stengt, kun avtale)

=== SPRÅK ===
Norsk (bokmål). Aldri telefonnummer.`;

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

    const { messages, storeId, sessionId } = parsed.data;
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
    console.log(`⏱️ Embedding tok: ${embeddingDone - start}ms`);

    const { data: relevantDocs, error: searchError } = await supabaseAdmin.rpc(
      "match_site_content",
      {
        query_embedding: embedding,
        match_threshold: 0.4,
        match_count: 8,
        filter_store_id: storeId,
      }
    );

    const dbDone = Date.now();
    console.log(`⏱️ Supabase søk tok: ${dbDone - embeddingDone}ms`);

    if (searchError) {
      return new Response(
        JSON.stringify({ error: "Search failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const context =
      relevantDocs && relevantDocs.length > 0
        ? relevantDocs
            .map((doc: { content: string; metadata?: { source?: string; url?: string } }) => {
              const url = doc.metadata?.source || doc.metadata?.url || "INGEN URL TILGJENGELIG";
              return `--- DOKUMENT START ---\nKILDE-URL: ${url}\nINNHOLD: ${doc.content}\n--- DOKUMENT SLUTT ---`;
            })
            .join("\n\n")
        : "";

    const normalizedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractTextFromMessage(m),
    }));

    const aiStart = Date.now();
    console.log(`⏱️ Klargjøring tok: ${aiStart - dbDone}ms`);
    console.log(`⏱️ Total før AI: ${aiStart - start}ms`);

    const result = streamText({
      model: openai("gpt-4o"),
      system: context ? `${SYSTEM_PROMPT}\n\nKONTEKST FRA DATABASE:\n${context}` : SYSTEM_PROMPT,
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
