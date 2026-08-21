"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { slugify } from "@/lib/utils";

type Cat = { id: string; name_ar: string; name_en: string; slug: string; sort: number };

export function CategoriesManager() {
  const { push } = useToast();
  const [tab, setTab] = useState<"article" | "project">("article");
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [deleting, setDeleting] = useState<Cat | null>(null);

  const table = tab === "article" ? "article_categories" : "project_categories";

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from(table).select("*").order("sort");
    setItems((data ?? []) as Cat[]);
    setLoading(false);
  }, [table]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  function update(field: string, value: unknown) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!editing) return;
    if (!editing.name_ar?.trim()) return push("error", "أدخل الاسم");
    const supabase = createClient();
    const payload = { ...editing, slug: slugify(editing.slug || editing.name_en || editing.name_ar!) };
    if (editing.id) {
      const { error } = await supabase.from(table).update(payload).eq("id", editing.id);
      if (error) return push("error", error.message);
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) return push("error", error.message);
    }
    setEditing(null);
    push("success", "تم الحفظ");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  return (
    <div>
      <PageTitle title="التصنيفات" description="تصنيفات المقالات والمشاريع."
        action={<button type="button" onClick={() => setEditing({ name_ar: "", name_en: "", slug: "", sort: items.length })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة تصنيف</button>} />

      <div className="mb-6 flex gap-2">
        <button type="button" onClick={() => setTab("article")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "article" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>تصنيفات المقالات</button>
        <button type="button" onClick={() => setTab("project")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "project" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>تصنيفات المشاريع</button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner /></div> : items.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات" />
      ) : (
        <div className="card divide-y divide-brand-50">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{c.name_ar}</p>
                <p className="text-xs text-gray-400" dir="ltr">{c.slug}</p>
              </div>
              <button type="button" onClick={() => setEditing(c)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => setDeleting(c)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل تصنيف" : "إضافة تصنيف"} size="sm"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="الاسم (عربي)"><input className="input" value={editing.name_ar ?? ""} onChange={(e) => update("name_ar", e.target.value)} /></Field>
            <Field label="Name (EN)"><input className="input" dir="ltr" value={editing.name_en ?? ""} onChange={(e) => update("name_en", e.target.value)} /></Field>
            <Field label="Slug"><input className="input" dir="ltr" value={editing.slug ?? ""} onChange={(e) => update("slug", e.target.value)} /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف التصنيف" message="هل أنت متأكد؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
