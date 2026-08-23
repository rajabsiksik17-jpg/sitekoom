"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { IconPicker } from "@/components/admin/icon-picker";
import { Icon } from "@/components/icon";
import { RichText } from "@/components/admin/rich-text";
import { SeoFields } from "@/components/admin/seo-fields";
import { Spinner } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import { PORTFOLIO_FIELD_TYPES } from "@/lib/portfolio";
import type { Service, ServiceCategory } from "@/lib/types";

type Detail = { kind: string; icon: string; title_ar: string; title_en: string; description_ar: string; description_en: string };
type Faq = { question_ar: string; question_en: string; answer_ar: string; answer_en: string };

const kindLabels: Record<string, string> = { feature: "ميزة", benefit: "فائدة", process: "مرحلة", technology: "تقنية" };
const emptyDetail: Detail = { kind: "feature", icon: "", title_ar: "", title_en: "", description_ar: "", description_en: "" };
const emptyFaq: Faq = { question_ar: "", question_en: "", answer_ar: "", answer_en: "" };

export function ServiceForm({ serviceId }: { serviceId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!serviceId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title_ar: "", title_en: "", slug: "", icon: "sparkles",
    short_desc_ar: "", short_desc_en: "", full_desc_ar: "", full_desc_en: "",
    main_image: "", status: "published" as "draft" | "published" | "archived", is_featured: false,
    category_id: "",
    portfolio_config: [] as string[],
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [details, setDetails] = useState<Detail[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [descTab, setDescTab] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("service_categories").select("id,name_ar,name_en").order("sort").then(({ data }) => {
      setCategories((data ?? []) as ServiceCategory[]);
    });
    if (!serviceId) return;
    Promise.all([
      supabase.from("services").select("*").eq("id", serviceId).single(),
      supabase.from("service_features").select("*").eq("service_id", serviceId).order("sort"),
      supabase.from("service_faqs").select("*").eq("service_id", serviceId).order("sort"),
      supabase.from("service_images").select("*").eq("service_id", serviceId).order("sort"),
    ]).then(([s, f, q, imgs]) => {
      if (s.data) {
        const d = s.data as Service;
        setForm({
          title_ar: d.title_ar, title_en: d.title_en, slug: d.slug, icon: d.icon ?? "sparkles",
          short_desc_ar: d.short_desc_ar ?? "", short_desc_en: d.short_desc_en ?? "",
          full_desc_ar: d.full_desc_ar ?? "", full_desc_en: d.full_desc_en ?? "",
          main_image: d.main_image ?? "", status: d.status, is_featured: d.is_featured,
          category_id: d.category_id ?? "",
          portfolio_config: d.portfolio_config ?? [],
        });
      }
      setDetails((f.data ?? []).map((x) => ({ kind: x.kind, icon: x.icon ?? "", title_ar: x.title_ar, title_en: x.title_en, description_ar: x.description_ar ?? "", description_en: x.description_en ?? "" })));
      setFaqs((q.data ?? []).map((x) => ({ question_ar: x.question_ar, question_en: x.question_en, answer_ar: x.answer_ar, answer_en: x.answer_en })));
      setGallery((imgs.data ?? []).map((i) => i.url));
      setLoading(false);
    });
  }, [serviceId]);

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function togglePortfolio(key: string) {
    setForm((f) => {
      const current = f.portfolio_config ?? [];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      return { ...f, portfolio_config: next };
    });
  }

  async function handleSave() {
    if (!form.title_ar.trim() || !form.title_en.trim()) return push("error", "أدخل العنوان بالعربية والإنجليزية");
    if (!form.slug.trim()) return push("error", "أدخل Slug");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      slug: slugify(form.slug),
      category_id: form.category_id || null,
      portfolio_config: form.portfolio_config ?? [],
      short_desc_ar: form.short_desc_ar || null,
      short_desc_en: form.short_desc_en || null,
      full_desc_ar: form.full_desc_ar || null,
      full_desc_en: form.full_desc_en || null,
      main_image: form.main_image || null,
    };

    let id = serviceId;
    if (isEdit) {
      const { error } = await supabase.from("services").update(payload).eq("id", id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { data, error } = await supabase.from("services").insert(payload).select().single();
      if (error) { setSaving(false); return push("error", error.message); }
      id = (data as Service).id;
    }

    await supabase.from("service_features").delete().eq("service_id", id);
    if (details.length) {
      await supabase.from("service_features").insert(details.map((d, i) => ({
        service_id: id, kind: d.kind, icon: d.icon || null,
        title_ar: d.title_ar, title_en: d.title_en,
        description_ar: d.description_ar || null, description_en: d.description_en || null, sort: i,
      })));
    }
    await supabase.from("service_faqs").delete().eq("service_id", id);
    if (faqs.length) {
      await supabase.from("service_faqs").insert(faqs.map((f, i) => ({
        service_id: id, question_ar: f.question_ar, question_en: f.question_en,
        answer_ar: f.answer_ar, answer_en: f.answer_en, sort: i,
      })));
    }
    await supabase.from("service_images").delete().eq("service_id", id);
    if (gallery.length) {
      await supabase.from("service_images").insert(gallery.map((url, i) => ({ service_id: id, url, is_primary: i === 0, sort: i })));
    }

    setSaving(false);
    push("success", "تم حفظ الخدمة بنجاح");
    router.push("/admin/services");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/services" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>

      <div className="card space-y-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">المعلومات الأساسية</h2>
        <Bilingual label="العنوان" required ar={form.title_ar} en={form.title_en} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug">
            <input className="input" dir="ltr" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
          </Field>
          <Field label="التصنيف الرئيسي">
            <select className="input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">— بدون تصنيف —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </select>
          </Field>
        </div>

        <Field label="الأيقونة">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Icon name={form.icon} className="h-6 w-6" />
            </span>
            <span className="text-sm text-gray-500" dir="ltr">{form.icon || "sparkles"}</span>
          </div>
          <IconPicker value={form.icon} onChange={(v) => update("icon", v)} />
        </Field>
        <Bilingual label="وصف مختصر" ar={form.short_desc_ar} en={form.short_desc_en} onAr={(v) => update("short_desc_ar", v)} onEn={(v) => update("short_desc_en", v)} type="textarea" />

        <div>
          <div className="mb-2 flex gap-2">
            {(["ar", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setDescTab(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${descTab === l ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
                {l === "ar" ? "الوصف (عربي)" : "Description (EN)"}
              </button>
            ))}
          </div>
          {descTab === "ar"
            ? <RichText value={form.full_desc_ar} onChange={(h) => update("full_desc_ar", h)} />
            : <RichText value={form.full_desc_en} onChange={(h) => update("full_desc_en", h)} />}
        </div>

        <Field label="الصورة الرئيسية">
          <ImageUpload value={form.main_image} onChange={(url) => update("main_image", url)} folder="services" />
        </Field>

        <Field label="معرض الصور">
          <div className="flex flex-wrap gap-3">
            {gallery.map((url, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-28 rounded-lg border border-brand-100 object-cover" />
                <button type="button" onClick={() => setGallery((g) => g.filter((_, j) => j !== i))} className="absolute -end-1 -top-1 rounded-full bg-red-500 p-1 text-white"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setGallery((g) => [...g, ""])} className="flex h-20 w-28 items-center justify-center rounded-lg border-2 border-dashed border-brand-200 text-brand-500 hover:bg-brand-50"><Plus className="h-5 w-5" /></button>
          </div>
          {gallery.map((url, i) => url === "" && (
            <ImageUpload key={i} value="" onChange={(u) => setGallery((g) => g.map((x, j) => (j === i ? u : x)))} folder="services" />
          ))}
        </Field>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded border-brand-200 text-brand-600" />
          خدمة مميزة (تظهر في الرئيسية)
        </label>
      </div>

      <div className="card p-6">
        <h2 className="mb-1 text-lg font-bold text-ink-900">إعدادات الأعمال Portfolio</h2>
        <p className="mb-4 text-sm text-gray-500">حدد أنواع المحتوى والمرفقات التي ستظهر عند إضافة عمل لهذه الخدمة.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {PORTFOLIO_FIELD_TYPES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-gray-700 hover:border-brand-300">
              <input
                type="checkbox"
                checked={(form.portfolio_config ?? []).includes(t.key)}
                onChange={() => togglePortfolio(t.key)}
                className="rounded border-brand-200 text-brand-600"
              />
              {t.labelAr}
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-ink-900">التفاصيل (ميزات / فوائد / مراحل / تقنيات)</h2>
        <div className="space-y-3">
          {details.map((d, i) => (
            <div key={i} className="rounded-xl border border-brand-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <select className="input w-40" value={d.kind} onChange={(e) => setDetails((prev) => prev.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))}>
                  {Object.entries(kindLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button type="button" onClick={() => setDetails((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" placeholder="العنوان (عربي)" value={d.title_ar} onChange={(e) => setDetails((prev) => prev.map((x, j) => (j === i ? { ...x, title_ar: e.target.value } : x)))} />
                <input className="input" dir="ltr" placeholder="Title (EN)" value={d.title_en} onChange={(e) => setDetails((prev) => prev.map((x, j) => (j === i ? { ...x, title_en: e.target.value } : x)))} />
              </div>
              <input className="input mt-2" dir="ltr" placeholder="icon" value={d.icon} onChange={(e) => setDetails((prev) => prev.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))} />
              <textarea className="input mt-2 min-h-[50px]" placeholder="الوصف (عربي)" value={d.description_ar} onChange={(e) => setDetails((prev) => prev.map((x, j) => (j === i ? { ...x, description_ar: e.target.value } : x)))} />
              <textarea className="input mt-2 min-h-[50px]" dir="ltr" placeholder="Description (EN)" value={d.description_en} onChange={(e) => setDetails((prev) => prev.map((x, j) => (j === i ? { ...x, description_en: e.target.value } : x)))} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setDetails((prev) => [...prev, { ...emptyDetail }])} className="btn-secondary mt-3 px-4 py-2 text-sm"><Plus className="h-4 w-4" /> إضافة</button>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-ink-900">الأسئلة الشائعة</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-brand-100 p-4">
              <div className="mb-2 flex justify-end">
                <button type="button" onClick={() => setFaqs((prev) => prev.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input" placeholder="السؤال (عربي)" value={f.question_ar} onChange={(e) => setFaqs((prev) => prev.map((x, j) => (j === i ? { ...x, question_ar: e.target.value } : x)))} />
                <input className="input" dir="ltr" placeholder="Question (EN)" value={f.question_en} onChange={(e) => setFaqs((prev) => prev.map((x, j) => (j === i ? { ...x, question_en: e.target.value } : x)))} />
              </div>
              <textarea className="input mt-2 min-h-[50px]" placeholder="الإجابة (عربي)" value={f.answer_ar} onChange={(e) => setFaqs((prev) => prev.map((x, j) => (j === i ? { ...x, answer_ar: e.target.value } : x)))} />
              <textarea className="input mt-2 min-h-[50px]" dir="ltr" placeholder="Answer (EN)" value={f.answer_en} onChange={(e) => setFaqs((prev) => prev.map((x, j) => (j === i ? { ...x, answer_en: e.target.value } : x)))} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setFaqs((prev) => [...prev, { ...emptyFaq }])} className="btn-secondary mt-3 px-4 py-2 text-sm"><Plus className="h-4 w-4" /> إضافة</button>
      </div>

      {isEdit && serviceId && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-ink-900">SEO</h2>
          <SeoFields entityType="service" entityId={serviceId} />
        </div>
      )}
    </div>
  );
}
