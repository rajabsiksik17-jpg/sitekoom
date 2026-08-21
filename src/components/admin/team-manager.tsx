"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import type { TeamMember } from "@/lib/types";

const empty = { name_ar: "", name_en: "", position_ar: "", position_en: "", bio_ar: "", bio_en: "", photo: "", email: "", social_links: {}, is_active: true };

export function TeamManager() {
  const { push } = useToast();
  const [items, setItems] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<TeamMember> | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("team_members").select("*").order("sort");
    setItems((data ?? []) as TeamMember[]);
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
      const { error } = await supabase.from("team_members").update(editing).eq("id", editing.id);
      if (error) return push("error", error.message);
    } else {
      const { error } = await supabase.from("team_members").insert(editing);
      if (error) return push("error", error.message);
    }
    setEditing(null);
    push("success", "تم الحفظ");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("team_members").delete().eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="فريق العمل" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عضو</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا يوجد أعضاء" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عضو</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div key={m.id} className="card flex items-center gap-3 p-4">
              {m.photo ? <img src={m.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600">{m.name_ar[0]}</span>}
              <div className="flex-1">
                <p className="font-semibold text-ink-900">{m.name_ar}</p>
                <p className="text-xs text-gray-500">{m.position_ar}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setEditing(m)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setDeleting(m)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل عضو" : "إضافة عضو"} size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Bilingual label="الاسم" required ar={editing.name_ar ?? ""} en={editing.name_en ?? ""} onAr={(v) => update("name_ar", v)} onEn={(v) => update("name_en", v)} />
            <Bilingual label="المنصب" ar={editing.position_ar ?? ""} en={editing.position_en ?? ""} onAr={(v) => update("position_ar", v)} onEn={(v) => update("position_en", v)} />
            <Bilingual label="نبذة" ar={editing.bio_ar ?? ""} en={editing.bio_en ?? ""} onAr={(v) => update("bio_ar", v)} onEn={(v) => update("bio_en", v)} type="textarea" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="البريد الإلكتروني"><input className="input" dir="ltr" value={editing.email ?? ""} onChange={(e) => update("email", e.target.value)} /></Field>
              <Field label="الصورة"><ImageUpload value={editing.photo ?? ""} onChange={(url) => update("photo", url)} folder="team" /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> مفعّل
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف العضو" message="هل أنت متأكد من الحذف؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
