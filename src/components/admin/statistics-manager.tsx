"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import type { Statistic } from "@/lib/types";

const empty = { label_ar: "", label_en: "", value: 0, suffix: "", icon: "award" };

export function StatisticsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Statistic> | null>(null);
  const [deleting, setDeleting] = useState<Statistic | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("statistics").select("*").order("sort");
    setItems((data ?? []) as Statistic[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: unknown) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!editing) return;
    const supabase = createClient();
    if (editing.id) {
      const { error } = await supabase.from("statistics").update(editing).eq("id", editing.id);
      if (error) return push("error", error.message);
    } else {
      const { error } = await supabase.from("statistics").insert(editing);
      if (error) return push("error", error.message);
    }
    setEditing(null);
    push("success", "تم الحفظ");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("statistics").delete().eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="الإحصائيات" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة إحصائية</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد إحصائيات" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <div key={s.id} className="card p-5 text-center">
              <p className="text-3xl font-extrabold text-brand-700">{s.value}{s.suffix}</p>
              <p className="text-sm text-gray-600">{s.label_ar}</p>
              <div className="mt-3 flex justify-center gap-1">
                <button type="button" onClick={() => setEditing(s)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleting(s)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل إحصائية" : "إضافة إحصائية"} size="sm"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Bilingual label="التسمية" ar={editing.label_ar ?? ""} en={editing.label_en ?? ""} onAr={(v) => update("label_ar", v)} onEn={(v) => update("label_en", v)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="القيمة"><input type="number" className="input" value={editing.value ?? 0} onChange={(e) => update("value", Number(e.target.value))} /></Field>
              <Field label="لاحقة"><input className="input" placeholder="+" value={editing.suffix ?? ""} onChange={(e) => update("suffix", e.target.value)} /></Field>
              <Field label="أيقونة"><input className="input" dir="ltr" value={editing.icon ?? ""} onChange={(e) => update("icon", e.target.value)} /></Field>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف الإحصائية" message="هل أنت متأكد؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
