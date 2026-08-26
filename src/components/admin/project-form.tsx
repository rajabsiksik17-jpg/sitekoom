"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { RichText } from "@/components/admin/rich-text";
import { SeoFields } from "@/components/admin/seo-fields";
import { Spinner } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import { PortfolioEditor, type PortfolioItemDraft } from "@/components/admin/portfolio-editor";
import { ProjectFeaturesEditor, type ProjectFeatureDraft } from "@/components/admin/project-features-editor";
import type { Project, ProjectCategory, Service, ServiceCategory } from "@/lib/types";

export function ProjectForm({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!projectId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemDraft[]>([]);
  const [features, setFeatures] = useState<ProjectFeatureDraft[]>([]);

  const [form, setForm] = useState({
    title_ar: "", title_en: "", slug: "", short_desc_ar: "", short_desc_en: "",
    full_desc_ar: "", full_desc_en: "", service_id: "", category_id: "",
    status: "completed", completion_date: "", thumbnail: "", cover_image: "",
    project_url: "", technologies: "", status_field: "published" as "draft" | "published" | "archived", is_featured: false,
  });
  const [gallery, setGallery] = useState<string[]>([]);
  const [descTab, setDescTab] = useState<"ar" | "en">("ar");

  const selectedService = services.find((s) => s.id === form.service_id);
  const selectedCategory = serviceCategories.find((c) => c.id === selectedService?.category_id);
  const filteredServices = serviceCategoryId ? services.filter((s) => s.category_id === serviceCategoryId) : services;

  // Portfolio settings priority: service override → service category default → none.
  const serviceConfig = selectedService?.portfolio_config ?? [];
  const categoryConfig = selectedCategory?.portfolio_config ?? [];
  const enabledTypes = serviceConfig.length > 0 ? serviceConfig : categoryConfig;
  const portfolioSource = serviceConfig.length > 0 ? "service" : categoryConfig.length > 0 ? "category" : "none";

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("services").select("id,title_ar,title_en,category_id,portfolio_config").order("sort"),
      supabase.from("service_categories").select("id,name_ar,name_en,portfolio_config").order("sort"),
      supabase.from("project_categories").select("*").order("sort"),
    ]).then(([s, sc, c]) => {
      setServices((s.data ?? []) as Service[]);
      setServiceCategories((sc.data ?? []) as ServiceCategory[]);
      setCategories((c.data ?? []) as ProjectCategory[]);

      if (!projectId) return;

      Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("project_images").select("*").eq("project_id", projectId).order("sort"),
        supabase.from("project_portfolio_items").select("*").eq("project_id", projectId).order("sort"),
        supabase.from("project_features").select("*").eq("project_id", projectId).order("sort"),
      ]).then(([p, imgs, ppi, feat]) => {
        if (p.data) {
          const d = p.data as Project;
          setForm({
            title_ar: d.title_ar, title_en: d.title_en, slug: d.slug,
            short_desc_ar: d.short_desc_ar ?? "", short_desc_en: d.short_desc_en ?? "",
            full_desc_ar: d.full_desc_ar ?? "", full_desc_en: d.full_desc_en ?? "",
            service_id: d.service_id ?? "", category_id: d.category_id ?? "",
            status: d.status, completion_date: d.completion_date ?? "",
            thumbnail: d.thumbnail ?? "", cover_image: d.cover_image ?? "",
            project_url: d.project_url ?? "", technologies: (d.technologies ?? []).join(", "),
            status_field: d.status_field, is_featured: d.is_featured,
          });
          const svc = (s.data ?? []).find((x) => (x as Service).id === d.service_id);
          setServiceCategoryId((svc as Service | undefined)?.category_id ?? "");
        }
        setGallery((imgs.data ?? []).map((i) => i.url));
        setPortfolioItems((ppi.data ?? []).map((x) => ({
          type: x.type, title_ar: x.title_ar, title_en: x.title_en,
          description_ar: x.description_ar, description_en: x.description_en,
          caption_ar: x.caption_ar, caption_en: x.caption_en,
          alt_ar: x.alt_ar, alt_en: x.alt_en,
          url: x.url, thumbnail: x.thumbnail, platform: x.platform, icon: x.icon,
          button_text_ar: x.button_text_ar, button_text_en: x.button_text_en,
          button_style: x.button_style, button_action: x.button_action, display_mode: x.display_mode,
          is_visible: x.is_visible, is_featured: x.is_featured, sort: x.sort, data: x.data ?? {},
        })));
        setFeatures((feat.data ?? []).map((f) => ({ icon: f.icon, title_ar: f.title_ar, title_en: f.title_en, description_ar: f.description_ar, description_en: f.description_en, sort: f.sort })));
        setLoading(false);
      });
    });
  }, [projectId]);

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateServiceCategory(categoryId: string) {
    setServiceCategoryId(categoryId);
    setForm((f) => {
      if (!categoryId) return f;
      const svc = services.find((s) => s.id === f.service_id);
      if (svc && svc.category_id !== categoryId) return { ...f, service_id: "" };
      return f;
    });
  }

  async function handleSave() {
    if (!form.title_ar.trim() || !form.title_en.trim()) return push("error", "أدخل العنوان بالعربية والإنجليزية");
    if (!form.slug.trim()) return push("error", "أدخل Slug");
    if (form.service_id && serviceCategoryId) {
      const svc = services.find((s) => s.id === form.service_id);
      if (svc && svc.category_id !== serviceCategoryId) {
        return push("error", "الخدمة المختارة لا تنتمي إلى تصنيف الخدمة المحدد");
      }
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      slug: slugify(form.slug),
      service_id: form.service_id || null,
      category_id: form.category_id || null,
      completion_date: form.completion_date || null,
      thumbnail: form.thumbnail || null,
      cover_image: form.cover_image || null,
      project_url: form.project_url || null,
      short_desc_ar: form.short_desc_ar || null,
      short_desc_en: form.short_desc_en || null,
      full_desc_ar: form.full_desc_ar || null,
      full_desc_en: form.full_desc_en || null,
      technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
    };

    let id = projectId;
    if (isEdit) {
      const { error } = await supabase.from("projects").update(payload).eq("id", id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { data, error } = await supabase.from("projects").insert(payload).select().single();
      if (error) { setSaving(false); return push("error", error.message); }
      id = (data as Project).id;
    }

    await supabase.from("project_images").delete().eq("project_id", id);
    if (gallery.length) {
      await supabase.from("project_images").insert(gallery.map((url, i) => ({ project_id: id, url, is_primary: i === 0, sort: i })));
    }

    await supabase.from("project_portfolio_items").delete().eq("project_id", id);
    if (portfolioItems.length) {
      await supabase.from("project_portfolio_items").insert(
        portfolioItems.map((it, i) => ({
          project_id: id,
          service_id: form.service_id || null,
          type: it.type,
          title_ar: it.title_ar || null,
          title_en: it.title_en || null,
          description_ar: it.description_ar || null,
          description_en: it.description_en || null,
          caption_ar: it.caption_ar || null,
          caption_en: it.caption_en || null,
          alt_ar: it.alt_ar || null,
          alt_en: it.alt_en || null,
          url: it.url || null,
          thumbnail: it.thumbnail || null,
          platform: it.platform || null,
          icon: it.icon || null,
          button_text_ar: it.button_text_ar || null,
          button_text_en: it.button_text_en || null,
          button_style: it.button_style || "primary",
          button_action: it.button_action || "open",
          display_mode: it.display_mode || null,
          is_visible: it.is_visible,
          is_featured: it.is_featured,
          sort: i,
          data: it.data ?? {},
        })),
      );
    }

    await supabase.from("project_features").delete().eq("project_id", id);
    if (features.length) {
      await supabase.from("project_features").insert(
        features.map((f, i) => ({
          project_id: id,
          icon: f.icon || null,
          title_ar: f.title_ar,
          title_en: f.title_en,
          description_ar: f.description_ar || null,
          description_en: f.description_en || null,
          sort: i,
        })),
      );
    }

    setSaving(false);
    push("success", "تم حفظ المشروع بنجاح");
    router.push("/admin/projects");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/projects" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>
      </div>

      <div className="card space-y-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">المعلومات الأساسية</h2>
        <Bilingual label="العنوان" required ar={form.title_ar} en={form.title_en} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Slug"><input className="input" dir="ltr" value={form.slug} onChange={(e) => update("slug", e.target.value)} /></Field>
          <Field label="تصنيف الخدمة">
            <select className="input" value={serviceCategoryId} onChange={(e) => updateServiceCategory(e.target.value)}>
              <option value="">— كل التصنيفات —</option>
              {serviceCategories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </Field>
          <Field label="الخدمة">
            <select className="input" value={form.service_id} onChange={(e) => update("service_id", e.target.value)}>
              <option value="">—</option>
              {filteredServices.map((s) => <option key={s.id} value={s.id}>{s.title_ar}</option>)}
            </select>
            {serviceCategoryId && filteredServices.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">لا توجد خدمات لهذا التصنيف</p>
            )}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="التصنيف">
            <select className="input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </Field>
          <Field label="حالة المشروع">
            <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
              {["in_progress", "preparing", "ready", "maintenance", "completed", "paused"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="تاريخ الإنجاز"><input type="date" className="input" value={form.completion_date} onChange={(e) => update("completion_date", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="حالة النشر">
            <select className="input" value={form.status_field} onChange={(e) => update("status_field", e.target.value)}>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="archived">مؤرشف</option>
            </select>
          </Field>
        </div>
        <Bilingual label="وصف مختصر" ar={form.short_desc_ar} en={form.short_desc_en} onAr={(v) => update("short_desc_ar", v)} onEn={(v) => update("short_desc_en", v)} type="textarea" />

        <div>
          <div className="mb-2 flex gap-2">
            {(["ar", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setDescTab(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${descTab === l ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
                {l === "ar" ? "الوصف (عربي)" : "Description (EN)"}
              </button>
            ))}
          </div>
          {descTab === "ar" ? <RichText value={form.full_desc_ar} onChange={(h) => update("full_desc_ar", h)} /> : <RichText value={form.full_desc_en} onChange={(h) => update("full_desc_en", h)} />}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="الصورة المصغرة (Thumbnail)"><ImageUpload value={form.thumbnail} onChange={(url) => update("thumbnail", url)} folder="projects" /></Field>
          <Field label="صورة الغلاف (Cover)"><ImageUpload value={form.cover_image} onChange={(url) => update("cover_image", url)} folder="projects" /></Field>
        </div>

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
          {gallery.map((url, i) => url === "" && <ImageUpload key={i} value="" onChange={(u) => setGallery((g) => g.map((x, j) => (j === i ? u : x)))} folder="projects" />)}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="رابط المشروع (اختياري)"><input className="input" dir="ltr" value={form.project_url} onChange={(e) => update("project_url", e.target.value)} /></Field>
          <Field label="التقنيات (مفصولة بفواصل)"><input className="input" dir="ltr" placeholder="Next.js, Supabase" value={form.technologies} onChange={(e) => update("technologies", e.target.value)} /></Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded border-brand-200 text-brand-600" />
          مشروع مميز
        </label>
      </div>

      <div className="card p-6">
        <h2 className="mb-1 text-lg font-bold text-ink-900">محتوى العمل لهذه الخدمة</h2>
        <p className="mb-4 text-sm text-gray-500">
          {selectedService
            ? "تظهر هنا أنواع المحتوى المفعّلة لخدمة " + selectedService.title_ar + " فقط."
            : "اختر تصنيف الخدمة ثم الخدمة لتظهر أنواع المحتوى المفعّلة لها."}
          {portfolioSource === "service" && (
            <span className="mt-1 block text-xs font-semibold text-brand-600">إعدادات Portfolio من الخدمة</span>
          )}
          {portfolioSource === "category" && (
            <span className="mt-1 block text-xs font-semibold text-brand-600">إعدادات Portfolio من تصنيف الخدمة</span>
          )}
          {portfolioSource === "none" && selectedService && (
            <span className="mt-1 block text-xs font-semibold text-gray-400">لا توجد إعدادات Portfolio لهذه الخدمة أو تصنيفها</span>
          )}
        </p>
        <PortfolioEditor enabled={enabledTypes} value={portfolioItems} onChange={setPortfolioItems} projectUrl={form.project_url} />
      </div>

      <div className="card p-6">
        <h2 className="mb-1 text-lg font-bold text-ink-900">مميزات العمل</h2>
        <p className="mb-4 text-sm text-gray-500">أضف مميزات العمل التي تظهر في صفحة العمل. إن تُركت فارغة لن يظهر القسم.</p>
        <ProjectFeaturesEditor value={features} onChange={setFeatures} />
      </div>

      {isEdit && projectId && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-ink-900">SEO</h2>
          <SeoFields entityType="project" entityId={projectId} />
        </div>
      )}
    </div>
  );
}
