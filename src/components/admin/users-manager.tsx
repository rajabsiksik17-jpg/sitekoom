"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { formatDateTime } from "@/lib/utils";
import type { User, Role, AdminLoginLog } from "@/lib/types";

function parseUA(ua: string | null): string {
  const u = ua ?? "";
  const browser = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "Browser";
  const os = /Windows/.test(u) ? "Windows" : /Mac OS/.test(u) ? "macOS" : /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : /Linux/.test(u) ? "Linux" : "Device";
  return `${browser} · ${os}`;
}

export function UsersManager() {
  const { push } = useToast();
  const [items, setItems] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [historyFor, setHistoryFor] = useState<User | null>(null);
  const [logs, setLogs] = useState<AdminLoginLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role_id: "" });
  const [resetPass, setResetPass] = useState("");
  const [editForm, setEditForm] = useState({ name: "", email: "", role_id: "", notify_email: true });

  const load = useCallback(async () => {
    const supabase = createClient();
    const [u, r] = await Promise.all([
      supabase.from("users").select("*, role:roles(*)").is("deleted_at", null).order("created_at"),
      supabase.from("roles").select("*").order("created_at"),
    ]);
    setItems((u.data ?? []) as User[]);
    setRoles((r.data ?? []) as Role[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createUser() {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return push("error", data.error ?? "فشل إنشاء المستخدم");
    push("success", "تم إنشاء المستخدم");
    setCreating(false);
    setForm({ email: "", password: "", name: "", role_id: "" });
    load();
  }

  async function updateRole(id: string, role_id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ role_id: role_id || null }).eq("id", id);
    if (error) return push("error", error.message);
    load();
  }

  async function toggleStatus(item: User) {
    const action = item.status === "active" ? "disable" : "enable";
    const res = await fetch("/api/admin/users/manage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, action }),
    });
    if (!res.ok) return push("error", "فشل العملية");
    push("success", action === "disable" ? "تم تعطيل المستخدم" : "تم تفعيل المستخدم");
    load();
  }

  async function doReset() {
    if (!resetFor) return;
    if (resetPass.length < 8) return push("error", "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    const res = await fetch("/api/admin/users/manage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: resetFor.id, action: "reset", password: resetPass }),
    });
    if (!res.ok) return push("error", "فشل إعادة التعيين");
    push("success", "تم إعادة تعيين كلمة المرور");
    setResetFor(null);
    setResetPass("");
  }

  async function saveEdit() {
    if (!editing) return;
    const res = await fetch("/api/admin/users/manage", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, action: "update", name: editForm.name, email: editForm.email, role_id: editForm.role_id || null, notify_email: editForm.notify_email }),
    });
    const data = await res.json();
    if (!res.ok) return push("error", data.error ?? "فشل التحديث");
    push("success", "تم تحديث المستخدم");
    setEditing(null);
    load();
  }

  async function openHistory(u: User) {
    setHistoryFor(u);
    setLogsLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("admin_login_logs").select("*").eq("user_id", u.id).order("created_at", { ascending: false }).limit(50);
    setLogs((data ?? []) as AdminLoginLog[]);
    setLogsLoading(false);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const supabase = createClient();
    await supabase.from("users").update({ deleted_at: new Date().toISOString() }).eq("id", deleting.id);
    setDeleting(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="المستخدمون" description="إدارة فريق العمل والصلاحيات."
        action={<button type="button" onClick={() => setCreating(true)} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة مستخدم</button>} />

      {items.length === 0 ? (
        <EmptyState title="لا يوجد مستخدمون" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">المستخدم</th>
                <th className="px-4 py-3 text-start font-semibold">الدور</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">إشعارات البريد</th>
                <th className="px-4 py-3 text-start font-semibold">آخر دخول</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600">{u.name[0] ?? "U"}</span>}
                      <div>
                        <p className="font-medium text-ink-900">{u.name}</p>
                        <p className="text-xs text-gray-400" dir="ltr">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select className="rounded-lg border border-brand-100 px-2 py-1 text-xs" value={u.role_id ?? ""} onChange={(e) => updateRole(u.id, e.target.value)}>
                      <option value="">بدون دور</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleStatus(u)}><Badge color={u.status === "active" ? "green" : "red"}>{u.status === "active" ? "نشط" : "معطّل"}</Badge></button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.notify_email ? "green" : "gray"}>{u.notify_email ? "مفعّل" : "معطّل"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.last_login_at ? formatDateTime(u.last_login_at, "ar") : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => { setEditing(u); setEditForm({ name: u.name, email: u.email ?? "", role_id: u.role_id ?? "", notify_email: u.notify_email }); }} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" title="تعديل"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setResetFor(u)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" title="إعادة تعيين كلمة المرور"><KeyRound className="h-4 w-4" /></button>
                      <button type="button" onClick={() => openHistory(u)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50" title="سجل الدخول"><History className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setDeleting(u)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="إضافة مستخدم" size="sm"
        footer={<><button type="button" onClick={() => setCreating(false)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={createUser} className="btn-primary px-6 py-2">إنشاء</button></>}>
        <div className="space-y-4">
          <Field label="الاسم"><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="البريد الإلكتروني"><input className="input" dir="ltr" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="كلمة المرور" hint="8 أحرف على الأقل"><input className="input" dir="ltr" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></Field>
          <Field label="الدور">
            <select className="input" value={form.role_id} onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}>
              <option value="">بدون دور</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="تعديل مستخدم" size="sm"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={saveEdit} className="btn-primary px-6 py-2">حفظ</button></>}>
        <div className="space-y-4">
          <Field label="الاسم"><input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="البريد الإلكتروني"><input className="input" dir="ltr" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="الدور">
            <select className="input" value={editForm.role_id} onChange={(e) => setEditForm((f) => ({ ...f, role_id: e.target.value }))}>
              <option value="">بدون دور</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={editForm.notify_email} onChange={(e) => setEditForm((f) => ({ ...f, notify_email: e.target.checked }))} className="rounded border-brand-200 text-brand-600" /> تفعيل إشعارات البريد
          </label>
        </div>
      </Modal>

      <Modal open={!!resetFor} onClose={() => setResetFor(null)} title="إعادة تعيين كلمة المرور" size="sm"
        footer={<><button type="button" onClick={() => setResetFor(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={doReset} className="btn-primary px-6 py-2">إعادة تعيين</button></>}>
        <Field label="كلمة المرور الجديدة"><input className="input" dir="ltr" type="password" value={resetPass} onChange={(e) => setResetPass(e.target.value)} /></Field>
      </Modal>

      <Modal open={!!historyFor} onClose={() => setHistoryFor(null)} title={`سجل دخول ${historyFor?.name ?? ""}`} size="md">
        {logsLoading ? <div className="flex justify-center py-8"><Spinner /></div> : logs.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">لا يوجد سجل دخول.</p> : (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 p-3 text-sm">
                <Badge color={l.success ? "green" : "red"}>{l.success ? "ناجح" : "فاشل"}</Badge>
                <span className="flex-1 text-gray-600">{formatDateTime(l.created_at, "ar")}</span>
                <span className="text-xs text-gray-500">{parseUA(l.user_agent)}</span>
                {l.ip_address && <span className="text-xs text-gray-400" dir="ltr">{l.ip_address}</span>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف المستخدم" message={`هل أنت متأكد من حذف "${deleting?.name}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
