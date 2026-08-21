"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import type { PageHeroSettings } from "@/lib/types";

const PAGES: { key: string; label: string }[] = [
  { key: "global", label: "عام (جميع الصفحات)" },
  { key: "home", label: "الرئيسية" },
  { key: "about", label: "من نحن" },
  { key: "services", label: "الخدمات" },
  { key: "service", label: "تفاصيل الخدمة" },
  { key: "projects", label: "الأعمال" },
  { key: "project", label: "تفاصيل العمل" },
  { key: "blog", label: "الأخبار" },
  { key: "article", label: "تفاصيل المقال" },
  { key: "contact", label: "اتصل بنا" },
  { key: "request-project", label: "طلب مشروع" },
  { key: "search", label: "البحث" },
  { key: "privacy", label: "سياسة الخصوصية" },
  { key: "terms", label: "الشروط والأحكام" },
];

const empty = (key: string): PageHeroSettings => ({
  id: "",
  page_key: key,
  background_image: "",
  background_gif: "",
  mobile_image: "",
  overlay_color: "#0b0a1a",
  overlay_opacity: 0.72,
  updated_at: "",
});

export function PageHeroManager() {
  const { push } = useToast();
  const [rows, setRows] = useState<Record<string, PageHeroSettings>>({});
  const [selected, setSelected] = useState("global");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("page_hero_settings").select("*");
    const map: Record<string, PageHeroSettings> = {};
    (data ?? []).forEach((r) => (map[r.page_key] = r as PageHeroSettings));
    setRows(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = rows[selected] ?? empty(selected);

  function update(field: string, value: unknown) {
    setRows((prev) => ({ ...prev, [selected]: { ...(prev[selected] ?? empty(selected)), [field]: value } }));
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const row = rows[selected] ?? empty(selected);
    const { error } = await supabase.from("page_hero_settings").upsert(
      {
        page_key: row.page_key,
        background_image: row.background_image || null,
        background_gif: row.background_gif || null,
        mobile_image: row.mobile_image || null,
        overlay_color: row.overlay_color,
        overlay_opacity: Number(row.overlay_opacity),
      },
      { onConflict: "page_key" },
    );
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ خلفية رأس الصفحة");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const opacityPercent = Math.round(Number(current.overlay_opacity ?? 0.72) * 100);

  return (
    <div className="space-y-6">
      <PageTitle
        title="خلفيات رأس الصفحة"
        description="حدد الخلفية العامة وخلفيات مخصصة لكل صفحة. إذا لم تحدد خلفية لصفحة، تُستخدم الخلفية العامة."
        action={
          <button type="button" onClick={save} className="btn-primary px-6 py-2.5" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        }
      />

      <div className="card p-6">
        <Field label="الصفحة">
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {PAGES.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </Field>

        <div className="mt-6 grid gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="صورة الخلفية (Image)" hint="صورة عادية JPG / PNG / WebP">
              <ImageUpload value={current.background_image ?? ""} onChange={(url) => update("background_image", url)} folder="page-hero" />
            </Field>
            <Field label="خلفية متحركة (GIF)" hint="يفضّل حجم صغير للأداء">
              <ImageUpload value={current.background_gif ?? ""} onChange={(url) => update("background_gif", url)} folder="page-hero" />
            </Field>
          </div>

          <Field label="صورة بديلة للهاتف" hint="اختياري — تستخدم على الشاشات الصغيرة إذا كانت الخلفية ثقيلة">
            <ImageUpload value={current.mobile_image ?? ""} onChange={(url) => update("mobile_image", url)} folder="page-hero" />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="لون الـ Overlay">
              <input
                type="color"
                className="h-12 w-full cursor-pointer rounded-xl border border-brand-100"
                value={current.overlay_color}
                onChange={(e) => update("overlay_color", e.target.value)}
              />
            </Field>
            <Field label={`شفافية الـ Overlay (${opacityPercent}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                value={opacityPercent}
                onChange={(e) => update("overlay_opacity", Number(e.target.value) / 100)}
                className="mt-4 w-full accent-brand-600"
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
