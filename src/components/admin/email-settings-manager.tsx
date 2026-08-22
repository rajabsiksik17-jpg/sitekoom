"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Save, Send, RefreshCcw, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Badge, Spinner, EmptyState, Modal } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { cn } from "@/lib/utils";
import type { EmailLog, EmailTemplate } from "@/lib/types";

type Tab = "smtp" | "templates" | "logs";

const tabs: { key: Tab; label: string }[] = [
  { key: "smtp", label: "إعدادات SMTP / IMAP" },
  { key: "templates", label: "قوالب البريد" },
  { key: "logs", label: "سجل الإرسال" },
];

export function EmailSettingsManager() {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("smtp");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "email").single();
    setSettings((data?.value as Record<string, unknown>) ?? {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: unknown) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  async function save() {
    setSaving(true);
    const { error } = await createClient().from("site_settings").upsert({ key: "email", value: settings });
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ إعدادات البريد");
  }

  async function test() {
    setTesting(true);
    const res = await fetch("/api/admin/email/test", { method: "POST" });
    const data = await res.json();
    setTesting(false);
    if (res.ok) push("success", "تم إرسال البريد التجريبي بنجاح");
    else push("error", data.error ?? "فشل إرسال البريد التجريبي");
  }

  async function checkRenewals() {
    setChecking(true);
    const res = await fetch("/api/admin/email/renewal-check", { method: "POST" });
    const data = await res.json();
    setChecking(false);
    if (res.ok) push("success", `تم الفحص: ${data.sent} تذكير مرسل`);
    else push("error", data.error ?? "فشل الفحص");
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="البريد الإلكتروني" description="إعدادات SMTP/IMAP وقوالب البريد وسجل الإرسال."
        action={
          <button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2.5">
            <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-xl px-4 py-2.5 text-sm font-semibold", tab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "smtp" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-ink-900"><Mail className="h-5 w-5 text-brand-600" /> SMTP (إرسال)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SMTP Host"><input className="input" dir="ltr" value={String(settings.smtp_host ?? "")} onChange={(e) => set("smtp_host", e.target.value)} /></Field>
              <Field label="SMTP Port"><input className="input" dir="ltr" type="number" value={Number(settings.smtp_port ?? 587)} onChange={(e) => set("smtp_port", Number(e.target.value))} /></Field>
              <Field label="SMTP Username"><input className="input" dir="ltr" value={String(settings.smtp_username ?? "")} onChange={(e) => set("smtp_username", e.target.value)} /></Field>
              <Field label="SMTP Password"><input className="input" dir="ltr" type="password" value={String(settings.smtp_password ?? "")} onChange={(e) => set("smtp_password", e.target.value)} /></Field>
              <Field label="التشفير">
                <select className="input" value={String(settings.smtp_encryption ?? "tls")} onChange={(e) => set("smtp_encryption", e.target.value)}>
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">بدون</option>
                </select>
              </Field>
              <Field label="اسم المرسل"><input className="input" value={String(settings.from_name ?? "Sitekoom")} onChange={(e) => set("from_name", e.target.value)} /></Field>
              <Field label="بريد المرسل"><input className="input" dir="ltr" value={String(settings.from_email ?? "")} onChange={(e) => set("from_email", e.target.value)} /></Field>
              <Field label="بريد استقبال الإشعارات"><input className="input" dir="ltr" value={String(settings.notification_email ?? "")} onChange={(e) => set("notification_email", e.target.value)} /></Field>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 font-bold text-ink-900">IMAP (استقبال)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="IMAP Host"><input className="input" dir="ltr" value={String(settings.imap_host ?? "")} onChange={(e) => set("imap_host", e.target.value)} /></Field>
              <Field label="IMAP Port"><input className="input" dir="ltr" type="number" value={Number(settings.imap_port ?? 993)} onChange={(e) => set("imap_port", Number(e.target.value))} /></Field>
              <Field label="IMAP Username"><input className="input" dir="ltr" value={String(settings.imap_username ?? "")} onChange={(e) => set("imap_username", e.target.value)} /></Field>
              <Field label="IMAP Password"><input className="input" dir="ltr" type="password" value={String(settings.imap_password ?? "")} onChange={(e) => set("imap_password", e.target.value)} /></Field>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={test} disabled={testing} className="btn-primary px-5 py-2.5"><Send className="h-4 w-4" /> {testing ? "جارٍ الإرسال..." : "إرسال بريد تجريبي"}</button>
              <button type="button" onClick={checkRenewals} disabled={checking} className="btn-secondary px-5 py-2.5"><RefreshCcw className="h-4 w-4" /> {checking ? "جارٍ الفحص..." : "تشغيل فحص التجديدات"}</button>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(settings.otp_enabled)} onChange={(e) => set("otp_enabled", e.target.checked)} className="rounded border-brand-200 text-brand-600" />
                تفعيل رمز التحقق (OTP) عند دخول الأدمن
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === "templates" && <TemplatesTab />}
      {tab === "logs" && <LogsTab />}
    </div>
  );
}

