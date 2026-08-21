"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field } from "@/components/admin/fields";

export function IntegrationsManager() {
  const { push } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "integrations").single();
    setValues((data?.value as Record<string, string>) ?? {});
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_settings").upsert({ key: "integrations", value: values });
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ التكاملات");
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <PageTitle title="التكاملات" description="ربط الموقع بخدمات جوجل."
        action={<button type="button" onClick={save} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>} />

      <div className="card space-y-6 p-6">
        <div className="rounded-xl border border-brand-100 p-5">
          <h3 className="mb-1 font-bold text-ink-900">Google Search Console</h3>
          <p className="mb-4 text-xs text-gray-500">ضع كود التحقق من Search Console لتفعيل الربط دون تعديل الكود.</p>
          <Field label="رمز التحقق"><input className="input" dir="ltr" placeholder="google-site-verification=..." value={values.google_verification ?? ""} onChange={(e) => setValues((v) => ({ ...v, google_verification: e.target.value }))} /></Field>
        </div>

        <div className="rounded-xl border border-brand-100 p-5">
          <h3 className="mb-4 font-bold text-ink-900">Google Analytics</h3>
          <Field label="Measurement ID"><input className="input" dir="ltr" placeholder="G-XXXXXXXXXX" value={values.google_analytics_id ?? ""} onChange={(e) => setValues((v) => ({ ...v, google_analytics_id: e.target.value }))} /></Field>
        </div>

        <div className="rounded-xl border border-brand-100 p-5">
          <h3 className="mb-4 font-bold text-ink-900">Google Tag Manager</h3>
          <Field label="Container ID"><input className="input" dir="ltr" placeholder="GTM-XXXXXXX" value={values.google_tag_manager_id ?? ""} onChange={(e) => setValues((v) => ({ ...v, google_tag_manager_id: e.target.value }))} /></Field>
        </div>

        <div className="rounded-xl border border-brand-100 p-5">
          <h3 className="mb-4 font-bold text-ink-900">Google Maps</h3>
          <Field label="Maps URL"><input className="input" dir="ltr" value={values.google_maps_url ?? ""} onChange={(e) => setValues((v) => ({ ...v, google_maps_url: e.target.value }))} /></Field>
          <Field label="Maps API Key (اختياري)"><input className="input" dir="ltr" value={values.google_maps_api_key ?? ""} onChange={(e) => setValues((v) => ({ ...v, google_maps_api_key: e.target.value }))} /></Field>
        </div>
      </div>
    </div>
  );
}
