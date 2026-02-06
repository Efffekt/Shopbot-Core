import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { getCreditStatus } from "@/lib/credits";

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
    const credits = await getCreditStatus(tenantId);

    if (!credits) {
      return NextResponse.json({ error: "Could not fetch credit status" }, { status: 500 });
    }

    return NextResponse.json(credits);
  } catch (error) {
    console.error("Credits API error:", error);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
