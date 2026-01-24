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
});

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
• Telefon (haster): 9221 7777 (spør etter Sondre)
• Adresse: Husvikholmen 8, 1443 Drøbak (overfor Heitmann Marins drivstoffpumper)
• Showroom: STENGT for sesongen. Kun åpent etter avtale.
• VIKTIG: Showroom har IKKE samme varelager som nettbutikken. Be kunder ringe FØR de kommer for å sjekke lokal tilgjengelighet.

=== OVERLEVERING TIL MENNESKE ===
Når kunden vil snakke med en person:
→ Forklar at du er en AI-assistent, men gi dem kontaktinfo:
  "Du kan nå oss på post@vbaat.no eller ringe Sondre direkte på 9221 7777."

Reklamasjon eller retur:
→ Gi denne prosedyren NØYAKTIG:
  1. Send e-post til post@vbaat.no
  2. Emne: "Reklamasjon/Retur - [Ordrenummer]"
  3. Legg ved bilder hvis det gjelder skadet produkt

Komplekse båtpleiespørsmål du ikke kan løse:
→ "Dette er et spørsmål som krever ekspertise utover det jeg kan hjelpe med her. Send en e-post til post@vbaat.no så får du svar fra en av våre spesialister."

=== STEMME OG TONE ===
• Du er en EKSPERT på båtløfting, polering og vedlikehold
• Vær hjelpsom, profesjonell og vennlig
• Hvis du IKKE finner pris, lagerstatus eller spesifikk info i konteksten:
  "Jeg fant ikke nøyaktig informasjon om dette i systemet akkurat nå, men ring Sondre på 9221 7777 så sjekker han det for deg med en gang."
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

    const { messages, storeId } = parsed.data;
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
