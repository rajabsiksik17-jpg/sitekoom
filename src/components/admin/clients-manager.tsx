"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Save, FolderCog } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, ConfirmDialog, Modal } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import type { Client } from "@/lib/types";

const WEBSITE_TYPES = ["wordpress", "woocommerce", "custom", "other"];
const CREDENTIAL_TYPES = [
  { value: "none", label: "بدون" },
  { value: "wordpress", label: "WordPress" },
  { value: "custom", label: "مخصص" },
];

interface CreateForm {
  name: string; company: string; email: string; phone: string; username: string; password: string;
  preferred_language: "ar" | "en"; status: "active" | "inactive";
  website_name: string; website_domain: string; website_url: string; website_type: string; website_admin_url: string; website_status: string;
  login_username: string; login_email: string; login_password: string; credentials_type: string;
  plan: string; start_date: string; duration_months: number; renewal_price: number; covers_domain: boolean; covers_hosting: boolean;
}

const emptyForm: CreateForm = {
  name: "", company: "", email: "", phone: "", username: "", password: "",
  preferred_language: "ar", status: "active",
  website_name: "", website_domain: "", website_url: "", website_type: "wordpress", website_admin_url: "", website_status: "active",
  login_username: "", login_email: "", login_password: "", credentials_type: "wordpress",
  plan: "", start_date: "", duration_months: 12, renewal_price: 0, covers_domain: true, covers_hosting: true,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 border-b border-brand-50 pb-2 text-sm font-bold text-brand-700">{children}</h3>;
}

