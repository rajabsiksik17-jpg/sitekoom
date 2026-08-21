"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, ChevronUp, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { socialIcon } from "@/components/social-icons";
import type { SocialLink } from "@/lib/types";

const empty = { platform: "facebook", label: "", url: "", icon: "", is_active: true };

export function SocialManager() {
  const { push } = useToast();
  const [items, setItems] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<SocialLink> | null>(null);
  const [deleting, setDeleting] = useState<SocialLink | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("social_links").select("*").order("sort");
    setItems((data ?? []) as SocialLink[]);
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
      const { error } = await supabase.from("social_links").update(editing).eq("id", editing.id);
      if (error) return push("error", error.message);
    } else {
      const { error } = await supabase.from("social_links").insert({ ...editing, sort: items.length });
      if (error) return push("error", error.message);
    }
    setEditing(null);
    push("success", "تم الحفظ");
    load();
  }

  async function toggle(item: SocialLink) {
    const supabase = createClient();
    await supabase.from("social_links").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function move(item: SocialLink, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const target = items[idx + dir];
    if (!target) return;
    const supabase = createClient();
    await supabase.from("social_links").update({ sort: target.sort }).eq("id", item.id);
    await supabase.from("social_links").update({ sort: item.sort }).eq("id", target.id);
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("social_links").delete().eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="التواصل الاجتماعي" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة شبكة</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد شبكات" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة</button>} />
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const Icon = socialIcon(s.platform);
            return (
              <div key={s.id} className="card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
                <div className="flex-1">
                  <p className="font-semibold text-ink-900">{s.label ?? s.platform}</p>
                  <p className="text-xs text-gray-400" dir="ltr">{s.url}</p>
                </div>
                <button type="button" onClick={() => toggle(s)}><Badge color={s.is_active ? "green" : "gray"}>{s.is_active ? "مفعّل" : "معطّل"}</Badge></button>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(s, -1)} className="rounded p-1 hover:bg-brand-100"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(s, 1)} className="rounded p-1 hover:bg-brand-100"><ChevronDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setEditing(s)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDeleting(s)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل شبكة" : "إضافة شبكة"} size="sm"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="المنصة">
              <select className="input" value={editing.platform ?? "facebook"} onChange={(e) => update("platform", e.target.value)}>
                {["facebook", "instagram", "linkedin", "x", "youtube", "tiktok", "snapchat", "whatsapp", "telegram", "github"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="التسمية"><input className="input" value={editing.label ?? ""} onChange={(e) => update("label", e.target.value)} /></Field>
            <Field label="الرابط"><input className="input" dir="ltr" value={editing.url ?? ""} onChange={(e) => update("url", e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> مفعّل
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف الشبكة" message="هل أنت متأكد؟" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
