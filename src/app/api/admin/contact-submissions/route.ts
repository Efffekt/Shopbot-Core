import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdmin } from "@/lib/admin-auth";
import { logAudit } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase";
import { safeParseInt } from "@/lib/params";

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = safeParseInt(searchParams.get("page"), 1, 1000);
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from("contact_submissions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }

  return NextResponse.json({
    submissions: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { id } = parsed.data;

  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  await logAudit({
    actorEmail: auth.email || "unknown",
    action: "delete",
    entityType: "contact_submission",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
