"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { EmptyState, ConfirmDialog, Badge, Spinner, PageTitle, Modal } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import type { HomepageSlider } from "@/lib/types";

const empty: Partial<HomepageSlider> = {
  title_ar: "", title_en: "", subtitle_ar: "", subtitle_en: "",
  description_ar: "", description_en: "", cta_text_ar: "", cta_text_en: "", cta_url: "",
  cta2_text_ar: "", cta2_text_en: "", cta2_url: "", animation: "fade-up", is_active: true,
  desktop_image: "", tablet_image: "", mobile_image: "", header_theme: "dark",
};

export function SliderManager() {
  const { push } = useToast();
  const [items, setItems] = useState<HomepageSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<HomepageSlider> | null>(null);
  const [deleting, setDeleting] = useState<HomepageSlider | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("homepage_sliders").select("*").order("sort");
    setItems((data ?? []) as HomepageSlider[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: unknown) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!editing) return;
    if (!editing.title_ar?.trim()) return push("error", "أدخل العنوان بالعربية");
    setSaving(true);
    const supabase = createClient();
    if (editing.id) {
      const { error } = await supabase.from("homepage_sliders").update(editing).eq("id", editing.id);
      if (error) { setSaving(false); return push("error", error.message); }
    } else {
      const { error } = await supabase.from("homepage_sliders").insert(editing);
      if (error) { setSaving(false); return push("error", error.message); }
    }
    setSaving(false);
    setEditing(null);
    push("success", "تم الحفظ");
    load();
  }

  async function toggle(item: HomepageSlider) {
    const supabase = createClient();
    await supabase.from("homepage_sliders").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function move(item: HomepageSlider, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const target = items[idx + dir];
    if (!target) return;
    const supabase = createClient();
    await supabase.from("homepage_sliders").update({ sort: target.sort }).eq("id", item.id);
    await supabase.from("homepage_sliders").update({ sort: item.sort }).eq("id", target.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("homepage_sliders").delete().eq("id", deleting.id);
    setDeleting(null);
    push("success", "تم الحذف");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="سلايدر الرئيسية" description="إدارة شرائح Hero في الصفحة الرئيسية."
        action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة شريحة</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد شرائح" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة شريحة</button>} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card flex items-center gap-4 p-4">
              {item.desktop_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.desktop_image} alt="" className="h-14 w-24 rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-24 rounded-lg bg-brand-50" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{item.title_ar}</p>
                <p className="text-xs text-gray-400" dir="ltr">{item.cta_url}</p>
              </div>
              <button type="button" onClick={() => toggle(item)}><Badge color={item.is_active ? "green" : "gray"}>{item.is_active ? "مفعّل" : "معطّل"}</Badge></button>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(item, -1)} className="rounded p-1 hover:bg-brand-100"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(item, 1)} className="rounded p-1 hover:bg-brand-100"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setEditing(item)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleting(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "تعديل الشريحة" : "إضافة شريحة"}
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button>
            <button type="button" onClick={save} className="btn-primary px-6 py-2" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Bilingual label="العنوان" required ar={editing.title_ar ?? ""} en={editing.title_en ?? ""} onAr={(v) => update("title_ar", v)} onEn={(v) => update("title_en", v)} />
            <Bilingual label="العنوان الفرعي" ar={editing.subtitle_ar ?? ""} en={editing.subtitle_en ?? ""} onAr={(v) => update("subtitle_ar", v)} onEn={(v) => update("subtitle_en", v)} />
            <Bilingual label="الوصف" ar={editing.description_ar ?? ""} en={editing.description_en ?? ""} onAr={(v) => update("description_ar", v)} onEn={(v) => update("description_en", v)} type="textarea" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نص الزر الأول"><input className="input" value={editing.cta_text_ar ?? ""} onChange={(e) => update("cta_text_ar", e.target.value)} /></Field>
              <Field label="رابط الزر الأول"><input className="input" dir="ltr" value={editing.cta_url ?? ""} onChange={(e) => update("cta_url", e.target.value)} /></Field>
              <Field label="نص الزر الثاني"><input className="input" value={editing.cta2_text_ar ?? ""} onChange={(e) => update("cta2_text_ar", e.target.value)} /></Field>
              <Field label="رابط الزر الثاني"><input className="input" dir="ltr" value={editing.cta2_url ?? ""} onChange={(e) => update("cta2_url", e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="صورة Desktop"><ImageUpload value={editing.desktop_image ?? ""} onChange={(url) => update("desktop_image", url)} folder="sliders" /></Field>
              <Field label="صورة Tablet"><ImageUpload value={editing.tablet_image ?? ""} onChange={(url) => update("tablet_image", url)} folder="sliders" /></Field>
              <Field label="صورة Mobile"><ImageUpload value={editing.mobile_image ?? ""} onChange={(url) => update("mobile_image", url)} folder="sliders" /></Field>
            </div>
            <Field label="نمط الهيدر">
              <select className="input" value={(editing.header_theme as string) ?? "dark"} onChange={(e) => update("header_theme", e.target.value)}>
                <option value="dark">داكن (نص أبيض)</option>
                <option value="light">فاتح (نص داكن)</option>
                <option value="auto">تلقائي</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" />
              مفعّل
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف الشريحة" message="هل أنت متأكد من حذف هذه الشريحة؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
