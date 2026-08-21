"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { Field, Bilingual } from "@/components/admin/fields";
import { RichText } from "@/components/admin/rich-text";
import { Spinner } from "@/components/admin/ui";
import { slugify } from "@/lib/utils";
import type { Page } from "@/lib/types";

export function PageForm({ pageId }: { pageId?: string }) {
  const router = useRouter();
  const { push } = useToast();
  const isEdit = !!pageId;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    slug: "",
    content_ar: "",
    content_en: "",
    status: "published",
    is_system: false,
  });
  const [tab, setTab] = useState<"ar" | "en">("ar");

  useEffect(() => {
    if (!pageId) return;
    const supabase = createClient();
    supabase.from("pages").select("*").eq("id", pageId).single().then(({ data }) => {
      if (data) {
        const d = data as Page;
        setForm({
          title_ar: d.title_ar,
          title_en: d.title_en,
          slug: d.slug,
          content_ar: d.content_ar ?? "",
          content_en: d.content_en ?? "",
          status: d.status,
          is_system: d.is_system,
        });
      }
      setLoading(false);
    });
  }, [pageId]);

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!form.title_ar.trim() || !form.title_en.trim()) return push("error", "أدخل العنوان بالعربية والإنجليزية");
    if (!form.slug.trim()) return push("error", "أدخل Slug");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      slug: slugify(form.slug),
      content_ar: form.content_ar || null,
      content_en: form.content_en || null,
    };

    if (isEdit) {
      const { error } = await supabase.from("pages").update(payload).eq("id", pageId);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { error } = await supabase.from("pages").insert(payload);
      if (error) { setSaving(false); return push("error", error.message); }
    }
    setSaving(false);
    push("success", "تم حفظ الصفحة");
    router.push("/admin/pages");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/pages" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Link>
        <button type="button" onClick={handleSave} className="btn-primary px-6 py-2.5" disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>

      <div className="card space-y-6 p-6">
        <Bilingual label="العنوان" required ar={form.title_ar} en={form.title_en} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" hint="سيظهر الرابط على الشكل /page/slug">
            <input className="input" dir="ltr" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
          </Field>
          <Field label="الحالة">
            <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="published">منشورة</option>
              <option value="draft">مسودة</option>
            </select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex gap-2">
            {(["ar", "en"] as const).map((l) => (
              <button key={l} type="button" onClick={() => setTab(l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === l ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>
                {l === "ar" ? "المحتوى (عربي)" : "Content (EN)"}
              </button>
            ))}
          </div>
          {tab === "ar"
            ? <RichText value={form.content_ar} onChange={(h) => update("content_ar", h)} minHeight={320} />
            : <RichText value={form.content_en} onChange={(h) => update("content_en", h)} minHeight={320} />}
        </div>
      </div>
    </div>
  );
}
