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
        <Field label="قيمنا (سطر لكل قيمة)" hint="كل سطر يمثل قيمة">
          <textarea className="input min-h-[100px]" value={(info.values_ar ?? []).join("\n")} onChange={(e) => update("values_ar", e.target.value.split("\n"))} />
          <textarea className="input mt-2 min-h-[100px]" dir="ltr" value={(info.values_en ?? []).join("\n")} onChange={(e) => update("values_en", e.target.value.split("\n"))} />
        </Field>
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
