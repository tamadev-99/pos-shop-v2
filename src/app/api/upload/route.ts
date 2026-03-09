import { NextRequest, NextResponse } from "next/server";
import { getSupabase, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Generate unique filename
    const filename = `${crypto.randomUUID()}.webp`;
    const path = `products/${filename}`;

    // Convert File to ArrayBuffer for Supabase upload
    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "image/webp",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
