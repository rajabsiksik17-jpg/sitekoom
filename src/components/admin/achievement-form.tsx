"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { SeoFields } from "@/components/admin/seo-fields";
import { Spinner } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import type { Achievement, Service } from "@/lib/types";

export function AchievementForm({ achievementId }: { achievementId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!achievementId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState({
    title_ar: "", title_en: "", slug: "", main_image: "", short_desc_ar: "", short_desc_en: "",
    full_desc_ar: "", full_desc_en: "", type: "", category: "", date: "",
    website_url: "", project_url: "", external_url: "", iframe_url: "", demo_url: "",
    display_website: false, video_url: "", challenge_ar: "", challenge_en: "", solution_ar: "", solution_en: "",
    results_ar: "", results_en: "", technologies: "", service_ids: [] as string[],
    status_field: "draft" as string, is_featured: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.from("services").select("id,title_ar,title_en").eq("status", "published").is("deleted_at", null).order("sort").then(({ data }) => setServices((data ?? []) as Service[]));
    if (!achievementId) return;
    supabase.from("achievements").select("*").eq("id", achievementId).single().then(({ data }) => {
      if (data) {
        const d = data as Achievement;
        setForm({
          title_ar: d.title_ar, title_en: d.title_en, slug: d.slug, main_image: d.main_image ?? "",
          short_desc_ar: d.short_desc_ar ?? "", short_desc_en: d.short_desc_en ?? "",
          full_desc_ar: d.full_desc_ar ?? "", full_desc_en: d.full_desc_en ?? "",
          type: d.type ?? "", category: d.category ?? "", date: d.date ?? "",
          website_url: d.website_url ?? "", project_url: d.project_url ?? "", external_url: d.external_url ?? "",
          iframe_url: d.iframe_url ?? "", demo_url: d.demo_url ?? "", display_website: d.display_website,
          video_url: d.video_url ?? "", challenge_ar: d.challenge_ar ?? "", challenge_en: d.challenge_en ?? "",
          solution_ar: d.solution_ar ?? "", solution_en: d.solution_en ?? "",
          results_ar: d.results_ar ?? "", results_en: d.results_en ?? "",
          technologies: (d.technologies ?? []).join(", "), service_ids: d.service_ids ?? [],
          status_field: d.status_field, is_featured: d.is_featured,
        });
      }
      setLoading(false);
    });
  }, [achievementId]);

  function update(field: string, value: unknown) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSave() {
    if (!form.title_ar.trim() || !form.title_en.trim()) return push("error", "أدخل العنوان");
    if (!form.slug.trim()) return push("error", "أدخل Slug");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title_ar: form.title_ar, title_en: form.title_en, slug: slugify(form.slug),
      main_image: form.main_image || null, short_desc_ar: form.short_desc_ar || null, short_desc_en: form.short_desc_en || null,
      full_desc_ar: form.full_desc_ar || null, full_desc_en: form.full_desc_en || null,
      type: form.type || null, category: form.category || null, date: form.date || null,
      website_url: form.website_url || null, project_url: form.project_url || null, external_url: form.external_url || null,
      iframe_url: form.iframe_url || null, demo_url: form.demo_url || null, display_website: form.display_website,
      video_url: form.video_url || null, challenge_ar: form.challenge_ar || null, challenge_en: form.challenge_en || null,
      solution_ar: form.solution_ar || null, solution_en: form.solution_en || null,
      results_ar: form.results_ar || null, results_en: form.results_en || null,
      technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      service_ids: form.service_ids, status_field: form.status_field, is_featured: form.is_featured,
    };
    let id = achievementId;
    if (isEdit) {
      const { error } = await supabase.from("achievements").update(payload).eq("id", id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { data, error } = await supabase.from("achievements").insert(payload).select().single();
      if (error) { setSaving(false); return push("error", error.message); }
      id = data.id;
    }
    setSaving(false);
    push("success", "تم حفظ الإنجاز");
    router.push("/admin/achievements");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/achievements" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>
      </div>

      <div className="card space-y-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">المعلومات الأساسية</h2>
        <Bilingual label="العنوان" required ar={form.title_ar} en={form.title_en} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Slug"><input className="input" dir="ltr" value={form.slug} onChange={(e) => update("slug", e.target.value)} /></Field>
          <Field label="النوع"><input className="input" value={form.type} onChange={(e) => update("type", e.target.value)} /></Field>
          <Field label="التصنيف"><input className="input" value={form.category} onChange={(e) => update("category", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="تاريخ الإنجاز"><input type="date" className="input" value={form.date} onChange={(e) => update("date", e.target.value)} /></Field>
          <Field label="حالة النشر">
            <select className="input" value={form.status_field} onChange={(e) => update("status_field", e.target.value)}>
              <option value="draft">مسودة</option><option value="published">منشور</option><option value="archived">مؤرشف</option>
            </select>
          </Field>
          <Field label="التقنيات (مفصولة بفواصل)"><input className="input" dir="ltr" value={form.technologies} onChange={(e) => update("technologies", e.target.value)} /></Field>
        </div>
        <Field label="الصورة الرئيسية"><ImageUpload value={form.main_image} onChange={(u) => update("main_image", u)} folder="achievements" /></Field>
        <Bilingual label="وصف مختصر" ar={form.short_desc_ar} en={form.short_desc_en} onAr={(v) => update("short_desc_ar", v)} onEn={(v) => update("short_desc_en", v)} type="textarea" />
        <Bilingual label="وصف كامل" ar={form.full_desc_ar} en={form.full_desc_en} onAr={(v) => update("full_desc_ar", v)} onEn={(v) => update("full_desc_en", v)} type="textarea" />
        <Bilingual label="التحدي" ar={form.challenge_ar} en={form.challenge_en} onAr={(v) => update("challenge_ar", v)} onEn={(v) => update("challenge_en", v)} type="textarea" />
        <Bilingual label="الحل" ar={form.solution_ar} en={form.solution_en} onAr={(v) => update("solution_ar", v)} onEn={(v) => update("solution_en", v)} type="textarea" />
        <Bilingual label="النتائج" ar={form.results_ar} en={form.results_en} onAr={(v) => update("results_ar", v)} onEn={(v) => update("results_en", v)} type="textarea" />
        <Field label="الخدمات المرتبطة">
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 rounded-lg border border-brand-100 px-3 py-1.5 text-sm">
                <input type="checkbox" checked={form.service_ids.includes(s.id)} onChange={(e) => update("service_ids", e.target.checked ? [...form.service_ids, s.id] : form.service_ids.filter((x) => x !== s.id))} className="rounded border-brand-200 text-brand-600" />
                {s.title_ar}
              </label>
            ))}
          </div>
        </Field>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink-900">الروابط والمعاينة</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رابط الموقع"><input className="input" dir="ltr" value={form.website_url} onChange={(e) => update("website_url", e.target.value)} /></Field>
          <Field label="رابط المشروع"><input className="input" dir="ltr" value={form.project_url} onChange={(e) => update("project_url", e.target.value)} /></Field>
          <Field label="رابط خارجي"><input className="input" dir="ltr" value={form.external_url} onChange={(e) => update("external_url", e.target.value)} /></Field>
          <Field label="فيديو"><input className="input" dir="ltr" value={form.video_url} onChange={(e) => update("video_url", e.target.value)} /></Field>
          <Field label="Iframe URL"><input className="input" dir="ltr" value={form.iframe_url} onChange={(e) => update("iframe_url", e.target.value)} /></Field>
          <Field label="Demo URL"><input className="input" dir="ltr" value={form.demo_url} onChange={(e) => update("demo_url", e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.display_website} onChange={(e) => update("display_website", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> عرض الموقع داخل الصفحة
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> مميز
        </label>
      </div>

      {isEdit && achievementId && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-ink-900">SEO</h2>
          <SeoFields entityType="achievement" entityId={achievementId} />
        </div>
      )}
    </div>
  );
}
