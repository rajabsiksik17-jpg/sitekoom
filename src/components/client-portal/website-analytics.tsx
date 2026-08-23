"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, MousePointerClick, Timer, ArrowDownRight, Link2, PlugZap, Trash2, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface SiteOption {
  id: string;
  name: string;
  hasAnalytics: boolean;
  ga4_property_id?: string | null;
}

interface Ga4Data {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  timeSeries: { date: string; sessions: number; pageViews: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; sessions: number }[];
  countries: { country: string; sessions: number }[];
  sources: { source: string; sessions: number }[];
}

const periods = [
  { key: "today", label: "اليوم" },
  { key: "7", label: "7 أيام" },
  { key: "30", label: "30 يومًا" },
  { key: "90", label: "90 يومًا" },
  { key: "custom", label: "مخصص" },
];

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function deviceLabel(d: string): string {
  const map: Record<string, string> = { desktop: "كمبيوتر", mobile: "هاتف", tablet: "جهاز لوحي" };
  return map[d] ?? d;
}

export function WebsiteAnalytics({ sites, locale }: { sites: SiteOption[]; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [range, setRange] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<Ga4Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!siteId) return;
    const site = sites.find((s) => s.id === siteId);
    if (site && !site.hasAnalytics) {
      setData(null);
      setNotConnected(true);
      return;
    }
    let active = true;
    setLoading(true);
    setNotConnected(false);
    setError(false);
    const params = new URLSearchParams({ website_id: siteId, range });
    if (range === "custom") {
      if (customStart) params.set("start", customStart);
      if (customEnd) params.set("end", customEnd);
    }
    fetch(`/api/client/analytics?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setLoading(false);
        if (d.connected === false) setNotConnected(true);
        else if (d.error) setError(true);
        else setData(d.data as Ga4Data);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setError(true);
      });
    return () => {
      active = false;
    };
  }, [siteId, range, customStart, customEnd, sites]);

  const activeSite = sites.find((s) => s.id === siteId);

  function resetConnect() {
    setShowConnect(false);
    setPropertyId(activeSite?.ga4_property_id ?? "");
    setStatusMsg("");
  }

  async function saveConnect() {
    if (!siteId || !propertyId.trim()) return;
    setSaving(true);
    setStatusMsg("");
    const res = await fetch("/api/client/analytics/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website_id: siteId, ga4_property_id: propertyId.trim() }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) return setStatusMsg(d.error ?? "error");
    setStatusMsg(isAr ? "تم حفظ بيانات الربط. يمكنك الآن اختبار الاتصال." : "Connection saved. You can now test the connection.");
  }

  async function testConnect() {
    if (!siteId) return;
    setTesting(true);
    setStatusMsg("");
    const res = await fetch("/api/client/analytics/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website_id: siteId }),
    });
    const d = await res.json();
    setTesting(false);
    if (d.connected) {
      setStatusMsg(isAr ? `تم الاتصال بنجاح — ${d.sessions} جلسة خلال آخر 7 أيام.` : `Connection successful — ${d.sessions} sessions in the last 7 days.`);
    } else {
      setStatusMsg(d.error ?? (isAr ? "تعذر الاتصال." : "Connection failed."));
    }
  }

  async function disconnect() {
    if (!siteId) return;
    await fetch("/api/client/analytics/connect", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website_id: siteId }),
    });
    window.location.reload();
  }

  if (sites.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-gray-500">
        {t("لم يتم ربط إحصائيات هذا الموقع بعد.", "Analytics for this website are not connected yet.")}
      </div>
    );
  }

  const chartData = (data?.timeSeries ?? []).map((p) => ({
    date: p.date.slice(4),
    sessions: p.sessions,
    pageViews: p.pageViews,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {sites.length > 1 && (
          <select className="input w-auto" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <div className="flex flex-wrap gap-1 rounded-xl bg-brand-50 p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setRange(p.key)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", range === p.key ? "bg-brand-gradient text-white" : "text-brand-700 hover:bg-brand-100")}
            >
              {t(p.label, p.key === "today" ? "Today" : p.key === "custom" ? "Custom" : `${p.key} Days`)}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" && (
        <div className="flex flex-wrap gap-3">
          <input type="date" className="input w-auto" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <input type="date" className="input w-auto" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
        </div>
      )}

      {loading && <div className="card p-8 text-center text-sm text-gray-500">{t("جارٍ تحميل الإحصائيات...", "Loading analytics...")}</div>}

      {notConnected && (
        <div className="card p-10 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-ink-900">{t("لم يتم ربط Google Analytics بعد", "Google Analytics is not connected yet")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("اربط خاصية GA4 الخاصة بموقعك لعرض الزوار والجلسات ومشاهدات الصفحات.", "Connect your website's GA4 property to see visitors, sessions and page views.")}</p>

          {!showConnect ? (
            <button type="button" onClick={() => setShowConnect(true)} className="btn-primary mt-5 px-6 py-2.5">
              <Link2 className="h-4 w-4" /> {t("ربط Google Analytics", "Connect Google Analytics")}
            </button>
          ) : (
            <div className="mx-auto mt-5 max-w-sm space-y-3 text-start">
              <div>
                <label className="label">{t("GA4 Property ID", "GA4 Property ID")}</label>
                <input className="input" dir="ltr" placeholder="123456789" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
              </div>
              {statusMsg && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{statusMsg}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={saveConnect} disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t("حفظ", "Save")}
                </button>
                <button type="button" onClick={testConnect} disabled={testing} className="btn-secondary px-4 py-2 text-sm">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} {t("اختبار الاتصال", "Test connection")}
                </button>
                <button type="button" onClick={resetConnect} className="btn-ghost px-3 py-2 text-sm">{t("إلغاء", "Cancel")}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && !notConnected && (
        <div className="card p-8 text-center text-sm text-gray-500">{t("تعذر جلب الإحصائيات. يرجى التحقق من إعدادات Google Analytics.", "Could not fetch analytics. Please check the Google Analytics configuration.")}</div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => { setPropertyId(activeSite?.ga4_property_id ?? ""); setShowConnect(true); }} className="btn-secondary px-3 py-1.5 text-xs">
              <Link2 className="h-3.5 w-3.5" /> {t("إعادة الربط", "Reconnect")}
            </button>
            <button type="button" onClick={disconnect} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> {t("فصل الاتصال", "Disconnect")}
            </button>
          </div>

          {showConnect && (
            <div className="card space-y-3 p-4">
              <label className="label">{t("GA4 Property ID", "GA4 Property ID")}</label>
              <input className="input" dir="ltr" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
              {statusMsg && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{statusMsg}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={saveConnect} disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {t("حفظ", "Save")}</button>
                <button type="button" onClick={testConnect} disabled={testing} className="btn-secondary px-4 py-2 text-sm">{testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} {t("اختبار الاتصال", "Test connection")}</button>
                <button type="button" onClick={resetConnect} className="btn-ghost px-3 py-2 text-sm">{t("إلغاء", "Cancel")}</button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm text-gray-500"><Users className="h-4 w-4" /> {t("إجمالي المستخدمين", "Total users")}</p>
              <p className="mt-2 text-2xl font-extrabold text-ink-900">{data.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{t("جديد:", "New:")} {data.newUsers.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp className="h-4 w-4" /> {t("الجلسات", "Sessions")}</p>
              <p className="mt-2 text-2xl font-extrabold text-ink-900">{data.sessions.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm text-gray-500"><MousePointerClick className="h-4 w-4" /> {t("مشاهدات الصفحات", "Page views")}</p>
              <p className="mt-2 text-2xl font-extrabold text-ink-900">{data.pageViews.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm text-gray-500"><Timer className="h-4 w-4" /> {t("متوسط مدة الجلسة", "Avg session duration")}</p>
              <p className="mt-2 text-2xl font-extrabold text-ink-900">{formatDuration(data.avgSessionDuration)}</p>
              <p className="flex items-center gap-1 text-xs text-gray-400"><ArrowDownRight className="h-3 w-3" /> {t("معدل الارتداد:", "Bounce rate:")} {data.bounceRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 font-bold text-ink-900">{t("الزيارات عبر الوقت", "Traffic over time")}</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sessions" name={t("الجلسات", "Sessions")} stroke="#7a1aff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pageViews" name={t("مشاهدات الصفحات", "Page views")} stroke="#9d72ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {data.topPages.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-3 font-bold text-ink-900">{t("أكثر الصفحات زيارة", "Top pages")}</h3>
                <ul className="space-y-2">
                  {data.topPages.slice(0, 6).map((p) => (
                    <li key={p.path} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-gray-600" dir="ltr">{p.path}</span>
                      <span className="shrink-0 font-semibold text-brand-700">{p.views.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.devices.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-3 font-bold text-ink-900">{t("الأجهزة", "Devices")}</h3>
                <ul className="space-y-2">
                  {data.devices.map((d) => (
                    <li key={d.device} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-600">{deviceLabel(d.device)}</span>
                      <span className="font-semibold text-brand-700">{d.sessions.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.countries.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-3 font-bold text-ink-900">{t("الدول", "Countries")}</h3>
                <ul className="space-y-2">
                  {data.countries.slice(0, 6).map((c) => (
                    <li key={c.country} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-600">{c.country}</span>
                      <span className="font-semibold text-brand-700">{c.sessions.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {data.sources.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 font-bold text-ink-900">{t("مصادر الزيارات", "Traffic sources")}</h3>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((s) => (
                  <span key={s.source} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                    {s.source} · {s.sessions.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
