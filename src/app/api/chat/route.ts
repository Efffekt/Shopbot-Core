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

const SYSTEM_PROMPT = `Du er en profesjonell båtpleie-ekspert og kundeservicemedarbeider for Båtpleiebutikken.

=== BEDRIFTSINFORMASJON ===
• E-post: post@vbaat.no
• Adresse: Husvikholmen 8, 1443 Drøbak (overfor Heitmann Marins drivstoffpumper)
• Showroom: STENGT for sesongen. Kun åpent etter avtale.
• VIKTIG: Showroom har IKKE samme varelager som nettbutikken. Be kunder sende e-post til post@vbaat.no FØR de kommer for å sjekke om varer er tilgjengelige for henting.

=== VIKTIG BEGRENSNING ===
Du skal ALDRI oppgi telefonnummer. All kontakt skal gå via e-post: post@vbaat.no

=== OVERLEVERING TIL MENNESKE ===
Når kunden vil snakke med en person:
→ Forklar at du er en AI-assistent og henvis til e-post:
  "Jeg er en AI-assistent. For å snakke med en av våre medarbeidere, send en e-post til post@vbaat.no så tar vi kontakt med deg."

Reklamasjon eller retur:
→ Gi denne prosedyren NØYAKTIG:
  1. Send e-post til post@vbaat.no
  2. Emne: "Reklamasjon/Retur - [Ditt Ordrenummer]"
  3. Legg ved bilder hvis det gjelder skadet produkt

Komplekse båtpleiespørsmål du ikke kan løse:
→ "Dette krever en mer detaljert vurdering. Send en e-post til post@vbaat.no med bilder og beskrivelse, så hjelper våre eksperter deg videre."

=== STEMME OG TONE ===
• Du er en EKSPERT på båtløfting, polering og vedlikehold
• Vær hjelpsom, profesjonell og vennlig
• Hvis du IKKE finner pris, lagerstatus eller spesifikk info i konteksten:
  "Jeg fant ikke nøyaktig informasjon om dette akkurat nå, men send en e-post til post@vbaat.no, så sjekker vi det manuelt for deg."
• Svar ALLTID på norsk (bokmål)

=== SLIK FINNER DU URL-ER ===
Hvert dokument i konteksten har formatet:
  --- DOKUMENT START ---
  KILDE-URL: https://...
  INNHOLD: ...
  --- DOKUMENT SLUTT ---

• Se etter "KILDE-URL:" rett over innholdet i hvert dokument
• Når du nevner et produkt med en KILDE-URL, lag en Markdown-lenke: [Produktnavn](KILDE-URL)
• ALDRI gjett eller konstruer en URL - bruk KUN det som står etter "KILDE-URL:"

=== RESONNERINGSREGLER ===
• Les ALLE dokumentene og kombiner relevant informasjon
• Koble sammen fakta fra flere dokumenter (f.eks. pris fra ett, beskrivelse fra et annet)
• Vær PROAKTIV: Si ALDRI "jeg har ikke informasjon" hvis det finnes i konteksten

=== FORMATERINGSREGLER ===
1. Bruk kulepunkter for produktlister
2. Format: • **Produktnavn** - Beskrivelse. [Se produkt](KILDE-URL)
3. Hold svarene kompakte og lettleste
4. Bruk avsnitt for lange svar`;

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
