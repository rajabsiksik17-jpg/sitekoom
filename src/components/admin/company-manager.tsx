"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { VideoUpload } from "@/components/admin/video-upload";
import { IconPicker } from "@/components/admin/icon-picker";
import { Icon } from "@/components/icon";
import type { CompanyInfo, CompanyImage } from "@/lib/types";

export function CompanyManager() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [gallery, setGallery] = useState<CompanyImage[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [i, g] = await Promise.all([
      supabase.from("company_info").select("*").eq("id", 1).single(),
      supabase.from("company_images").select("*").order("sort"),
    ]);
    if (i.data) setInfo(i.data as CompanyInfo);
    setGallery((g.data ?? []) as CompanyImage[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: unknown) {
    setInfo((prev) => ({ ...(prev as CompanyInfo), [field]: value }));
  }

  function addWhy() {
    setInfo((prev) => ({
      ...(prev as CompanyInfo),
      why_ar: [...(prev?.why_ar ?? []), { icon: "sparkles", title: "", description: "" }],
      why_en: [...(prev?.why_en ?? []), { icon: "sparkles", title: "", description: "" }],
    }));
  }

  function updateWhy(i: number, patch: { icon?: string; title_ar?: string; title_en?: string; description_ar?: string; description_en?: string }) {
    setInfo((prev) => {
      const ar = [...(prev?.why_ar ?? [])];
      const en = [...(prev?.why_en ?? [])];
      const curAr = ar[i] ?? { icon: "sparkles", title: "", description: "" };
      const curEn = en[i] ?? { icon: "sparkles", title: "", description: "" };
      ar[i] = {
        icon: patch.icon ?? curAr.icon,
        title: patch.title_ar ?? curAr.title,
        description: patch.description_ar ?? curAr.description,
      };
      en[i] = {
        icon: patch.icon ?? curEn.icon,
        title: patch.title_en ?? curEn.title,
        description: patch.description_en ?? curEn.description,
      };
      return { ...(prev as CompanyInfo), why_ar: ar, why_en: en };
    });
  }

  function removeWhy(i: number) {
    setInfo((prev) => ({
      ...(prev as CompanyInfo),
      why_ar: (prev?.why_ar ?? []).filter((_, j) => j !== i),
      why_en: (prev?.why_en ?? []).filter((_, j) => j !== i),
    }));
  }

  function setValueTitle(i: number, lang: "ar" | "en", value: string) {
    const field = lang === "ar" ? "values_ar" : "values_en";
    setInfo((prev) => {
      const arr = [...((prev?.[field] as string[] | undefined) ?? [])];
      arr[i] = value;
      return { ...(prev as CompanyInfo), [field]: arr };
    });
  }

  function setValueMeta(i: number, patch: Partial<{ icon: string; desc_ar: string; desc_en: string }>) {
    setInfo((prev) => {
      const meta = [...((prev?.values_meta ?? []) as { icon: string; desc_ar: string; desc_en: string }[])];
      const cur = meta[i] ?? { icon: "check-circle", desc_ar: "", desc_en: "" };
      meta[i] = { icon: patch.icon ?? cur.icon, desc_ar: patch.desc_ar ?? cur.desc_ar, desc_en: patch.desc_en ?? cur.desc_en };
      return { ...(prev as CompanyInfo), values_meta: meta };
    });
  }

  function addValue() {
    setInfo((prev) => {
      const ar = [...((prev?.values_ar as string[] | undefined) ?? []), ""];
      const en = [...((prev?.values_en as string[] | undefined) ?? []), ""];
      const meta = [...((prev?.values_meta ?? []) as { icon: string; desc_ar: string; desc_en: string }[]), { icon: "check-circle", desc_ar: "", desc_en: "" }];
      return { ...(prev as CompanyInfo), values_ar: ar, values_en: en, values_meta: meta };
    });
  }

  function removeValue(i: number) {
    setInfo((prev) => ({
      ...(prev as CompanyInfo),
      values_ar: (prev?.values_ar ?? []).filter((_, j) => j !== i),
      values_en: (prev?.values_en ?? []).filter((_, j) => j !== i),
      values_meta: ((prev?.values_meta ?? []) as { icon: string; desc_ar: string; desc_en: string }[]).filter((_, j) => j !== i),
    }));
  }

  async function save() {
    if (!info) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("company_info").upsert(info);
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ بيانات الشركة");
  }

  async function addImage(url: string) {
    const supabase = createClient();
    await supabase.from("company_images").insert({ url, kind: "image", sort: gallery.length });
    load();
  }

  async function addVideo(url: string) {
    const supabase = createClient();
    await supabase.from("company_images").insert({ url, kind: "video", sort: gallery.length });
    load();
  }

  async function removeImage(id: string) {
    const supabase = createClient();
    await supabase.from("company_images").delete().eq("id", id);
    load();
  }

  if (loading || !info) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <PageTitle title="بيانات الشركة" description="تعديل محتوى صفحة من نحن."
        action={<button type="button" onClick={save} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>} />

      <div className="card space-y-6 p-6">
        <Bilingual label="نبذة عن الشركة" ar={info.about_ar ?? ""} en={info.about_en ?? ""} onAr={(v) => update("about_ar", v)} onEn={(v) => update("about_en", v)} type="textarea" />
        <Bilingual label="رسالتنا" ar={info.mission_ar ?? ""} en={info.mission_en ?? ""} onAr={(v) => update("mission_ar", v)} onEn={(v) => update("mission_en", v)} type="textarea" />
        <Bilingual label="رؤيتنا" ar={info.vision_ar ?? ""} en={info.vision_en ?? ""} onAr={(v) => update("vision_ar", v)} onEn={(v) => update("vision_en", v)} type="textarea" />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold text-ink-900">قيمنا</p>
            <button type="button" onClick={addValue} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة قيمة</button>
          </div>
          {(info.values_ar ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد قيم بعد.</p>
          ) : (
            <div className="space-y-3">
              {(info.values_ar ?? []).map((v, i) => {
                const meta = ((info.values_meta ?? []) as { icon: string; desc_ar: string; desc_en: string }[])[i] ?? { icon: "check-circle", desc_ar: "", desc_en: "" };
                const enVal = (info.values_en ?? [])[i] ?? "";
                return (
                  <div key={i} className="rounded-xl border border-brand-100 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <Icon name={meta.icon} className="h-5 w-5 text-brand-600" /> قيمة {i + 1}
                      </span>
                      <button type="button" onClick={() => removeValue(i)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="grid gap-3">
                      <Field label="الأيقونة"><IconPicker value={meta.icon} onChange={(name) => setValueMeta(i, { icon: name })} /></Field>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input className="input" placeholder="الاسم (عربي)" value={v} onChange={(e) => setValueTitle(i, "ar", e.target.value)} />
                        <input className="input" dir="ltr" placeholder="Name (EN)" value={enVal} onChange={(e) => setValueTitle(i, "en", e.target.value)} />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input className="input" placeholder="الوصف (عربي)" value={meta.desc_ar} onChange={(e) => setValueMeta(i, { desc_ar: e.target.value })} />
                        <input className="input" dir="ltr" placeholder="Description (EN)" value={meta.desc_en} onChange={(e) => setValueMeta(i, { desc_en: e.target.value })} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Field label="فيديو الشركة (يظهر في الصفحة الرئيسية)" hint="ارفع فيديو MP4/WebM ليظهر بجانب بيانات الشركة">
          <VideoUpload value={info.video_url ?? ""} onChange={(url) => update("video_url", url)} folder="company" />
        </Field>
        <Bilingual label="عنوان قسم الفيديو" ar={info.video_title_ar ?? ""} en={info.video_title_en ?? ""} onAr={(v) => update("video_title_ar", v)} onEn={(v) => update("video_title_en", v)} />
        <Bilingual label="نص تعريفي قصير أسفل العنوان" ar={info.video_intro_ar ?? ""} en={info.video_intro_en ?? ""} onAr={(v) => update("video_intro_ar", v)} onEn={(v) => update("video_intro_en", v)} type="textarea" />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">لماذا تختار Sitekoom (مميزات)</h2>
          <button type="button" onClick={addWhy} className="btn-secondary px-4 py-2 text-sm"><Plus className="h-4 w-4" /> إضافة ميزة</button>
        </div>
        {(info.why_ar ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">لا توجد ميزات بعد.</p>
        ) : (
          <div className="space-y-4">
            {(info.why_ar ?? []).map((w, i) => {
              const enItem = (info.why_en ?? [])[i] ?? { icon: w.icon, title: "", description: "" };
              return (
                <div key={i} className="rounded-xl border border-brand-100 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                      <Icon name={w.icon} className="h-5 w-5 text-brand-600" /> ميزة {i + 1}
                    </span>
                    <button type="button" onClick={() => removeWhy(i)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="grid gap-3">
                    <Field label="الأيقونة"><IconPicker value={w.icon} onChange={(name) => updateWhy(i, { icon: name })} /></Field>
                    <Bilingual label="العنوان" ar={w.title} en={enItem.title} onAr={(v) => updateWhy(i, { title_ar: v })} onEn={(v) => updateWhy(i, { title_en: v })} />
                    <Bilingual label="الوصف" ar={w.description} en={enItem.description} onAr={(v) => updateWhy(i, { description_ar: v })} onEn={(v) => updateWhy(i, { description_en: v })} type="textarea" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-ink-900">معرض الشركة</h2>
        <div className="flex flex-wrap gap-3">
          {gallery.map((img) => (
            <div key={img.id} className="relative">
              {img.kind === "video" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <video src={img.url} className="h-24 w-32 rounded-lg border border-brand-100 bg-black object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt={img.alt ?? ""} className="h-24 w-32 rounded-lg border border-brand-100 object-cover" />
              )}
              <button type="button" onClick={() => removeImage(img.id)} className="absolute -end-1 -top-1 rounded-full bg-red-500 p-1 text-white"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          <div className="h-24 w-32">
            <ImageUpload value="" onChange={(url) => addImage(url)} folder="company" />
          </div>
          <div className="h-24 w-32">
            <VideoUpload value="" onChange={(url) => addVideo(url)} folder="company" />
          </div>
        </div>
      </div>
    </div>
  );
}
