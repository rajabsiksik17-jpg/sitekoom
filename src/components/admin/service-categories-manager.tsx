"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { IconPicker } from "@/components/admin/icon-picker";
import { Icon } from "@/components/icon";
import { slugify } from "@/lib/utils";
import { PORTFOLIO_FIELD_TYPES } from "@/lib/portfolio";
import type { ServiceCategory } from "@/lib/types";

export function ServiceCategoriesManager() {
  const { push } = useToast();
  const [items, setItems] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ServiceCategory> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ServiceCategory | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("service_categories").select("*").order("sort");
    setItems((data ?? []) as ServiceCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function togglePortfolio(key: string) {
    setEditing((prev) => {
      if (!prev) return prev;
      const current = (prev.portfolio_config ?? []) as string[];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      return { ...prev, portfolio_config: next };
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name_ar?.trim() || !editing.name_en?.trim() || !editing.slug?.trim()) return push("error", "أدخل الاسم و Slug");
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...editing,
      slug: slugify(editing.slug),
      sort: Number(editing.sort) || 0,
      is_active: editing.is_active ?? true,
      portfolio_config: (editing.portfolio_config ?? []) as string[],
    };
    const { error } = editing.id
      ? await supabase.from("service_categories").update(payload).eq("id", editing.id)
      : await supabase.from("service_categories").insert(payload);
    setSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم الحفظ");
    setEditing(null);
    load();
  }

  async function toggleActive(item: ServiceCategory) {
    await createClient().from("service_categories").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function move(item: ServiceCategory, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const target = items[idx + dir];
    if (!target) return;
    const supabase = createClient();
    await supabase.from("service_categories").update({ sort: target.sort }).eq("id", item.id);
    await supabase.from("service_categories").update({ sort: item.sort }).eq("id", target.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await createClient().from("service_categories").delete().eq("id", deleting.id);
    setDeleting(null);
    if (error) return push("error", error.message);
    push("success", "تم الحذف");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="تصنيفات الخدمات" description="التصنيفات الرئيسية للخدمات (مثل البرمجة والتسويق)."
        action={<button type="button" onClick={() => setEditing({ name_ar: "", name_en: "", slug: "", icon: "sparkles", description_ar: "", description_en: "", portfolio_config: [], sort: items.length, is_active: true })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة تصنيف</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات" action={<button type="button" onClick={() => setEditing({ name_ar: "", name_en: "", slug: "", icon: "sparkles", description_ar: "", description_en: "", portfolio_config: [], sort: 0, is_active: true })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة</button>} />
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white"><Icon name={c.icon} className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">{c.name_ar}</p>
                <p className="text-xs text-gray-400" dir="ltr">{c.name_en} · {c.slug}</p>
              </div>
              <button type="button" onClick={() => toggleActive(c)}><Badge color={c.is_active ? "green" : "gray"}>{c.is_active ? "مفعّل" : "معطّل"}</Badge></button>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(c, -1)} className="rounded p-1 hover:bg-brand-100"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(c, 1)} className="rounded p-1 hover:bg-brand-100"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setEditing({ ...c })} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleting(c)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل تصنيف" : "إضافة تصنيف"} size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Bilingual label="اسم التصنيف" required ar={editing.name_ar ?? ""} en={editing.name_en ?? ""} onAr={(v) => set("name_ar", v)} onEn={(v) => set("name_en", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug"><input className="input" dir="ltr" value={editing.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></Field>
              <Field label="الترتيب"><input className="input" dir="ltr" type="number" value={Number(editing.sort) || 0} onChange={(e) => set("sort", Number(e.target.value))} /></Field>
            </div>
            <Field label="الأيقونة">
              <IconPicker value={editing.icon ?? "sparkles"} onChange={(v) => set("icon", v)} />
            </Field>
            <Bilingual label="الوصف" ar={editing.description_ar ?? ""} en={editing.description_en ?? ""} onAr={(v) => set("description_ar", v)} onEn={(v) => set("description_en", v)} type="textarea" />
            <Field label="الصورة"><ImageUpload value={editing.image ?? ""} onChange={(url) => set("image", url)} folder="categories" /></Field>
            <div className="rounded-xl border border-brand-100 p-4">
              <p className="mb-3 text-sm font-bold text-brand-700">إعدادات الأعمال Portfolio (الافتراضية لهذا التصنيف)</p>
              <p className="mb-3 text-xs text-gray-500">تُستخدم عندما لا تحتوي الخدمة على إعدادات Portfolio خاصة بها.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PORTFOLIO_FIELD_TYPES.map((t) => (
                  <label key={t.key} className="flex items-center gap-2 rounded-xl border border-brand-100 px-3 py-2.5 text-sm text-gray-700 hover:border-brand-300">
                    <input
                      type="checkbox"
                      checked={((editing.portfolio_config ?? []) as string[]).includes(t.key)}
                      onChange={() => togglePortfolio(t.key)}
                      className="rounded border-brand-200 text-brand-600"
                    />
                    {t.labelAr}
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-brand-100 p-4">
              <p className="mb-3 text-sm font-bold text-brand-700">SEO</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SEO Title (عربي)"><input className="input" value={editing.seo_title_ar ?? ""} onChange={(e) => set("seo_title_ar", e.target.value)} /></Field>
                <Field label="SEO Title (EN)"><input className="input" dir="ltr" value={editing.seo_title_en ?? ""} onChange={(e) => set("seo_title_en", e.target.value)} /></Field>
                <Field label="Meta Description (عربي)"><textarea className="input" value={editing.meta_description_ar ?? ""} onChange={(e) => set("meta_description_ar", e.target.value)} /></Field>
                <Field label="Meta Description (EN)"><textarea className="input" dir="ltr" value={editing.meta_description_en ?? ""} onChange={(e) => set("meta_description_en", e.target.value)} /></Field>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> مفعّل
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف التصنيف" message={`هل أنت متأكد من حذف "${deleting?.name_ar}"؟ سيتم إلغاء ربط الخدمات به.`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
