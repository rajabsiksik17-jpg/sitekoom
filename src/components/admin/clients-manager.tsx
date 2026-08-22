"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Save, FolderCog } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import type { Client } from "@/lib/types";

const WEBSITE_TYPES = ["wordpress", "custom", "laravel", "dotnet", "other"];
const AUTH_METHODS = ["sso_token", "redirect", "manual"];

const empty = {
  name: "", company: "", email: "", username: "", password: "",
  website_url: "", admin_url: "", website_type: "wordpress", auth_method: "sso_token",
};

export function ClientsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Client> & { password?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name, company, email, username, website_url, admin_url, website_type, auth_method, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.username?.trim()) return push("error", "أدخل الاسم واسم المستخدم");
    if (!editing.id && !editing.password) return push("error", "كلمة المرور مطلوبة");
    setSaving(true);
    const res = await fetch("/api/admin/clients", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return push("error", data.error ?? "فشل الحفظ");
    push("success", "تم الحفظ");
    setEditing(null);
    load();
  }

  async function toggleStatus(item: Client) {
    const supabase = createClient();
    const next = item.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("clients").update({ status: next }).eq("id", item.id);
    if (error) return push("error", error.message);
    push("success", next === "active" ? "تم تفعيل العميل" : "تم تعطيل العميل");
    load();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("clients").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    push("success", "تم حذف العميل");
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle
        title="عملاء WordPress"
        description="إدارة عملاء المواقع والأنظمة."
        action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عميل</button>}
      />

      {items.length === 0 ? (
        <EmptyState title="لا يوجد عملاء" action={<button type="button" onClick={() => setEditing({ ...empty })} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عميل</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العميل</th>
                <th className="px-4 py-3 text-start font-semibold">Username</th>
                <th className="px-4 py-3 text-start font-semibold">الموقع</th>
                <th className="px-4 py-3 text-start font-semibold">النوع</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{c.name}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600" dir="ltr">{c.username}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{c.website_url ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{c.website_type}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleStatus(c)}><Badge color={c.status === "active" ? "green" : "red"}>{c.status === "active" ? "نشط" : "معطّل"}</Badge></button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/clients/${c.id}`} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" title="المواقع والخدمات">
                        <FolderCog className="h-4 w-4" />
                      </Link>
                      <button type="button" onClick={() => setEditing({ ...c, password: "" })} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setDeleting(c)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "تعديل عميل" : "إضافة عميل"} size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} className="btn-primary px-6 py-2" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم العميل"><input className="input" value={editing.name ?? ""} onChange={(e) => update("name", e.target.value)} /></Field>
            <Field label="اسم الشركة"><input className="input" value={editing.company ?? ""} onChange={(e) => update("company", e.target.value)} /></Field>
            <Field label="البريد الإلكتروني"><input className="input" dir="ltr" type="email" value={editing.email ?? ""} onChange={(e) => update("email", e.target.value)} /></Field>
            <Field label="Username"><input className="input" dir="ltr" value={editing.username ?? ""} onChange={(e) => update("username", e.target.value)} /></Field>
            <Field label="كلمة المرور" hint={editing.id ? "اتركها فارغة لعدم تغييرها" : "تُخزَّن مشفّرة ولا تُعرض أبدًا"}>
              <input className="input" dir="ltr" type="password" value={editing.password ?? ""} onChange={(e) => update("password", e.target.value)} />
            </Field>
            <Field label="رابط الموقع"><input className="input" dir="ltr" placeholder="https://client-domain.com" value={editing.website_url ?? ""} onChange={(e) => update("website_url", e.target.value)} /></Field>
            <Field label="رابط لوحة التحكم"><input className="input" dir="ltr" placeholder="https://client-domain.com/wp-admin" value={editing.admin_url ?? ""} onChange={(e) => update("admin_url", e.target.value)} /></Field>
            <Field label="نوع الموقع">
              <select className="input" value={editing.website_type ?? "wordpress"} onChange={(e) => update("website_type", e.target.value)}>
                {WEBSITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="طريقة المصادقة">
              <select className="input" value={editing.auth_method ?? "sso_token"} onChange={(e) => update("auth_method", e.target.value)}>
                {AUTH_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف العميل" message={`هل أنت متأكد من حذف "${deleting?.name}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
