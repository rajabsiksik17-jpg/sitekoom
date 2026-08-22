"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { Field, Bilingual } from "@/components/admin/fields";
import { ImageUpload } from "@/components/admin/image-upload";
import type { GeneralSettings } from "@/lib/settings";

export function FooterSettingsManager() {
  const { push } = useToast();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("site_settings").select("value").eq("key", "general").single();
    setSettings((data?.value as GeneralSettings) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(field: string, value: unknown) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_settings").upsert({ key: "general", value: settings });
    setSaving(false);
    if (error) push("error", error.message);
    else push("success", "تم حفظ إعدادات الفوتر");
  }

  if (loading || !settings) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <PageTitle
        title="الفوتر"
        description="إعدادات الفوتر: الشعار والوصف."
        action={<button type="button" onClick={save} className="btn-primary px-6 py-2.5" disabled={saving}><Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}</button>}
      />

      <div className="card space-y-6 p-6">
        <Field label="شعار الفوتر" hint="يظهر في أسفل الموقع. اتركه فارغًا لاستخدام اسم الشركة.">
          <ImageUpload value={settings.footer_logo ?? ""} onChange={(url) => update("footer_logo", url)} folder="settings" />
        </Field>

        <Bilingual label="وصف الفوتر" ar={settings.tagline_ar} en={settings.tagline_en} onAr={(v) => update("tagline_ar", v)} onEn={(v) => update("tagline_en", v)} type="textarea" />
      </div>
    </div>
  );
}
