"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState } from "@/components/admin/ui";
import { Bilingual, Field } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import type { HomepageSection, MarqueeMessage } from "@/lib/types";

export function HomepageContentManager() {
  const { push } = useToast();
  const [tab, setTab] = useState<"sections" | "marquee">("sections");
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [marquee, setMarquee] = useState<MarqueeMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [s, m] = await Promise.all([
      supabase.from("homepage_sections").select("*").order("sort"),
      supabase.from("marquee_messages").select("*").order("sort"),
    ]);
    setSections((s.data ?? []) as HomepageSection[]);
    setMarquee((m.data ?? []) as MarqueeMessage[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleSection(item: HomepageSection) {
    const supabase = createClient();
    await supabase.from("homepage_sections").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function updateSection(id: string, field: string, value: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function updateSectionData(id: string, patch: Record<string, unknown>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, data: { ...(s.data ?? {}), ...patch } } : s)));
  }

  async function saveSection(item: HomepageSection) {
    const supabase = createClient();
    const { error } = await supabase.from("homepage_sections").update({
      title_ar: item.title_ar, title_en: item.title_en,
      description_ar: item.description_ar, description_en: item.description_en,
      data: item.data ?? {},
    }).eq("id", item.id);
    if (error) push("error", error.message);
    else push("success", "تم حفظ القسم");
  }

  async function moveSection(item: HomepageSection, dir: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === item.id);
    const target = sections[idx + dir];
    if (!target) return;
    const supabase = createClient();
    await supabase.from("homepage_sections").update({ sort: target.sort }).eq("id", item.id);
    await supabase.from("homepage_sections").update({ sort: item.sort }).eq("id", target.id);
    load();
  }

  async function addMarquee() {
    const supabase = createClient();
    await supabase.from("marquee_messages").insert({ text_ar: "نص جديد", text_en: "New text", is_active: true, sort: marquee.length });
    load();
  }

  async function updateMarquee(id: string, field: string, value: string) {
    setMarquee((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  async function saveMarquee(item: MarqueeMessage) {
    const supabase = createClient();
    await supabase.from("marquee_messages").update({ text_ar: item.text_ar, text_en: item.text_en, is_active: item.is_active }).eq("id", item.id);
    push("success", "تم الحفظ");
  }

  async function toggleMarquee(item: MarqueeMessage) {
    const supabase = createClient();
    await supabase.from("marquee_messages").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function removeMarquee(id: string) {
    const supabase = createClient();
    await supabase.from("marquee_messages").delete().eq("id", id);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="محتوى الرئيسية" description="إدارة أقسام الصفحة الرئيسية والنص المتحرك." />
      <div className="mb-6 flex gap-2">
        {(["sections", "marquee"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
            {t === "sections" ? "الأقسام" : "النص المتحرك"}
          </button>
        ))}
      </div>

      {tab === "sections" ? (
        <div className="space-y-3">
          {sections.map((item, i) => (
            <div key={item.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleSection(item)}><Badge color={item.is_active ? "green" : "gray"}>{item.is_active ? "مفعّل" : "معطّل"}</Badge></button>
                  <span className="font-bold text-ink-900" dir="ltr">{item.key}</span>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveSection(item, -1)} className="rounded p-1 hover:bg-brand-100"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveSection(item, 1)} className="rounded p-1 hover:bg-brand-100"><ChevronDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => saveSection(item)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Save className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="grid gap-3">
                <Bilingual label="العنوان" ar={item.title_ar ?? ""} en={item.title_en ?? ""} onAr={(v) => updateSection(item.id, "title_ar", v)} onEn={(v) => updateSection(item.id, "title_en", v)} />
                <Bilingual label="الوصف" ar={item.description_ar ?? ""} en={item.description_en ?? ""} onAr={(v) => updateSection(item.id, "description_ar", v)} onEn={(v) => updateSection(item.id, "description_en", v)} type="textarea" />
              </div>

              {item.key === "statistics" && (
                <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
                  <p className="mb-3 text-sm font-bold text-ink-900">خلفية القسم (أرقام نفخر بها)</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="نوع الخلفية">
                      <select className="input" value={String(item.data?.bg_type ?? "gradient")} onChange={(e) => updateSectionData(item.id, { bg_type: e.target.value })}>
                        <option value="gradient">Gradient</option>
                        <option value="solid">لون واحد</option>
                        <option value="image">صورة</option>
                      </select>
                    </Field>

                    {String(item.data?.bg_type ?? "gradient") === "solid" && (
                      <Field label="اللون">
                        <input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String(item.data?.bg_color ?? "#7a1aff")} onChange={(e) => updateSectionData(item.id, { bg_color: e.target.value })} />
                      </Field>
                    )}

                    {String(item.data?.bg_type ?? "gradient") === "gradient" && (
                      <>
                        <Field label="اللون 1"><input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String((item.data?.bg_colors as string[] | undefined)?.[0] ?? "#7a1aff")} onChange={(e) => { const c = [...(item.data?.bg_colors as string[] ?? ["#7a1aff", "#9d72ff"])]; c[0] = e.target.value; updateSectionData(item.id, { bg_colors: c }); }} /></Field>
                        <Field label="اللون 2"><input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String((item.data?.bg_colors as string[] | undefined)?.[1] ?? "#9d72ff")} onChange={(e) => { const c = [...(item.data?.bg_colors as string[] ?? ["#7a1aff", "#9d72ff"])]; c[1] = e.target.value; updateSectionData(item.id, { bg_colors: c }); }} /></Field>
                        <Field label="اللون 3 (اختياري)"><input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String((item.data?.bg_colors as string[] | undefined)?.[2] ?? "#bda4ff")} onChange={(e) => { const c = [...(item.data?.bg_colors as string[] ?? ["#7a1aff", "#9d72ff"])]; c[2] = e.target.value; updateSectionData(item.id, { bg_colors: c }); }} /></Field>
                        <Field label="زاوية الـGradient">
                          <input className="input" dir="ltr" type="number" value={Number(item.data?.bg_angle ?? 135)} onChange={(e) => updateSectionData(item.id, { bg_angle: Number(e.target.value) })} />
                        </Field>
                      </>
                    )}

                    {String(item.data?.bg_type ?? "gradient") === "image" && (
                      <>
                        <Field label="صورة الخلفية"><ImageUpload value={String(item.data?.bg_image ?? "")} onChange={(u) => updateSectionData(item.id, { bg_image: u })} folder="homepage" /></Field>
                        <Field label={`شفافية الصورة: ${Number(item.data?.bg_image_opacity ?? 100)}%`}>
                          <input type="range" min={0} max={100} className="w-full" value={Number(item.data?.bg_image_opacity ?? 100)} onChange={(e) => updateSectionData(item.id, { bg_image_opacity: Number(e.target.value) })} />
                        </Field>
                      </>
                    )}

                    <Field label="لون الـOverlay (اختياري)"><input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String(item.data?.bg_overlay_color ?? "#2c036e")} onChange={(e) => updateSectionData(item.id, { bg_overlay_color: e.target.value })} /></Field>
                    <Field label={`شفافية الـOverlay: ${Number(item.data?.bg_overlay_opacity ?? 0)}%`}>
                      <input type="range" min={0} max={100} className="w-full" value={Number(item.data?.bg_overlay_opacity ?? 0)} onChange={(e) => updateSectionData(item.id, { bg_overlay_opacity: Number(e.target.value) })} />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button type="button" onClick={addMarquee} className="btn-secondary px-4 py-2 text-sm"><Plus className="h-4 w-4" /> إضافة عبارة</button>
          {marquee.length === 0 ? (
            <EmptyState title="لا توجد عبارات" />
          ) : (
            marquee.map((item) => (
              <div key={item.id} className="card flex items-center gap-3 p-4">
                <div className="flex-1 space-y-2">
                  <input className="input" value={item.text_ar} onChange={(e) => updateMarquee(item.id, "text_ar", e.target.value)} />
                  <input className="input" dir="ltr" value={item.text_en} onChange={(e) => updateMarquee(item.id, "text_en", e.target.value)} />
                </div>
                <button type="button" onClick={() => toggleMarquee(item)} className="shrink-0"><Badge color={item.is_active ? "green" : "gray"}>{item.is_active ? "مفعّل" : "معطّل"}</Badge></button>
                <button type="button" onClick={() => saveMarquee(item)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Save className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeMarquee(item.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
