import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// This route is protected by middleware Basic Auth

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || "baatpleiebutikken";
    const days = parseInt(searchParams.get("days") || "30", 10);

    console.log(`📊 Analytics request: storeId=${storeId}, days=${days}`);

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateString = dateThreshold.toISOString();

    // 1. Get basic stats
    const { data: allConversations, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("id, was_handled, referred_to_email, detected_intent, created_at")
      .eq("store_id", storeId)
      .gte("created_at", dateString);

    if (convError) {
      console.error("❌ Conversations query error:", convError);
      throw convError;
    }

    console.log(`📊 Found ${allConversations?.length || 0} conversations for store: ${storeId}`);

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

    console.log(`📊 Stats calculated:`, stats);

    // 2. Get top search terms (simple word extraction)
    const { data: queryData, error: queryError } = await supabaseAdmin
      .from("conversations")
      .select("user_query")
      .eq("store_id", storeId)
      .gte("created_at", dateString);

    if (queryError) {
      console.error("❌ Query data error:", queryError);
    }

    // Extract and count words
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "hva", "har", "dere", "kan", "jeg", "finn", "finne", "hvor", "hvordan",
      "dette", "den", "det", "eller", "som", "med", "til", "for", "ikke",
      "what", "the", "and", "for", "that", "this", "with", "you", "have",
      "er", "en", "et", "om", "på", "av", "være", "vil", "skal", "fra",
      "enn", "mer", "også", "bare", "når", "hvis", "noen", "alle", "andre"
    ]);

    (queryData || []).forEach((row) => {
      const words = row.user_query
        .toLowerCase()
        .replace(/[^a-zæøå0-9\s]/g, "")
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !stopWords.has(w));

      words.forEach((word: string) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });

    const topSearchTerms = Object.entries(wordCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    console.log(`📊 Top search terms:`, topSearchTerms.slice(0, 5));

    // 3. Get unanswered queries
    const { data: unansweredData, error: unansweredError } = await supabaseAdmin
      .from("conversations")
      .select("id, created_at, user_query, ai_response")
      .eq("store_id", storeId)
      .eq("was_handled", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (unansweredError) {
      console.error("❌ Unanswered query error:", unansweredError);
    }

    console.log(`📊 Unanswered queries: ${unansweredData?.length || 0}`);

    // 4. Get daily volume (last 14 days)
    const volumeThreshold = new Date();
    volumeThreshold.setDate(volumeThreshold.getDate() - 14);

    const { data: volumeData, error: volumeError } = await supabaseAdmin
      .from("conversations")
      .select("created_at")
      .eq("store_id", storeId)
      .gte("created_at", volumeThreshold.toISOString());

    if (volumeError) {
      console.error("❌ Volume query error:", volumeError);
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

    console.log(`📊 Daily volume (last 3 days):`, dailyVolume.slice(-3));

    return NextResponse.json({
      success: true,
      storeId,
      period: `${days} days`,
      stats,
      topSearchTerms,
      unansweredQueries: unansweredData || [],
      dailyVolume,
    });
  } catch (error) {
    console.error("❌ Analytics API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
