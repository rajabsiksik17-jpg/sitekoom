import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { buildMediaUsage, rewriteMediaReferences, extractStoragePath } from "@/lib/media-usage";

const schema = z.object({
  keep_id: z.string().uuid(),
  duplicate_ids: z.array(z.string().uuid()).min(1),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "media.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: keep } = await admin.from("media").select("*").eq("id", body.keep_id).single();
  if (!keep) return NextResponse.json({ error: "Keep not found" }, { status: 404 });

  const { data: dups } = await admin.from("media").select("*").in("id", body.duplicate_ids);
  const dupItems = (dups ?? []) as { id: string; url: string; storage_path: string | null }[];

  let merged = 0;
  for (const dup of dupItems) {
    if (dup.url === keep.url) continue;
    await rewriteMediaReferences(admin, dup.url, keep.url);

    // Delete duplicate storage object only if no references remain.
    const remaining = await buildMediaUsage(admin, [dup.url]);
    if ((remaining[dup.url] ?? []).length === 0) {
      const storagePath = dup.storage_path || extractStoragePath(dup.url);
      if (storagePath) {
        const bucket = storagePath.split("/")[0];
        const relPath = storagePath.split("/").slice(1).join("/");
        await admin.storage.from(bucket).remove([relPath]).catch(() => null);
      }
      await admin.from("media").delete().eq("id", dup.id);
      merged++;
    }
  }

  return NextResponse.json({ ok: true, merged });
}
