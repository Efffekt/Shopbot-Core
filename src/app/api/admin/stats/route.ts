import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTenantConfig, getAllTenants, DEFAULT_TENANT } from "@/lib/tenants";
import { verifyAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/stats");

export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || DEFAULT_TENANT;
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Get tenant config for display name
    const tenantConfig = getTenantConfig(storeId);

    log.debug("Analytics request", { storeId, tenant: tenantConfig.name, days });

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateString = dateThreshold.toISOString();

    // 1. Get basic stats - filtered by store_id
    const { data: allConversations, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("id, was_handled, referred_to_email, detected_intent, created_at")
      .eq("store_id", storeId)
      .gte("created_at", dateString);

    if (convError) {
      log.error("Conversations query failed", { storeId, error: convError });
      throw convError;
    }

    log.debug("Conversations found", { storeId, count: allConversations?.length || 0 });

    // Calculate stats from the data
    const conversations = allConversations || [];
    const stats = {
      total_conversations: conversations.length,
      handled_count: conversations.filter((c) => c.was_handled).length,
      unhandled_count: conversations.filter((c) => !c.was_handled).length,
      email_referrals: conversations.filter((c) => c.referred_to_email).length,
      product_queries: conversations.filter((c) => c.detected_intent === "product_query").length,
      support_queries: conversations.filter((c) => c.detected_intent === "support").length,
      handled_rate: conversations.length > 0
        ? Math.round((conversations.filter((c) => c.was_handled).length / conversations.length) * 100 * 10) / 10
        : 100,
    };

    log.debug("Stats calculated", stats);

    // 2. Get top search terms (simple word extraction) - filtered by store_id
    const { data: queryData, error: queryError } = await supabaseAdmin
      .from("conversations")
      .select("user_query")
      .eq("store_id", storeId)
      .gte("created_at", dateString);

    if (queryError) {
      log.error("Query data fetch failed", { storeId, error: queryError });
    }

    // Extract and count words - comprehensive Norwegian stop-word filtering
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      // Norwegian question words & pronouns
      "hva", "hvem", "hvor", "hvordan", "hvorfor", "hvilke", "hvilken", "hvilket",
      "jeg", "meg", "min", "mitt", "mine", "deg", "din", "ditt", "dine",
      "han", "hun", "den", "det", "vi", "oss", "vår", "vårt", "våre",
      "de", "dem", "deres", "seg", "sin", "sitt", "sine", "dere",
      // Common verbs
      "har", "er", "var", "være", "blir", "bli", "ble", "blitt",
      "kan", "kunne", "vil", "ville", "skal", "skulle", "må", "måtte",
      "får", "fikk", "gjør", "gjøre", "gjorde", "gjort", "går", "gikk",
      "ser", "så", "sett", "tar", "tok", "tatt", "kom", "komme", "kommer",
      "finne", "finn", "finner", "fant", "funnet", "bruke", "bruker", "brukte",
      "trenger", "trenge", "trengte", "anbefale", "anbefaler", "anbefalt",
      "burde", "bør", "mener", "tror", "tenker", "lurer", "vite", "vet",
      // Prepositions & conjunctions
      "og", "eller", "men", "som", "at", "om", "på", "av", "til", "fra",
      "med", "for", "i", "etter", "før", "over", "under", "ved", "hos",
      "mot", "uten", "mellom", "gjennom", "siden", "fordi", "derfor",
      // Articles & determiners
      "en", "ei", "et", "den", "det", "de", "denne", "dette", "disse",
      // Adverbs & fillers
      "ikke", "bare", "også", "selv", "nå", "da", "så", "her", "der",
      "opp", "ned", "ut", "inn", "bort", "frem", "tilbake", "rundt",
      "mer", "mest", "mindre", "minst", "enn", "like", "helt", "veldig",
      "ganske", "litt", "mye", "mange", "noen", "noe", "alle", "alt",
      "andre", "annet", "hver", "hvert", "ingen", "ingenting", "begge",
      "første", "siste", "samme", "egen", "egne", "eget",
      // Common question starters
      "hei", "hallo", "takk", "vennligst", "please",
      // English common words (for bilingual users)
      "what", "the", "and", "for", "that", "this", "with", "you", "have",
      "how", "can", "want", "need", "looking", "best", "good", "any"
    ]);

    (queryData || []).forEach((row) => {
      const words = row.user_query
        .toLowerCase()
        .replace(/[^a-zæøå0-9\s-]/g, "") // Keep hyphens for compound words
        .replace(/-+/g, " ") // Convert hyphens to spaces
        .split(/\s+/)
        .filter((w: string) => w.length >= 4 && !stopWords.has(w));

      words.forEach((word: string) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    const topSearchTerms = Object.entries(wordCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    log.debug("Top search terms", { top5: topSearchTerms.slice(0, 5) });

    // 3. Get unanswered queries - filtered by store_id
    const { data: unansweredData, error: unansweredError } = await supabaseAdmin
      .from("conversations")
      .select("id, created_at, user_query, ai_response")
      .eq("store_id", storeId)
      .eq("was_handled", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (unansweredError) {
      log.error("Unanswered query fetch failed", { storeId, error: unansweredError });
    }

    log.debug("Unanswered queries", { count: unansweredData?.length || 0 });

    // 4. Get daily volume (last 14 days) - filtered by store_id
    const volumeThreshold = new Date();
    volumeThreshold.setDate(volumeThreshold.getDate() - 14);

    const { data: volumeData, error: volumeError } = await supabaseAdmin
      .from("conversations")
      .select("created_at")
      .eq("store_id", storeId)
      .gte("created_at", volumeThreshold.toISOString());

    if (volumeError) {
      log.error("Volume query failed", { storeId, error: volumeError });
    }

    // Group by date
    const dailyCounts: Record<string, number> = {};
    (volumeData || []).forEach((row) => {
      const date = row.created_at.split("T")[0]; // YYYY-MM-DD
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const dailyVolume: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyVolume.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0,
      });
    }

    log.debug("Daily volume", { last3: dailyVolume.slice(-3) });

    // 5. Get document count for this tenant
    const { count: documentCount, error: docCountError } = await supabaseAdmin
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId);

    if (docCountError) {
      log.error("Document count query failed", { storeId, error: docCountError });
    }

    return NextResponse.json({
      success: true,
      storeId,
      tenantName: tenantConfig.name,
      period: `${days} days`,
      stats,
      topSearchTerms,
      unansweredQueries: unansweredData || [],
      dailyVolume,
      documentCount: documentCount || 0,
      availableTenants: getAllTenants().map((t) => ({ id: t.id, name: t.name })),
    });
  } catch (error) {
    log.error("Analytics API error", { error: error as Error });
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
