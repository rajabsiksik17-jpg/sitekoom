"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { Spinner } from "@/components/admin/ui";
import type { SeoMetadata } from "@/lib/types";

const empty = (locale: string): Partial<SeoMetadata> => ({
  entity_type: "",
  entity_id: null,
  locale,
  seo_title: "",
  meta_description: "",
  focus_keyword: "",
  keywords: [],
  canonical_url: "",
  og_title: "",
  og_description: "",
  og_image: "",
  twitter_card: "summary_large_image",
  robots: "",
});

const STATIC_SENTINEL = "00000000-0000-0000-0000-000000000000";

export function SeoFields({ entityType, entityId }: { entityType: string; entityId?: string | null }) {
  const { push } = useToast();
  const [tab, setTab] = useState<"ar" | "en">("ar");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, Partial<SeoMetadata>>>({ ar: empty("ar"), en: empty("en") });
  const [saving, setSaving] = useState(false);

  const resolvedId = entityId ?? STATIC_SENTINEL;

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("seo_metadata")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", resolvedId)
      .then(({ data }) => {
        const map: Record<string, Partial<SeoMetadata>> = { ar: empty("ar"), en: empty("en") };
        (data ?? []).forEach((r) => {
          map[r.locale] = r as SeoMetadata;
        });
        setRows(map);
        setLoading(false);
      });
  }, [entityType, resolvedId]);

  const row = rows[tab];

  function update(field: string, value: unknown) {
    setRows((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const payload = { ...rows[tab], entity_type: entityType, entity_id: resolvedId, locale: tab };
    const { error } = await supabase.from("seo_metadata").upsert(payload, { onConflict: "entity_type,entity_id,locale" });
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ إعدادات SEO");
  }

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["ar", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === l ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}
          >
            {l === "ar" ? "العربية" : "English"}
          </button>
        ))}
      </div>

      <Field label="SEO Title">
        <input className="input" value={row.seo_title ?? ""} onChange={(e) => update("seo_title", e.target.value)} />
      </Field>
      <Field label="Meta Description">
        <textarea className="input min-h-[80px]" value={row.meta_description ?? ""} onChange={(e) => update("meta_description", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Focus Keyword">
          <input className="input" value={row.focus_keyword ?? ""} onChange={(e) => update("focus_keyword", e.target.value)} />
        </Field>
        <Field label="Keywords (مفصولة بفواصل)">
          <input
            className="input"
            value={(row.keywords ?? []).join(", ")}
            onChange={(e) => update("keywords", e.target.value.split(",").map((k) => k.trim()).filter(Boolean))}
          />
        </Field>
      </div>
      <Field label="Canonical URL">
        <input className="input" dir="ltr" value={row.canonical_url ?? ""} onChange={(e) => update("canonical_url", e.target.value)} />
      </Field>
      <Field label="Robots">
        <input className="input" dir="ltr" placeholder="index, follow" value={row.robots ?? ""} onChange={(e) => update("robots", e.target.value)} />
      </Field>

      <div className="rounded-xl border border-brand-100 p-4">
        <p className="mb-3 text-sm font-semibold text-ink-900">Open Graph</p>
        <div className="space-y-4">
          <Field label="OG Title">
            <input className="input" value={row.og_title ?? ""} onChange={(e) => update("og_title", e.target.value)} />
          </Field>
          <Field label="OG Description">
            <textarea className="input min-h-[60px]" value={row.og_description ?? ""} onChange={(e) => update("og_description", e.target.value)} />
          </Field>
          <Field label="OG Image">
            <ImageUpload value={row.og_image ?? ""} onChange={(url) => update("og_image", url)} folder="seo" />
          </Field>
        </div>
      </div>

      <button type="button" onClick={save} className="btn-primary px-6 py-2.5" disabled={saving}>
        {saving ? "جارٍ الحفظ..." : "حفظ SEO"}
      </button>
    </div>
  );
}
