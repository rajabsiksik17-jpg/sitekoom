"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { VideoUpload } from "@/components/admin/video-upload";
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
