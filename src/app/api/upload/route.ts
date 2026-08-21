import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/zip",
  "application/x-zip-compressed",
];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`upload:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) ?? "bin";
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50);
  const path = `project-attachments/${Date.now()}-${base}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error } = await admin.storage.from("media").upload(path, bytes, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = admin.storage.from("media").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url, name: file.name, mime: file.type, size: file.size });
}
