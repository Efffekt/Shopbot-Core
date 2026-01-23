import { NextRequest } from "next/server";
import { z } from "zod";
import { embed, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { supabaseAdmin } from "@/lib/supabase";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1),
  storeId: z.string().min(1),
});

const SYSTEM_PROMPT = `You are a professional customer service assistant for an online store. Answer ONLY based on the information provided in the context. If you do not know the answer, ask the customer to contact the store directly. Keep answers brief, friendly, and in Norwegian.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = chatSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
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

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: lastUserMessage.content,
      providerOptions: {
        openai: { dimensions: 1536 },
      },
    });

    const { data: relevantDocs, error: searchError } = await supabaseAdmin.rpc(
      "match_site_content",
      {
        query_embedding: embedding,
        match_threshold: 0.2,
        match_count: 5,
        filter_store_id: storeId,
      }
    );

    if (searchError) {
      console.error("Vector search error:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to search documents" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const context =
      relevantDocs && relevantDocs.length > 0
        ? relevantDocs.map((doc: { content: string }) => doc.content).join("\n\n---\n\n")
        : "No relevant information found in the knowledge base.";

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: `${SYSTEM_PROMPT}\n\nContext:\n${context}`,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
