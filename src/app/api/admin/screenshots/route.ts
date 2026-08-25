import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureScreenshots, storagePathFromUrl } from "@/lib/screenshots";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  url: z.string().min(1).max(2000),
  remove: z.array(z.string()).max(6).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "projects.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await captureScreenshots(body.url);

    // Best-effort cleanup of the previous screenshots so re-capturing does not
    // leave orphaned files behind.
    if (body.remove?.length) {
      const paths = body.remove.map(storagePathFromUrl).filter((p): p is string => !!p);
      if (paths.length) {
        await createAdminClient().storage.from("media").remove(paths).catch(() => {});
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل التقاط الصور" },
      { status: 500 },
    );
  }
}
