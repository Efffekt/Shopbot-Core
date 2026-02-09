import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdmin } from "@/lib/admin-auth";
import { createLogger } from "@/lib/logger";

const log = createLogger("api/admin/blog/upload");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Magic bytes for supported image formats
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]], // GIF87a or GIF89a
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP)
  "image/avif": [], // AVIF uses ftyp box — checked separately
};

function verifyMagicBytes(buffer: Buffer, claimedType: string): boolean {
  if (buffer.length < 12) return false;

  // AVIF: ISO BMFF format — check for "ftyp" at offset 4 and "avif" or "avis" at offset 8
  if (claimedType === "image/avif") {
    const ftyp = buffer.slice(4, 8).toString("ascii");
    const brand = buffer.slice(8, 12).toString("ascii");
    return ftyp === "ftyp" && (brand === "avif" || brand === "avis");
  }

  const signatures = MAGIC_BYTES[claimedType];
  if (!signatures || signatures.length === 0) return false;

  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

export async function POST(request: NextRequest) {
  const { authorized, error: authError } = await verifyAdmin();
  if (!authorized) {
    return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpg, png, gif, webp, avif" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify actual file content matches claimed MIME type
    if (!verifyMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      );
    }

    const sanitizedName = file.name
      .slice(0, 200)
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/\.{2,}/g, ".")    // collapse consecutive dots
      .replace(/^[.-]+/, "")      // strip leading dots/hyphens
      .replace(/-+/g, "-");
    const path = `${Date.now()}-${sanitizedName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("blog-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      log.error("Failed to upload image:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("blog-images")
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    log.error("Error uploading image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
