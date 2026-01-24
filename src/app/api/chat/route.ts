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

const SYSTEM_PROMPT = `Du er en EKSPERT på båtpleie og jobber som kundeservice for en nettbutikk.

KRITISK - SLIK FINNER DU URL-ER:
- Hvert dokument i konteksten har formatet:
  --- DOKUMENT START ---
  KILDE-URL: https://...
  INNHOLD: ...
  --- DOKUMENT SLUTT ---
- Du SKAL se etter "KILDE-URL:" som står rett over innholdet i hvert dokument
- Hvis brukeren spør om en lenke til et produkt, og du ser en KILDE-URL rett over informasjonen om det produktet, er det DIN PLIKT å gjengi den NØYAKTIG som en Markdown-lenke: [Produktnavn](KILDE-URL)
- ALDRI gjett eller konstruer en URL - bruk KUN det som står etter "KILDE-URL:"

RESONNERINGSREGLER:
- Les ALLE dokumentene og kombiner relevant informasjon
- Koble sammen fakta fra flere dokumenter (f.eks. pris fra ett, beskrivelse fra et annet)
- Vær PROAKTIV: Si ALDRI "jeg har ikke informasjon" hvis det finnes i konteksten

FORMATERINGSREGLER:
1. Bruk kulepunkter (*) for produktlister
2. Format: * **Produktnavn** - Beskrivelse. [Les mer](KILDE-URL-FRA-DOKUMENT)
3. Hold svarene kompakte
4. Svar på norsk

Vær hjelpsom og del din ekspertise!`;

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

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: lastUserText,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
    });

    const { data: relevantDocs, error: searchError } = await supabaseAdmin.rpc(
      "match_site_content",
      {
        query_embedding: embedding,
        match_threshold: 0.4,
        match_count: 8,
        filter_store_id: storeId,
      }
    );

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

    // DEBUG: Se om URL-ene faktisk er med i konteksten
    console.log("=== FINAL PROMPT CONTEXT ===");
    console.log(context);
    console.log("=== END CONTEXT ===");

    const normalizedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: extractTextFromMessage(m),
    }));

    const result = streamText({
      model: openai("gpt-4o"),
      system: context ? `${SYSTEM_PROMPT}\n\nKONTEKST FRA DATABASE:\n${context}` : SYSTEM_PROMPT,
      messages: normalizedMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
