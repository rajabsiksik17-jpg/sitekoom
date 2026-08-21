"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { RichText } from "@/components/admin/rich-text";
import { SeoFields } from "@/components/admin/seo-fields";
import { Spinner } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import type { Article, ArticleCategory } from "@/lib/types";

export function ArticleForm({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!articleId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);

  const [form, setForm] = useState({
    title_ar: "", title_en: "", slug: "", excerpt_ar: "", excerpt_en: "",
    content_ar: "", content_en: "", cover_image: "", category_id: "",
    status: "draft" as "draft" | "published" | "archived", scheduled_for: "", is_featured: false,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tab, setTab] = useState<"ar" | "en">("ar");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("article_categories").select("*").order("sort").then(({ data }) => setCategories((data ?? []) as ArticleCategory[]));

    if (articleId) {
      supabase.from("articles").select("*").eq("id", articleId).single().then(({ data }) => {
        if (data) {
          const d = data as Article;
          setForm({
            title_ar: d.title_ar, title_en: d.title_en, slug: d.slug,
            excerpt_ar: d.excerpt_ar ?? "", excerpt_en: d.excerpt_en ?? "",
            content_ar: d.content_ar ?? "", content_en: d.content_en ?? "",
            cover_image: d.cover_image ?? "", category_id: d.category_id ?? "",
            status: d.status, scheduled_for: d.scheduled_for?.slice(0, 16) ?? "", is_featured: d.is_featured,
          });
          setTags((d.tags ?? []).map((t) => t.name));
        }
        setLoading(false);
      });
    }
  }, [articleId]);

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function handleSave() {
    if (!form.title_ar.trim() || !form.title_en.trim()) return push("error", "أدخل العنوان بالعربية والإنجليزية");
    if (!form.slug.trim()) return push("error", "أدخل Slug");
    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    const payload = {
      ...form,
      slug: slugify(form.slug),
      author_id: userData.user?.id ?? null,
      category_id: form.category_id || null,
      excerpt_ar: form.excerpt_ar || null,
      excerpt_en: form.excerpt_en || null,
      content_ar: form.content_ar || null,
      content_en: form.content_en || null,
      cover_image: form.cover_image || null,
      scheduled_for: form.scheduled_for || null,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };

    let id = articleId;
    if (isEdit) {
      const { error } = await supabase.from("articles").update(payload).eq("id", id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { data, error } = await supabase.from("articles").insert(payload).select().single();
      if (error) { setSaving(false); return push("error", error.message); }
      id = (data as Article).id;
    }

    // Sync tags
    await supabase.from("article_tag_relations").delete().eq("article_id", id);
    for (const name of tags) {
      const { data: existing } = await supabase.from("article_tags").select("id").eq("name", name).maybeSingle();
      let tagId = existing?.id;
      if (!tagId) {
        const { data: created } = await supabase.from("article_tags").insert({ name, slug: slugify(name) }).select().single();
        tagId = created?.id;
      }
      if (tagId) await supabase.from("article_tag_relations").insert({ article_id: id, tag_id: tagId });
    }

    setSaving(false);
    push("success", "تم حفظ المقال بنجاح");
    router.push("/admin/articles");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/articles" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"><ArrowRight className="h-4 w-4" /> رجوع</Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>
      </div>

      <div className="card space-y-6 p-6">
        <h2 className="text-lg font-bold text-ink-900">المقال</h2>
        <Bilingual label="العنوان" required ar={form.title_ar} en={form.title_en} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Slug"><input className="input" dir="ltr" value={form.slug} onChange={(e) => update("slug", e.target.value)} /></Field>
          <Field label="التصنيف">
            <select className="input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="جدولة النشر (اختياري)"><input type="datetime-local" className="input" value={form.scheduled_for} onChange={(e) => update("scheduled_for", e.target.value)} /></Field>
          <Field label="الوسوم">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 px-3 py-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  {t}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                </span>
              ))}
              <input className="flex-1 border-none text-sm outline-none" placeholder="أضف وسم واضغط Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
            </div>
          </Field>
        </div>

        <Bilingual label="المقتطف" ar={form.excerpt_ar} en={form.excerpt_en} onAr={(v) => update("excerpt_ar", v)} onEn={(v) => update("excerpt_en", v)} type="textarea" />

        <div>
          <div className="mb-2 flex gap-2">
            {(["ar", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setTab(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === l ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
                {l === "ar" ? "المحتوى (عربي)" : "Content (EN)"}
              </button>
            ))}
          </div>
          {tab === "ar" ? <RichText value={form.content_ar} onChange={(h) => update("content_ar", h)} minHeight={320} /> : <RichText value={form.content_en} onChange={(h) => update("content_en", h)} minHeight={320} />}
        </div>

        <Field label="صورة الغلاف"><ImageUpload value={form.cover_image} onChange={(url) => update("cover_image", url)} folder="articles" /></Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} className="rounded border-brand-200 text-brand-600" />
          مقال مميز
        </label>
      </div>

      {isEdit && articleId && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold text-ink-900">SEO</h2>
          <SeoFields entityType="article" entityId={articleId} />
        </div>
      )}
    </div>
  );
}
