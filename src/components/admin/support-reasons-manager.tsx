"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import type { SupportReason } from "@/lib/support-reasons";

export function SupportReasonsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<SupportReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SupportReason> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SupportReason | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "support_reasons").single();
    setItems(((data?.value as { items?: SupportReason[] })?.items ?? []) as SupportReason[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function persist(next: SupportReason[]) {
    setSaving(true);
    const { error } = await createClient().from("site_settings").upsert({ key: "support_reasons", value: { items: next } });
    setSaving(false);
    if (error) return push("error", error.message);
    setItems(next);
    push("success", "تم الحفظ");
  }

  function set(field: string, value: string) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!editing) return;
    if (!editing.value?.trim() || !editing.ar?.trim() || !editing.en?.trim()) return push("error", "أدخل القيمة والعناوين");
    const exists = items.some((i) => i.value === editing.value);
    const next = exists
      ? items.map((i) => (i.value === editing.value ? { value: editing.value!, ar: editing.ar!, en: editing.en! } : i))
      : [...items, { value: editing.value, ar: editing.ar, en: editing.en } as SupportReason];
    await persist(next);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    await persist(items.filter((i) => i.value !== deleting.value));
    setDeleting(null);
  }

  function move(item: SupportReason, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.value === item.value);
    const target = items[idx + dir];
    if (!target) return;
    const next = [...items];
    next[idx] = target;
    next[idx + dir] = item;
    persist(next);
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="أسباب الدعم" description="خيارات سبب التواصل التي تظهر للعميل قبل بدء المحادثة."
        action={<button type="button" onClick={() => setEditing({ value: "", ar: "", en: "" })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة سبب</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد أسباب" action={<button type="button" onClick={() => setEditing({ value: "", ar: "", en: "" })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة</button>} />
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.value} className="card flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{r.ar}</p>
                <p className="text-xs text-gray-400" dir="ltr">{r.en} <span className="text-brand-500">({r.value})</span></p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(r, -1)} className="rounded p-1 hover:bg-brand-100"><ChevronUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(r, 1)} className="rounded p-1 hover:bg-brand-100"><ChevronDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setEditing({ ...r })} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleting(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.value && items.some((i) => i.value === editing.value) ? "تعديل سبب" : "إضافة سبب"} size="sm"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="القيمة (key)" hint="قيمة فريدة باللغة الإنجليزية">
              <input className="input" dir="ltr" value={editing.value ?? ""} onChange={(e) => set("value", e.target.value)} disabled={!!editing.value && items.some((i) => i.value === editing.value)} />
            </Field>
            <Field label="العنوان (عربي)"><input className="input" value={editing.ar ?? ""} onChange={(e) => set("ar", e.target.value)} /></Field>
            <Field label="Label (EN)"><input className="input" dir="ltr" value={editing.en ?? ""} onChange={(e) => set("en", e.target.value)} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف السبب" message={`هل أنت متأكد من حذف "${deleting?.ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
