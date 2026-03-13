import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { getTenantConfigFromDB } from "@/lib/tenants";
import { getCreditStatus } from "@/lib/credits";
import { safeParseInt } from "@/lib/params";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/tenant/stats");

interface RouteParams {
  params: Promise<{ tenantId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tenantId } = await params;
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: access } = await supabase
    .from("tenant_user_access")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .single();

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = safeParseInt(searchParams.get("days"), 30, 365);

    const tenantConfig = await getTenantConfigFromDB(tenantId);

    if (!tenantConfig) {
      return NextResponse.json({ error: "Unknown tenant" }, { status: 400 });
    }

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateString = dateThreshold.toISOString();

    // Use the requested period for the volume chart (capped at 90 days for readability)
    const volumeDays = Math.min(days, 90);
    const volumeThreshold = new Date();
    volumeThreshold.setDate(volumeThreshold.getDate() - volumeDays);

    // Run all independent queries in parallel
    const [
      { data: allConversations, error: convError },
      { data: unansweredData },
      { data: volumeData },
      { count: documentCount },
      creditStatus,
      { data: clickData },
      { data: topClicksData },
    ] = await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("id, was_handled, referred_to_email, detected_intent, created_at, user_query")
        .eq("store_id", tenantId)
        .gte("created_at", dateString),
      supabaseAdmin
        .from("conversations")
        .select("id, created_at, user_query, ai_response")
        .eq("store_id", tenantId)
        .eq("was_handled", false)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("conversations")
        .select("created_at")
        .eq("store_id", tenantId)
        .gte("created_at", volumeThreshold.toISOString()),
      supabaseAdmin
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("store_id", tenantId),
      getCreditStatus(tenantId),
      supabaseAdmin
        .from("widget_link_clicks")
        .select("id, session_id, clicked_url")
        .eq("store_id", tenantId)
        .gte("created_at", dateString),
      supabaseAdmin
        .from("widget_link_clicks")
        .select("clicked_url, link_text")
        .eq("store_id", tenantId)
        .gte("created_at", dateString)
        .order("created_at", { ascending: false }),
    ]);

    if (convError) throw convError;

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

    // Extract top search terms from the same conversations data
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "hva", "hvem", "hvor", "hvordan", "hvorfor", "hvilke", "hvilken", "hvilket",
      "jeg", "meg", "min", "mitt", "mine", "deg", "din", "ditt", "dine",
      "han", "hun", "den", "det", "vi", "oss", "vår", "vårt", "våre",
      "de", "dem", "deres", "seg", "sin", "sitt", "sine", "dere",
      "har", "er", "var", "være", "blir", "bli", "ble", "blitt",
      "kan", "kunne", "vil", "ville", "skal", "skulle", "må", "måtte",
      "får", "fikk", "gjør", "gjøre", "gjorde", "gjort", "går", "gikk",
      "og", "eller", "men", "som", "at", "om", "på", "av", "til", "fra",
      "med", "for", "i", "etter", "før", "over", "under", "ved", "hos",
      "en", "ei", "et", "denne", "dette", "disse",
      "ikke", "bare", "også", "selv", "nå", "da", "så", "her", "der",
      "hei", "hallo", "takk", "vennligst", "please",
      "what", "the", "and", "for", "that", "this", "with", "you", "have",
      "how", "can", "want", "need", "looking", "best", "good", "any"
    ]);

    conversations.forEach((row) => {
      if (!row.user_query) return;
      const words = row.user_query
        .toLowerCase()
        .replace(/[^a-zæøå0-9\s-]/g, "")
        .replace(/-+/g, " ")
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

    // Build daily volume from volume data
    const dailyCounts: Record<string, number> = {};
    (volumeData || []).forEach((row) => {
      const date = row.created_at.split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const dailyVolume: { date: string; count: number }[] = [];
    for (let i = volumeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyVolume.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0,
      });
    }

    // Build click analytics
    const clicks = clickData || [];
    const clicksByUrl: Record<string, { clicks: number; sessions: Set<string>; label: string }> = {};
    for (const click of topClicksData || []) {
      const key = click.clicked_url;
      if (!clicksByUrl[key]) {
        clicksByUrl[key] = { clicks: 0, sessions: new Set(), label: click.link_text || "" };
      }
      clicksByUrl[key].clicks++;
    }
    // Count unique sessions per URL from the full click data
    for (const click of clicks) {
      const key = click.clicked_url;
      if (clicksByUrl[key] && click.session_id) {
        clicksByUrl[key].sessions.add(click.session_id);
      }
    }
    const topClickedLinks = Object.entries(clicksByUrl)
      .map(([url, data]) => ({
        url,
        label: data.label,
        clicks: data.clicks,
        uniqueSessions: data.sessions.size,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const clickStats = {
      totalClicks: clicks.length,
      uniqueSessions: new Set(clicks.map((c) => c.session_id).filter(Boolean)).size,
      uniqueUrls: new Set(clicks.map((c) => c.clicked_url)).size,
    };

    return NextResponse.json({
      success: true,
      tenantId,
      tenantName: tenantConfig.name,
      period: `${days} days`,
      stats,
      topSearchTerms,
      unansweredQueries: (unansweredData || []).map((q) => ({
        ...q,
        user_query: q.user_query?.slice(0, 200),
        ai_response: q.ai_response?.slice(0, 200),
      })),
      dailyVolume,
      documentCount: documentCount || 0,
      credits: creditStatus,
      clickStats,
      topClickedLinks,
    }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
    });
  } catch (error) {
    log.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
