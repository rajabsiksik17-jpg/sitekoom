import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureScreenshots, storagePathFromUrl } from "@/lib/screenshots";

export const runtime = "nodejs";
export const maxDuration = 60;

const oldSchema = z
  .object({
    desktop: z.string().optional(),
    tablet: z.string().optional(),
    mobile: z.string().optional(),
  })
  .optional();

const schema = z.object({
  url: z.string().min(1).max(2000),
  old: oldSchema,
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

    // Cleanup: only remove the old files of the devices that were successfully
    // re-captured, so a failed device keeps its previous screenshot.
    const removePaths: string[] = [];
    for (const key of ["desktop", "tablet", "mobile"] as const) {
      const previous = body.old?.[key];
      if (result.images[key] && previous) {
        const p = storagePathFromUrl(previous);
        if (p) removePaths.push(p);
      }
    }
    if (removePaths.length) {
      await createAdminClient().storage.from("media").remove(removePaths).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "فشل التقاط الصور";
    console.error(
      "[SCREENSHOT DEBUG] captureError:",
      e instanceof Error ? (e.stack ?? e.message) : String(e),
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
