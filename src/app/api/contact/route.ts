import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }

    // Store in Supabase
    const { error: dbError } = await supabaseAdmin.from("contact_submissions").insert({
      name,
      email,
      company: company || null,
      message,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Failed to store contact submission:", dbError);
      // Continue anyway - we'll send the email notification
    }

    // Send email notification (optional - you can integrate with Resend, SendGrid, etc.)
    // For now, just log it
    console.log("📧 New contact submission:", { name, email, company, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}
