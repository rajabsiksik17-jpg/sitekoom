"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import type { EducationalVideo } from "@/lib/types";

const TARGETS = ["all", "wordpress", "woocommerce", "custom", "laravel", "dotnet", "other"];

export function VideosManager() {
  const { push } = useToast();
  const [items, setItems] = useState<EducationalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EducationalVideo> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<EducationalVideo | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("educational_videos").select("*").order("sort");
    setItems((data ?? []) as EducationalVideo[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!editing) return;
    if (!editing.title_ar?.trim() || !editing.title_en?.trim() || !editing.youtube_url?.trim()) return push("error", "أدخل العنوان والرابط");
    setSaving(true);
    const supabase = createClient();
    const payload = { ...editing, sort: Number(editing.sort) || 0 };
    const { error } = editing.id
      ? await supabase.from("educational_videos").update(payload).eq("id", editing.id)
      : await supabase.from("educational_videos").insert(payload);
    setSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم الحفظ");
    setEditing(null);
    load();
  }

  async function toggleActive(v: EducationalVideo) {
    await createClient().from("educational_videos").update({ is_active: !v.is_active }).eq("id", v.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await createClient().from("educational_videos").delete().eq("id", deleting.id);
    setDeleting(null);
    push("success", "تم الحذف");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="فيديوهات تعليمية" description="فيديوهات تعليمية تظهر لعملاء البوابة حسب نوع موقعهم."
        action={<button type="button" onClick={() => setEditing({ title_ar: "", title_en: "", description_ar: "", description_en: "", youtube_url: "", target_type: "all", is_active: true, sort: 0 })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة فيديو</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد فيديوهات" action={<button type="button" onClick={() => setEditing({ title_ar: "", title_en: "", description_ar: "", description_en: "", youtube_url: "", target_type: "all", is_active: true, sort: 0 })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة فيديو</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العنوان</th>
                <th className="px-4 py-3 text-start font-semibold">النوع المستهدف</th>
                <th className="px-4 py-3 text-start font-semibold">الترتيب</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((v) => (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-ink-900">{v.title_ar}</td>
                  <td className="px-4 py-3 text-gray-500">{v.target_type}</td>
                  <td className="px-4 py-3 text-gray-500">{v.sort}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(v)}><Badge color={v.is_active ? "green" : "gray"}>{v.is_active ? "نشط" : "معطّل"}</Badge></button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditing({ ...v })} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setDeleting(v)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل فيديو" : "إضافة فيديو"} size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="العنوان (عربي)"><input className="input" value={editing.title_ar ?? ""} onChange={(e) => set("title_ar", e.target.value)} /></Field>
            <Field label="Title (EN)"><input className="input" dir="ltr" value={editing.title_en ?? ""} onChange={(e) => set("title_en", e.target.value)} /></Field>
            <Field label="الوصف (عربي)"><textarea className="input" value={editing.description_ar ?? ""} onChange={(e) => set("description_ar", e.target.value)} /></Field>
            <Field label="Description (EN)"><textarea className="input" dir="ltr" value={editing.description_en ?? ""} onChange={(e) => set("description_en", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="رابط يوتيوب"><input className="input" dir="ltr" value={editing.youtube_url ?? ""} onChange={(e) => set("youtube_url", e.target.value)} /></Field>
              </div>
              <Field label="الترتيب"><input className="input" dir="ltr" type="number" value={Number(editing.sort) || 0} onChange={(e) => set("sort", Number(e.target.value))} /></Field>
            </div>
            <Field label="النوع المستهدف">
              <select className="input" value={editing.target_type ?? "all"} onChange={(e) => set("target_type", e.target.value)}>
                {TARGETS.map((t) => <option key={t} value={t}>{t === "all" ? "الكل" : t}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={Boolean(editing.is_active)} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> نشط
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف الفيديو" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
