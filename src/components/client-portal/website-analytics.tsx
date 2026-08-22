"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, MousePointerClick, Timer, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface SiteOption {
  id: string;
  name: string;
  hasAnalytics: boolean;
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
          <p className="font-semibold text-ink-900">{t("لم يتم ربط إحصائيات هذا الموقع بعد", "Analytics for this website are not connected yet")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("سيظهر هنا الزوار والجلسات ومشاهدات الصفحات بعد ربط Google Analytics.", "Visitors, sessions and page views will appear here once Google Analytics is connected.")}</p>
        </div>
      )}

      {error && !notConnected && (
        <div className="card p-8 text-center text-sm text-gray-500">{t("تعذر جلب الإحصائيات. يرجى التحقق من إعدادات Google Analytics.", "Could not fetch analytics. Please check the Google Analytics configuration.")}</div>
      )}

      {data && (
        <>
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
