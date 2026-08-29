"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/admin/toast";
import { PageTitle, Spinner, EmptyState } from "@/components/admin/ui";
import { Star, Trash2, RefreshCw, Plus } from "lucide-react";
import type { GoogleReview } from "@/lib/types";

type Settings = {
  enabled: boolean;
  count: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  maps_url: string;
  place_id: string;
  place_name: string;
  google_maps_uri: string;
  cache_hours: number;
  rating: number;
  total: number;
  last_updated: string;
};

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  count: 6,
  title_ar: "آراء عملائنا تصنع فرقنا",
  title_en: "Our Clients Are Our Best Work",
  description_ar: "عملاؤنا هم أهم أعمالنا، وتجاربهم هي أفضل شهادة على جودة ما نقدمه.",
  description_en: "Our clients are at the heart of everything we do.",
  maps_url: "",
  place_id: "",
  place_name: "",
  google_maps_uri: "",
  cache_hours: 24,
  rating: 0,
  total: 0,
  last_updated: "",
};

export function GoogleReviewsManager() {
  const { push } = useToast();
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: revs }, { data: st }, { data: integ }] = await Promise.all([
      supabase.from("google_reviews").select("*").order("sort").order("created_at"),
      supabase.from("site_settings").select("value").eq("key", "google_reviews").single(),
      supabase.from("site_settings").select("value").eq("key", "integrations").single(),
    ]);
    setReviews((revs ?? []) as GoogleReview[]);
    setSettings({ ...DEFAULT_SETTINGS, ...((st?.value as Partial<Settings>) ?? {}) });
    setApiKey(((integ?.value as { google_reviews_api_key?: string })?.google_reviews_api_key) ?? "");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveSettings() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("site_settings").upsert({ key: "google_reviews", value: settings });
    await supabase.from("site_settings").upsert({ key: "integrations", value: { google_reviews_api_key: apiKey } });
    setSaving(false);
    push("success", "تم حفظ الإعدادات");
    load();
  }

  async function fetchReviews() {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/google-reviews/fetch", { method: "POST", redirect: "error", cache: "no-store" });
      const contentType = res.headers.get("content-type") ?? "";
      let d: { success?: boolean; data?: { reviewCount?: number; rating?: number; total?: number; placeName?: string }; error?: string; details?: string } | null = null;

      if (contentType.includes("application/json")) {
        d = await res.json();
      } else {
        const body = await res.text();
        throw new Error(`استجابة غير متوقعة من الخادم (HTTP ${res.status}). تأكد أن الـroute يعيد JSON.`);
      }

      if (!res.ok || !d?.success) {
        const detail = d?.details ? ` — ${d.details}` : "";
        throw new Error(`${d?.error ?? `HTTP ${res.status}`}${detail}`);
      }

      push("success", `تم سحب ${d.data?.reviewCount ?? 0} تقييم — متوسط ${Number(d.data?.rating ?? 0).toFixed(1)} (${d.data?.total ?? 0} إجمالي)`);
      load();
    } catch (e) {
      push("error", e instanceof Error ? e.message : "فشل الجلب");
    } finally {
      setFetching(false);
    }
  }

  async function toggleActive(r: GoogleReview) {
    await createClient().from("google_reviews").update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  }

  async function remove(r: GoogleReview) {
    await createClient().from("google_reviews").delete().eq("id", r.id);
    load();
  }

  async function addReview() {
    await createClient().from("google_reviews").insert({ author_name: "عميل", rating: 5, is_active: true, sort: reviews.length });
    load();
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="Google Reviews" description="إدارة تقييمات Google وعرضها في الصفحة الرئيسية." action={<button type="button" onClick={fetchReviews} className="btn-primary px-4 py-2.5" disabled={fetching}><RefreshCw className={fetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> {fetching ? "جارٍ السحب..." : "سحب تقييمات Google"}</button>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4 p-6">
          <h3 className="font-bold text-ink-900">الإعدادات</h3>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))} className="rounded border-brand-200 text-brand-600" /> تفعيل القسم
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">العنوان (عربي)</label><input className="input" value={settings.title_ar} onChange={(e) => setSettings((s) => ({ ...s, title_ar: e.target.value }))} /></div>
            <div><label className="label">Title (EN)</label><input className="input" dir="ltr" value={settings.title_en} onChange={(e) => setSettings((s) => ({ ...s, title_en: e.target.value }))} /></div>
            <div><label className="label">الوصف (عربي)</label><textarea className="input" value={settings.description_ar} onChange={(e) => setSettings((s) => ({ ...s, description_ar: e.target.value }))} /></div>
            <div><label className="label">Description (EN)</label><textarea className="input" dir="ltr" value={settings.description_en} onChange={(e) => setSettings((s) => ({ ...s, description_en: e.target.value }))} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Google Maps URL</label><input className="input" dir="ltr" value={settings.maps_url} onChange={(e) => setSettings((s) => ({ ...s, maps_url: e.target.value }))} /></div>
            <div><label className="label">Google Place ID</label><input className="input" dir="ltr" value={settings.place_id} onChange={(e) => setSettings((s) => ({ ...s, place_id: e.target.value }))} /></div>
            <div><label className="label">عدد التقييمات في الرئيسية</label><input className="input" dir="ltr" type="number" value={settings.count} onChange={(e) => setSettings((s) => ({ ...s, count: Number(e.target.value) || 6 }))} /></div>
            <div><label className="label">Google Places API Key (يبقى على الخادم)</label><input className="input" dir="ltr" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} /></div>
          </div>
          <button type="button" onClick={saveSettings} className="btn-primary px-6 py-2.5" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</button>
        </div>

        <div className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-ink-900">التقييمات ({reviews.length})</h3>
            <button type="button" onClick={addReview} className="btn-secondary px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> إضافة</button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-brand-50/60 p-3 text-sm text-ink-700">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            متوسط التقييم: <b>{Number(settings.rating || 0).toFixed(1)}</b> — إجمالي التقييمات: <b>{settings.total || reviews.length}</b>
          </div>
          {settings.place_name && <p className="text-xs text-gray-500">النشاط: <b>{settings.place_name}</b></p>}
          {settings.last_updated && <p className="text-xs text-gray-400">آخر تحديث: {new Date(settings.last_updated).toLocaleString("ar")}</p>}
          {reviews.length === 0 ? <EmptyState title="لا توجد تقييمات" description="أضف تقييمات يدويًا أو استخدم زر التحديث مع Google Places API." /> : (
            <div className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="flex items-start gap-3 rounded-xl border border-brand-100 p-3">
                  {r.author_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.author_photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">{(r.author_name ?? "G").charAt(0)}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{r.author_name ?? "Google User"}</p>
                    <p className="flex items-center gap-1 text-xs text-amber-500"><Star className="h-3 w-3 fill-amber-400" /> {r.rating}</p>
                    {r.text && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{r.text}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button type="button" onClick={() => toggleActive(r)} className="rounded px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50">{r.is_active ? "إخفاء" : "إظهار"}</button>
                    <button type="button" onClick={() => remove(r)} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