export function ClientsManager() {
  const { push } = useToast();
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Client> & { password?: string } | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name, company, email, phone, username, website_url, admin_url, website_type, auth_method, status, preferred_language, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setFormField(field: keyof CreateForm, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setEditField(field: string, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function create() {
    if (!form.name.trim() || !form.username.trim()) return push("error", "أدخل الاسم واسم المستخدم");
    if (!form.password) return push("error", "كلمة المرور مطلوبة");
    setSaving(true);
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        username: form.username,
        password: form.password,
        preferred_language: form.preferred_language,
        status: form.status,
        website: form.website_name
          ? {
              name: form.website_name,
              domain: form.website_domain,
              website_url: form.website_url,
              website_type: form.website_type,
              admin_url: form.website_admin_url,
              status: form.website_status,
              login_username: form.login_username,
              login_email: form.login_email,
              login_password: form.login_password,
              credentials_type: form.credentials_type,
            }
          : undefined,
        subscription: form.duration_months
          ? {
              plan: form.plan,
              start_date: form.start_date,
              duration_months: form.duration_months,
              renewal_price: form.renewal_price,
              covers_domain: form.covers_domain,
              covers_hosting: form.covers_hosting,
            }
          : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return push("error", data.error ?? "فشل الإنشاء");
    push("success", "تم إنشاء العميل بنجاح");
    setCreating(false);
    setForm(emptyForm);
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.username?.trim()) return push("error", "أدخل الاسم واسم المستخدم");
    if (!editing.id && !editing.password) return push("error", "كلمة المرور مطلوبة");
    setSaving(true);
    const res = await fetch("/api/admin/clients", {
      method: "PATCH",
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
        action={<button type="button" onClick={() => { setForm(emptyForm); setCreating(true); }} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عميل</button>}
      />

      {items.length === 0 ? (
        <EmptyState title="لا يوجد عملاء" action={<button type="button" onClick={() => { setForm(emptyForm); setCreating(true); }} className="btn-primary px-4 py-2.5"><Plus className="h-4 w-4" /> إضافة عميل</button>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-start text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">العميل</th>
                <th className="px-4 py-3 text-start font-semibold">Username</th>
                <th className="px-4 py-3 text-start font-semibold">الهاتف</th>
                <th className="px-4 py-3 text-start font-semibold">الموقع</th>
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
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{c.website_url ?? "—"}</td>
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

      {/* Create wizard */}
      <Modal open={creating} onClose={() => setCreating(false)} title="إضافة عميل جديد" size="lg"
        footer={<><button type="button" onClick={() => setCreating(false)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={create} className="btn-primary px-6 py-2" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الإنشاء..." : "إنشاء العميل"}</button></>}>
        <div className="space-y-6">
          <div>
            <SectionTitle>بيانات العميل</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" required><input className="input" value={form.name} onChange={(e) => setFormField("name", e.target.value)} /></Field>
              <Field label="اسم الشركة"><input className="input" value={form.company} onChange={(e) => setFormField("company", e.target.value)} /></Field>
              <Field label="البريد الإلكتروني"><input className="input" dir="ltr" type="email" value={form.email} onChange={(e) => setFormField("email", e.target.value)} /></Field>
              <Field label="رقم الهاتف"><input className="input" dir="ltr" value={form.phone} onChange={(e) => setFormField("phone", e.target.value)} /></Field>
              <Field label="Username" required><input className="input" dir="ltr" value={form.username} onChange={(e) => setFormField("username", e.target.value)} /></Field>
              <Field label="كلمة المرور" required hint="تُخزَّن مشفّرة ولا تُعرض أبدًا">
                <input className="input" dir="ltr" type="password" value={form.password} onChange={(e) => setFormField("password", e.target.value)} />
              </Field>
              <Field label="اللغة المفضلة">
                <select className="input" value={form.preferred_language} onChange={(e) => setFormField("preferred_language", e.target.value)}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </Field>
              <Field label="حالة العميل">
                <select className="input" value={form.status} onChange={(e) => setFormField("status", e.target.value)}>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </Field>
            </div>
          </div>

          <div>
            <SectionTitle>بيانات الموقع</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الموقع"><input className="input" value={form.website_name} onChange={(e) => setFormField("website_name", e.target.value)} /></Field>
              <Field label="الدومين"><input className="input" dir="ltr" value={form.website_domain} onChange={(e) => setFormField("website_domain", e.target.value)} /></Field>
              <Field label="Website URL"><input className="input" dir="ltr" value={form.website_url} onChange={(e) => setFormField("website_url", e.target.value)} /></Field>
              <Field label="نوع الموقع">
                <select className="input" value={form.website_type} onChange={(e) => setFormField("website_type", e.target.value)}>
                  {WEBSITE_TYPES.map((t) => <option key={t} value={t}>{t === "wordpress" ? "WordPress" : t === "woocommerce" ? "WooCommerce" : t === "custom" ? "Custom Website" : "Other"}</option>)}
                </select>
              </Field>
              <Field label="رابط لوحة التحكم / الدخول"><input className="input" dir="ltr" value={form.website_admin_url} onChange={(e) => setFormField("website_admin_url", e.target.value)} /></Field>
              <Field label="حالة الموقع">
                <select className="input" value={form.website_status} onChange={(e) => setFormField("website_status", e.target.value)}>
                  <option value="active">نشط</option>
                  <option value="maintenance">صيانة</option>
                  <option value="suspended">موقوف</option>
                </select>
              </Field>
            </div>
          </div>

          <div>
            <SectionTitle>بيانات دخول الموقع (حساب منفصل عن حساب Sitekoom)</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="طريقة الدخول">
                <select className="input" value={form.credentials_type} onChange={(e) => setFormField("credentials_type", e.target.value)}>
                  {CREDENTIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Username للموقع"><input className="input" dir="ltr" value={form.login_username} onChange={(e) => setFormField("login_username", e.target.value)} /></Field>
              <Field label="بريد الموقع"><input className="input" dir="ltr" type="email" value={form.login_email} onChange={(e) => setFormField("login_email", e.target.value)} /></Field>
              <Field label="كلمة مرور الموقع" hint="تُشفَّر ولا تظهر أبدًا في الواجهة أو الروابط">
                <input className="input" dir="ltr" type="password" value={form.login_password} onChange={(e) => setFormField("login_password", e.target.value)} />
              </Field>
            </div>
          </div>

          <div>
            <SectionTitle>الاشتراك (اختياري)</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الخطة"><input className="input" value={form.plan} onChange={(e) => setFormField("plan", e.target.value)} /></Field>
              <Field label="تاريخ بداية الاشتراك"><input className="input" type="date" value={form.start_date} onChange={(e) => setFormField("start_date", e.target.value)} /></Field>
              <Field label="مدة الاشتراك">
                <select className="input" value={form.duration_months} onChange={(e) => setFormField("duration_months", Number(e.target.value))}>
                  <option value={0}>بدون</option>
                  <option value={1}>1 شهر</option>
                  <option value={3}>3 أشهر</option>
                  <option value={6}>6 أشهر</option>
                  <option value={12}>1 سنة</option>
                  <option value={24}>سنتان</option>
                </select>
              </Field>
              <Field label="قيمة التجديد (JOD)"><input className="input" dir="ltr" type="number" value={form.renewal_price} onChange={(e) => setFormField("renewal_price", Number(e.target.value))} /></Field>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.covers_domain} onChange={(e) => setFormField("covers_domain", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> يشمل الدومين (نفس المدة)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.covers_hosting} onChange={(e) => setFormField("covers_hosting", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> يشمل الاستضافة (نفس المدة)
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit client basics */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="تعديل عميل" size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={saveEdit} className="btn-primary px-6 py-2" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button></>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم العميل"><input className="input" value={editing.name ?? ""} onChange={(e) => setEditField("name", e.target.value)} /></Field>
            <Field label="اسم الشركة"><input className="input" value={editing.company ?? ""} onChange={(e) => setEditField("company", e.target.value)} /></Field>
            <Field label="البريد الإلكتروني"><input className="input" dir="ltr" type="email" value={editing.email ?? ""} onChange={(e) => setEditField("email", e.target.value)} /></Field>
            <Field label="رقم الهاتف"><input className="input" dir="ltr" value={editing.phone ?? ""} onChange={(e) => setEditField("phone", e.target.value)} /></Field>
            <Field label="Username"><input className="input" dir="ltr" value={editing.username ?? ""} onChange={(e) => setEditField("username", e.target.value)} /></Field>
            <Field label="كلمة المرور" hint={editing.id ? "اتركها فارغة لعدم تغييرها" : "تُخزَّن مشفّرة ولا تُعرض أبدًا"}>
              <input className="input" dir="ltr" type="password" value={editing.password ?? ""} onChange={(e) => setEditField("password", e.target.value)} />
            </Field>
            <Field label="رابط الموقع"><input className="input" dir="ltr" value={editing.website_url ?? ""} onChange={(e) => setEditField("website_url", e.target.value)} /></Field>
            <Field label="رابط لوحة التحكم"><input className="input" dir="ltr" value={editing.admin_url ?? ""} onChange={(e) => setEditField("admin_url", e.target.value)} /></Field>
            <Field label="اللغة المفضلة">
              <select className="input" value={editing.preferred_language ?? "ar"} onChange={(e) => setEditField("preferred_language", e.target.value)}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label="الحالة">
              <select className="input" value={editing.status ?? "active"} onChange={(e) => setEditField("status", e.target.value)}>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="حذف العميل" message={`هل أنت متأكد من حذف "${deleting?.name}"؟`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
