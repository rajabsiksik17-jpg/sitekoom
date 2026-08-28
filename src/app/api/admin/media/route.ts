import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { buildMediaUsage, extractStoragePath } from "@/lib/media-usage";
import type { MediaItem } from "@/lib/types";

async function sha256(bytes: ArrayBuffer): Promise<string> {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "media.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data } = await admin.from("media").select("*").order("created_at", { ascending: false });
  const items = (data ?? []) as MediaItem[];
  const usage = items.length ? await buildMediaUsage(admin, items.map((m) => m.url)) : {};
  return NextResponse.json({ items, usage });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "media.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "library";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const hash = await sha256(bytes);

  const admin = createAdminClient();

  // Dedup: reuse an existing file with the same hash.
  const { data: existing } = await admin.from("media").select("*").eq("hash", hash).limit(1);
  if (existing && existing.length) {
    return NextResponse.json({ id: existing[0].id, url: existing[0].url, duplicated: true });
  }

  const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) ?? "bin";
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50);
  const path = `${folder}/${Date.now()}-${base}.${ext}`;

  const { error: upErr } = await admin.storage.from("media").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const url = admin.storage.from("media").getPublicUrl(path).data.publicUrl;
  const { data: row, error: insErr } = await admin
    .from("media")
    .insert({ url, name: file.name, mime_type: file.type, size: file.size, folder, hash, storage_path: `media/${path}` })
    .select()
    .single();
  if (insErr || !row) return NextResponse.json({ error: insErr?.message ?? "Failed" }, { status: 500 });

  return NextResponse.json({ id: row.id, url, duplicated: false });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "media.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { data: item } = await admin.from("media").select("*").eq("id", id).single();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usage = await buildMediaUsage(admin, [item.url]);
  if ((usage[item.url] ?? []).length > 0) {
    return NextResponse.json({ error: "الملف مستخدم ولا يمكن حذفه", usage: usage[item.url] }, { status: 409 });
  }

  const storagePath = item.storage_path || extractStoragePath(item.url);
  if (storagePath) {
    const bucket = storagePath.split("/")[0];
    const relPath = storagePath.split("/").slice(1).join("/");
    await admin.storage.from(bucket).remove([relPath]).catch(() => null);
  }
  await admin.from("media").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
