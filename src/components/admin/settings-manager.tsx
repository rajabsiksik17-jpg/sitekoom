"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";

type SettingsMap = Record<string, Record<string, unknown>>;

const tabs = [
  { key: "general", label: "عام" },
  { key: "seo", label: "SEO" },
  { key: "contact", label: "التواصل والبريد" },
  { key: "appearance", label: "المظهر" },
];

export function SettingsManager() {
  const { push } = useToast();
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("*");
    const map: SettingsMap = {};
    (data ?? []).forEach((r) => (map[r.key] = r.value as Record<string, unknown>));
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(key: string, field: string, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), [field]: value } }));
  }

  async function save(key: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_settings").upsert({ key, value: settings[key] ?? {} });
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ الإعدادات");
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const g = settings.general ?? {};
  const seo = settings.seo ?? {};
  const contact = settings.contact ?? {};
  const appearance = settings.appearance ?? {};

  return (
    <div className="space-y-6">
      <PageTitle title="الإعدادات" description="إعدادات الموقع العامة."
        action={<button type="button" onClick={() => save(tab)} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700"}`}>{t.label}</button>
        ))}
      </div>

      <div className="card p-6">
        {tab === "general" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الشركة (عربي)"><input className="input" value={String(g.company_name_ar ?? "")} onChange={(e) => update("general", "company_name_ar", e.target.value)} /></Field>
            <Field label="Company Name (EN)"><input className="input" dir="ltr" value={String(g.company_name_en ?? "")} onChange={(e) => update("general", "company_name_en", e.target.value)} /></Field>
            <Field label="الشعار (نص)"><input className="input" value={String(g.tagline_ar ?? "")} onChange={(e) => update("general", "tagline_ar", e.target.value)} /></Field>
            <Field label="Tagline (EN)"><input className="input" dir="ltr" value={String(g.tagline_en ?? "")} onChange={(e) => update("general", "tagline_en", e.target.value)} /></Field>
            <Field label="البريد الإلكتروني"><input className="input" dir="ltr" value={String(g.email ?? "")} onChange={(e) => update("general", "email", e.target.value)} /></Field>
            <Field label="الهاتف"><input className="input" dir="ltr" value={String(g.phone ?? "")} onChange={(e) => update("general", "phone", e.target.value)} /></Field>
            <Field label="واتساب"><input className="input" dir="ltr" value={String(g.whatsapp ?? "")} onChange={(e) => update("general", "whatsapp", e.target.value)} /></Field>
            <Field label="رسالة واتساب الافتراضية"><input className="input" value={String(g.whatsapp_message ?? "")} onChange={(e) => update("general", "whatsapp_message", e.target.value)} /></Field>
            <Field label="العنوان (عربي)"><input className="input" value={String(g.address_ar ?? "")} onChange={(e) => update("general", "address_ar", e.target.value)} /></Field>
            <Field label="Address (EN)"><input className="input" dir="ltr" value={String(g.address_en ?? "")} onChange={(e) => update("general", "address_en", e.target.value)} /></Field>
            <Field label="رابط خرائط جوجل"><input className="input" dir="ltr" value={String(g.google_maps_url ?? "")} onChange={(e) => update("general", "google_maps_url", e.target.value)} /></Field>
            <Field label="رابط Embed لخرائط جوجل" hint="رابط Google Maps Embed (يبدأ بـ https://www.google.com/maps...). يستخدم داخل iframe."><input className="input" dir="ltr" value={String(g.google_maps_embed_url ?? "")} onChange={(e) => update("general", "google_maps_embed_url", e.target.value)} /></Field>
            <Field label="ساعات العمل"><input className="input" value={String(g.working_hours_ar ?? "")} onChange={(e) => update("general", "working_hours_ar", e.target.value)} /></Field>
            <Field label="الشعار"><ImageUpload value={String(g.logo ?? "")} onChange={(url) => update("general", "logo", url)} folder="settings" /></Field>
            <Field label="الأيقونة (Favicon)"><ImageUpload value={String(g.favicon ?? "")} onChange={(url) => update("general", "favicon", url)} folder="settings" /></Field>
            <Field label="عرض شعار الهيدر — Desktop (px)"><input className="input" dir="ltr" type="number" value={Number(g.logo_width_desktop ?? 170)} onChange={(e) => update("general", "logo_width_desktop", Number(e.target.value))} /></Field>
            <Field label="عرض شعار الهيدر — Tablet (px)"><input className="input" dir="ltr" type="number" value={Number(g.logo_width_tablet ?? 140)} onChange={(e) => update("general", "logo_width_tablet", Number(e.target.value))} /></Field>
            <Field label="عرض شعار الهيدر — Mobile (px)"><input className="input" dir="ltr" type="number" value={Number(g.logo_width_mobile ?? 120)} onChange={(e) => update("general", "logo_width_mobile", Number(e.target.value))} /></Field>
            <Field label="عرض شعار من نحن — Desktop (px)"><input className="input" dir="ltr" type="number" value={Number(g.about_logo_width_desktop ?? 96)} onChange={(e) => update("general", "about_logo_width_desktop", Number(e.target.value))} /></Field>
            <Field label="عرض شعار من نحن — Laptop (px)"><input className="input" dir="ltr" type="number" value={Number(g.about_logo_width_laptop ?? 84)} onChange={(e) => update("general", "about_logo_width_laptop", Number(e.target.value))} /></Field>
            <Field label="عرض شعار من نحن — Tablet (px)"><input className="input" dir="ltr" type="number" value={Number(g.about_logo_width_tablet ?? 72)} onChange={(e) => update("general", "about_logo_width_tablet", Number(e.target.value))} /></Field>
            <Field label="عرض شعار من نحن — Mobile (px)"><input className="input" dir="ltr" type="number" value={Number(g.about_logo_width_mobile ?? 64)} onChange={(e) => update("general", "about_logo_width_mobile", Number(e.target.value))} /></Field>
          </div>
        )}

        {tab === "seo" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان الموقع"><input className="input" value={String(seo.site_title ?? "")} onChange={(e) => update("seo", "site_title", e.target.value)} /></Field>
            <Field label="Meta Description"><textarea className="input" value={String(seo.meta_description ?? "")} onChange={(e) => update("seo", "meta_description", e.target.value)} /></Field>
            <Field label="الكلمات المفتاحية"><input className="input" value={String(seo.keywords ?? "")} onChange={(e) => update("seo", "keywords", e.target.value)} /></Field>
            <Field label="Google Verification"><input className="input" dir="ltr" value={String(seo.google_verification ?? "")} onChange={(e) => update("seo", "google_verification", e.target.value)} /></Field>
            <Field label="Bing Verification"><input className="input" dir="ltr" value={String(seo.bing_verification ?? "")} onChange={(e) => update("seo", "bing_verification", e.target.value)} /></Field>
            <Field label="Google Analytics ID"><input className="input" dir="ltr" placeholder="G-XXXXXXXXXX" value={String(seo.analytics_id ?? "")} onChange={(e) => update("seo", "analytics_id", e.target.value)} /></Field>
            <Field label="GTM Container ID"><input className="input" dir="ltr" placeholder="GTM-XXXXXXX" value={String(seo.gtm_id ?? "")} onChange={(e) => update("seo", "gtm_id", e.target.value)} /></Field>
          </div>
        )}

        {tab === "contact" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="بريد استقبال الطلبات"><input className="input" dir="ltr" value={String(contact.destination_email ?? "")} onChange={(e) => update("contact", "destination_email", e.target.value)} /></Field>
            <Field label="رد تلقائي">
              <label className="flex items-center gap-2 pt-3 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(contact.auto_reply)} onChange={(e) => update("contact", "auto_reply", e.target.checked)} className="rounded border-brand-200 text-brand-600" /> تفعيل الرد التلقائي
              </label>
            </Field>
            <Field label="SMTP Host"><input className="input" dir="ltr" value={String(contact.smtp_host ?? "")} onChange={(e) => update("contact", "smtp_host", e.target.value)} /></Field>
            <Field label="SMTP Port"><input className="input" dir="ltr" type="number" value={Number(contact.smtp_port ?? 587)} onChange={(e) => update("contact", "smtp_port", Number(e.target.value))} /></Field>
            <Field label="SMTP User"><input className="input" dir="ltr" value={String(contact.smtp_user ?? "")} onChange={(e) => update("contact", "smtp_user", e.target.value)} /></Field>
            <Field label="SMTP Password"><input className="input" dir="ltr" type="password" value={String(contact.smtp_pass ?? "")} onChange={(e) => update("contact", "smtp_pass", e.target.value)} /></Field>
          </div>
        )}

        {tab === "appearance" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="اللون الأساسي"><input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String(appearance.primary_color ?? "#7a1aff")} onChange={(e) => update("appearance", "primary_color", e.target.value)} /></Field>
            <Field label="اللون الثانوي"><input type="color" className="h-12 w-full cursor-pointer rounded-xl border border-brand-100" value={String(appearance.secondary_color ?? "#9d72ff")} onChange={(e) => update("appearance", "secondary_color", e.target.value)} /></Field>
            <Field label="الوضع الليلي">
              <select className="input" value={String(appearance.dark_mode ?? "system")} onChange={(e) => update("appearance", "dark_mode", e.target.value)}>
                <option value="system">حسب النظام</option>
                <option value="light">فاتح</option>
                <option value="dark">داكن</option>
              </select>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
