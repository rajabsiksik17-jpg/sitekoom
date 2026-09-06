import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { captureScreenshots, type DeviceKey } from "@/lib/screenshots";

export const runtime = "nodejs";
export const maxDuration = 300;

const itemSchema = z.object({
  project_id: z.string().uuid(),
  url: z.string().max(2000),
  mode: z.enum(["desktop", "desktop_mobile"]),
});

const schema = z.object({
  items: z.array(itemSchema).min(1).max(100),
});

const CONCURRENCY = 2; // controlled concurrency to avoid flooding the server

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

  const admin = createAdminClient();

  const results: { project_id: string; status: "success" | "error" | "no_url"; error?: string }[] = [];
  const queue = [...body.items];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) });

  async function process(item: z.infer<typeof itemSchema>) {
    const url = item.url.trim();
    if (!url) {
      results.push({ project_id: item.project_id, status: "no_url" });
      return;
    }
    const devices: DeviceKey[] = item.mode === "desktop_mobile" ? ["desktop", "mobile"] : ["desktop"];
    try {
      const capture = await captureScreenshots(url, devices);

      // Find or create the project's `website_screenshot` portfolio item.
      const { data: existing } = await admin
        .from("project_portfolio_items")
        .select("id, data")
        .eq("project_id", item.project_id)
        .eq("type", "website_screenshot")
        .order("sort")
        .limit(1);

      const itemData = (existing?.[0]?.data ?? {}) as Record<string, unknown>;
      const desktopUrl = capture.images.desktop ?? undefined;
      const mobileUrl = capture.images.mobile ?? undefined;

      if (existing?.[0]) {
        await admin
          .from("project_portfolio_items")
          .update({
            ...(desktopUrl ? { url: desktopUrl } : {}),
            data: {
              ...itemData,
              ...(mobileUrl ? { mobile_screenshot: mobileUrl, enable_mobile: true } : {}),
            },
          })
          .eq("id", existing[0].id);
      } else if (desktopUrl) {
        await admin.from("project_portfolio_items").insert({
          project_id: item.project_id,
          type: "website_screenshot",
          url: desktopUrl,
          is_visible: true,
          data: mobileUrl ? { mobile_screenshot: mobileUrl, enable_mobile: true } : {},
        });
      }

      const hasError = Object.keys(capture.errors ?? {}).length > 0;
      results.push({
        project_id: item.project_id,
        status: hasError && !desktopUrl && !mobileUrl ? "error" : "success",
        ...(hasError && !desktopUrl && !mobileUrl ? { error: Object.values(capture.errors!)[0] } : {}),
      });
    } catch (e) {
      results.push({
        project_id: item.project_id,
        status: "error",
        error: e instanceof Error ? e.message : "فشل الالتقاط",
      });
    }
  }

  await Promise.all(
    workers.map(async () => {
      while (queue.length) {
        const item = queue.shift()!;
        await process(item);
      }
    }),
  );

  return NextResponse.json({ results });
}