function TemplatesTab() {
  const { push } = useToast();
  const [items, setItems] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("email_templates").select("*").order("key");
    setItems((data ?? []) as EmailTemplate[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function set(field: string, value: string) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const { error } = await createClient().from("email_templates").update({
      subject_ar: editing.subject_ar,
      subject_en: editing.subject_en,
      body_ar: editing.body_ar,
      body_en: editing.body_en,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) return push("error", error.message);
    push("success", "تم حفظ القالب");
    setEditing(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState title="لا توجد قوالب" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">المفتاح</th>
                <th className="px-4 py-3 text-start font-semibold">العنوان (عربي)</th>
                <th className="px-4 py-3 text-start font-semibold">Subject (EN)</th>
                <th className="px-4 py-3 text-end font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3"><Badge color="gray">{t.key}</Badge></td>
                  <td className="px-4 py-3 text-gray-600">{t.subject_ar}</td>
                  <td className="px-4 py-3 text-gray-600" dir="ltr">{t.subject_en}</td>
                  <td className="px-4 py-3 text-end">
                    <button type="button" onClick={() => setEditing(t)} className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"><Pencil className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`تعديل قالب: ${editing?.key}`} size="lg"
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn-secondary px-4 py-2">إلغاء</button><button type="button" onClick={save} disabled={saving} className="btn-primary px-6 py-2"><Save className="h-4 w-4" /> حفظ</button></>}>
        {editing && (
          <div className="space-y-4">
            <Bilingual label="العنوان" ar={editing.subject_ar ?? ""} en={editing.subject_en ?? ""} onAr={(v) => set("subject_ar", v)} onEn={(v) => set("subject_en", v)} />
            <Bilingual label="المحتوى" type="textarea" ar={editing.body_ar ?? ""} en={editing.body_en ?? ""} onAr={(v) => set("body_ar", v)} onEn={(v) => set("body_en", v)} />
            <p className="text-xs text-gray-400">المتغيرات المتاحة: {"{name} {site} {service} {expiry_date} {days_left} {amount} {portal_url}"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LogsTab() {
  const [items, setItems] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(100);
    setItems((data ?? []) as EmailLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      {items.length === 0 ? (
        <EmptyState title="لا يوجد سجل إرسال" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">النوع</th>
                <th className="px-4 py-3 text-start font-semibold">المستلم</th>
                <th className="px-4 py-3 text-start font-semibold">الموضوع</th>
                <th className="px-4 py-3 text-start font-semibold">الحالة</th>
                <th className="px-4 py-3 text-start font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {items.map((l) => (
                <tr key={l.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 text-gray-500">{l.type ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500" dir="ltr">{l.recipient}</td>
                  <td className="px-4 py-3 text-gray-500">{l.subject}</td>
                  <td className="px-4 py-3"><Badge color={l.status === "sent" ? "green" : "red"}>{l.status === "sent" ? "تم الإرسال" : "فشل"}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(l.created_at).toLocaleString("ar-JO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
