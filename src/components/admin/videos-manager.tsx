"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import type { EducationalVideo } from "@/lib/types";

const TARGETS = ["all", "wordpress", "woocommerce", "custom", "laravel", "dotnet", "other"];

interface VideoRow extends EducationalVideo {
  client?: { name: string } | null;
  website?: { name: string; domain: string | null } | null;
}

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface WebsiteOption {
  id: string;
  name: string;
  domain: string | null;
}

export function VideosManager() {
  const { push } = useToast();
  const [items, setItems] = useState<VideoRow[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<VideoRow> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<VideoRow | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [v, c] = await Promise.all([
      supabase.from("educational_videos").select("*, client:clients(name), website:client_websites(name, domain)").order("sort"),
      supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
    ]);
    setItems((v.data ?? []) as VideoRow[]);
    setClients((c.data ?? []) as ClientOption[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (editing?.client_id) {
      createClient()
        .from("client_websites")
        .select("id, name, domain")
        .eq("client_id", editing.client_id)
        .order("name")
        .then(({ data }) => setWebsites((data ?? []) as WebsiteOption[]));
    } else {
      setWebsites([]);
    }
  }, [editing?.client_id]);

  function set(field: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function onVisibilityChange(v: string) {
    setEditing((prev) => {
      if (!prev) return prev;
      const next = { ...prev, visibility: v };
      if (v === "general") {
        next.client_id = null;
        next.website_id = null;
      } else if (v === "client") {
        next.website_id = null;
      }
      return next;
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.title_ar?.trim() || !editing.title_en?.trim() || !editing.youtube_url?.trim()) return push("error", "أدخل العنوان والرابط");
    if (editing.visibility === "website" && !editing.website_id) return push("error", "اختر الموقع");
    setSaving(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      title_ar: editing.title_ar,
      title_en: editing.title_en,
      description_ar: editing.description_ar ?? null,
      description_en: editing.description_en ?? null,
      youtube_url: editing.youtube_url,
      target_type: editing.target_type ?? "all",
      visibility: editing.visibility ?? "general",
      client_id: editing.visibility === "general" ? null : editing.client_id ?? null,
      website_id: editing.visibility === "website" ? editing.website_id ?? null : null,
      is_active: editing.is_active ?? true,
      sort: Number(editing.sort) || 0,
    };
    const { error } = editing.id
      ? await supabase.from("educational_videos").update(payload).eq("id", editing.id)
      : await supabase.from("educational_videos").insert(payload);
    setSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم الحفظ");
    setEditing(null);
    load();
  }

  async function toggleActive(v: VideoRow) {
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

  const visibilityLabel = (v: string) => (v === "general" ? "عام" : v === "client" ? "عميل محدد" : "موقع محدد");

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="فيديوهات تعليمية" description="فيديوهات تعليمية مخصصة لكل عميل أو موقع أو عامة."
        action={<button type="button" onClick={() => setEditing({ title_ar: "", title_en: "", description_ar: "", description_en: "", youtube_url: "", target_type: "all", visibility: "general", is_active: true, sort: 0 })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة فيديو</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا توجد فيديوهات" action={<button type="button" onClick={() => setEditing({ title_ar: "", title_en: "", description_ar: "", description_en: "", youtube_url: "", target_type: "all", visibility: "general", is_active: true, sort: 0 })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة فيديو</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العنوان</th>
                <th className="px-4 py-3 text-start font-semibold">العميل</th>
                <th className="px-4 py-3 text-start font-semibold">الموقع</th>
                <th className="px-4 py-3 text-start font-semibold">الرؤية</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((v) => (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-medium text-ink-900">{v.title_ar}</td>
                  <td className="px-4 py-3 text-gray-500">{v.client?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{v.website?.name ?? v.website?.domain ?? "—"}</td>
                  <td className="px-4 py-3"><Badge color={v.visibility === "general" ? "gray" : "brand"}>{visibilityLabel(v.visibility)}</Badge></td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(v)}><Badge color={v.is_active ? "green" : "gray"}>{v.is_active ? "نشط" : "معطّل"}</Badge></button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(v.created_at).toLocaleDateString("ar-JO")}</td>
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
            <Field label="رابط يوتيوب"><input className="input" dir="ltr" value={editing.youtube_url ?? ""} onChange={(e) => set("youtube_url", e.target.value)} /></Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الرؤية">
                <select className="input" value={editing.visibility ?? "general"} onChange={(e) => onVisibilityChange(e.target.value)}>
                  <option value="general">عام</option>
                  <option value="client">عميل محدد</option>
                  <option value="website">موقع محدد</option>
                </select>
              </Field>
              <Field label="نوع الموقع">
                <select className="input" value={editing.target_type ?? "all"} onChange={(e) => set("target_type", e.target.value)}>
                  {TARGETS.map((t) => <option key={t} value={t}>{t === "all" ? "الكل" : t}</option>)}
                </select>
              </Field>
            </div>

            {editing.visibility !== "general" && (
              <Field label="العميل">
                <select className="input" value={editing.client_id ?? ""} onChange={(e) => { set("client_id", e.target.value); set("website_id", null); }}>
                  <option value="">اختر العميل...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
                </select>
              </Field>
            )}

            {editing.visibility === "website" && editing.client_id && (
              <Field label="الموقع">
                <select className="input" value={editing.website_id ?? ""} onChange={(e) => set("website_id", e.target.value)}>
                  <option value="">اختر الموقع...</option>
                  {websites.map((w) => <option key={w.id} value={w.id}>{w.name}{w.domain ? ` (${w.domain})` : ""}</option>)}
                </select>
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الترتيب"><input className="input" dir="ltr" type="number" value={Number(editing.sort) || 0} onChange={(e) => set("sort", Number(e.target.value))} /></Field>
              <label className="flex items-center gap-2 pt-7 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(editing.is_active)} onChange={(e) => set("is_active", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> نشط
              </label>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف الفيديو" message={`هل أنت متأكد من حذف "${deleting?.title_ar}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
