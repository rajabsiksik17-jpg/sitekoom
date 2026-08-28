import "server-only";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>;

export const MEDIA_COLUMNS: { table: string; column: string }[] = [
  { table: "services", column: "main_image" },
  { table: "projects", column: "thumbnail" },
  { table: "projects", column: "cover_image" },
  { table: "homepage_sliders", column: "background_image" },
  { table: "homepage_sliders", column: "mobile_image" },
  { table: "company_info", column: "video_url" },
  { table: "team_members", column: "photo" },
  { table: "articles", column: "cover_image" },
  { table: "seo_metadata", column: "og_image" },
  { table: "offers", column: "main_image" },
  { table: "achievements", column: "main_image" },
  { table: "achievements", column: "video_url" },
  { table: "page_hero_settings", column: "background_image" },
  { table: "page_hero_settings", column: "background_gif" },
  { table: "page_hero_settings", column: "mobile_image" },
  { table: "service_categories", column: "og_image" },
];

export function extractStoragePath(url: string): string | null {
  const idx = url.indexOf("/object/public/");
  if (idx === -1) return null;
  const path = url.slice(idx + "/object/public/".length);
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Build a map of url -> list of "table.column" labels that reference it. */
export async function buildMediaUsage(admin: AdminClient, urls: string[]): Promise<Record<string, string[]>> {
  const urlSet = new Set(urls);
  const usage: Record<string, string[]> = {};
  for (const { table, column } of MEDIA_COLUMNS) {
    const { data } = await admin
      .from(table)
      .select(`id, ${column}` as never)
      .not(column, "is", null);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const val = row[column];
      if (typeof val === "string" && urlSet.has(val)) {
        (usage[val] ??= []).push(`${table}.${column}`);
      }
    }
  }

  // site_settings JSONB may store logos / OG images / favicon.
  const { data: settingsRows } = await admin.from("site_settings").select("key, value").not("value", "is", null);
  for (const row of (settingsRows ?? []) as { key: string; value: unknown }[]) {
    const text = JSON.stringify(row.value ?? {});
    for (const url of urls) {
      if (text.includes(url)) (usage[url] ??= []).push(`site_settings.${row.key}`);
    }
  }

  return usage;
}

/** Rewrite every reference of `fromUrl` to point at `toUrl`. */
export async function rewriteMediaReferences(admin: AdminClient, fromUrl: string, toUrl: string): Promise<number> {
  let changed = 0;
  for (const { table, column } of MEDIA_COLUMNS) {
    const { error } = await admin.from(table).update({ [column]: toUrl }).eq(column, fromUrl);
    if (!error) changed++;
  }

  const { data: settingsRows } = await admin.from("site_settings").select("key, value");
  for (const row of (settingsRows ?? []) as { key: string; value: unknown }[]) {
    const text = JSON.stringify(row.value ?? {});
    if (text.includes(fromUrl)) {
      const replaced = JSON.parse(text.split(fromUrl).join(toUrl));
      await admin.from("site_settings").update({ value: replaced }).eq("key", row.key);
      changed++;
    }
  }
  return changed;
}
