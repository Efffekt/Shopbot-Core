import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// This route is protected by middleware Basic Auth

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId") || "baatpleiebutikken";
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Fetch all stats in parallel
    const [statsResult, termsResult, unansweredResult, volumeResult] =
      await Promise.all([
        // Overall stats
        supabaseAdmin.rpc("get_conversation_stats", {
          p_store_id: storeId,
          p_days: days,
        }),
        // Top search terms
        supabaseAdmin.rpc("get_top_search_terms", {
          p_store_id: storeId,
          p_limit: 15,
          p_days: days,
        }),
        // Unanswered queries
        supabaseAdmin.rpc("get_unanswered_queries", {
          p_store_id: storeId,
          p_limit: 20,
        }),
        // Daily volume
        supabaseAdmin.rpc("get_daily_chat_volume", {
          p_store_id: storeId,
          p_days: 14,
        }),
      ]);

    // Handle potential errors
    if (statsResult.error) {
      console.error("Stats error:", statsResult.error);
    }
    if (termsResult.error) {
      console.error("Terms error:", termsResult.error);
    }
    if (unansweredResult.error) {
      console.error("Unanswered error:", unansweredResult.error);
    }
    if (volumeResult.error) {
      console.error("Volume error:", volumeResult.error);
    }

    return NextResponse.json({
      success: true,
      storeId,
      period: `${days} days`,
      stats: statsResult.data || {
        total_conversations: 0,
        handled_count: 0,
        unhandled_count: 0,
        email_referrals: 0,
        product_queries: 0,
        support_queries: 0,
        handled_rate: 100,
      },
      topSearchTerms: termsResult.data || [],
      unansweredQueries: unansweredResult.data || [],
      dailyVolume: volumeResult.data || [],
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
