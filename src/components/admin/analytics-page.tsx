"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { VisitorsChart, BarChartWidget } from "@/components/admin/charts";

type Event = { event_type: string; entity_id: string | null; entity_type: string | null; created_at: string; referrer: string | null; utm_source: string | null };

const PERIODS = [
  { key: "7d", label: "آخر 7 أيام", days: 7 },
  { key: "30d", label: "آخر 30 يوم", days: 30 },
  { key: "90d", label: "آخر 90 يوم", days: 90 },
];

export function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = PERIODS.find((p) => p.key === period)?.days ?? 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createClient();
    setLoading(true);
    supabase
      .from("analytics_events")
      .select("event_type,entity_id,entity_type,created_at,referrer,utm_source")
      .gte("created_at", since)
      .order("created_at")
      .then(({ data }) => {
        setEvents((data ?? []) as Event[]);
        setLoading(false);
      });
  }, [period]);

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const daily = buildDaily(pageViews, PERIODS.find((p) => p.key === period)?.days ?? 7);

  const topServices = topEntity(events.filter((e) => e.event_type === "service_view"));
  const topProjects = topEntity(events.filter((e) => e.event_type === "project_view"));
  const topArticles = topEntity(events.filter((e) => e.event_type === "article_view"));

  const sources = topSource(events.filter((e) => e.utm_source || e.referrer));

  const stats = [
    { label: "مشاهدات الصفحات", value: pageViews.length },
    { label: "مشاهدات الخدمات", value: events.filter((e) => e.event_type === "service_view").length },
    { label: "مشاهدات المشاريع", value: events.filter((e) => e.event_type === "project_view").length },
    { label: "مشاهدات المقالات", value: events.filter((e) => e.event_type === "article_view").length },
    { label: "نقرات واتساب", value: events.filter((e) => e.event_type === "whatsapp_clicked").length },
    { label: "طلبات التواصل", value: events.filter((e) => e.event_type === "contact_form_submitted").length },
  ];

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <PageTitle title="التحليلات" description="تحليل أداء الموقع."
        action={
          <div className="flex gap-1 rounded-xl border border-brand-100 p-1">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${period === p.key ? "bg-brand-gradient text-white" : "text-gray-500"}`}>{p.label}</button>
            ))}
          </div>
        } />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-ink-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-bold text-ink-900">الزيارات عبر الوقت</h2>
        <VisitorsChart data={daily} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6"><h2 className="mb-4 font-bold text-ink-900">أكثر الخدمات زيارة</h2><BarChartWidget data={topServices} /></div>
        <div className="card p-6"><h2 className="mb-4 font-bold text-ink-900">أكثر المشاريع زيارة</h2><BarChartWidget data={topProjects} /></div>
        <div className="card p-6"><h2 className="mb-4 font-bold text-ink-900">أكثر المقالات زيارة</h2><BarChartWidget data={topArticles} /></div>
        <div className="card p-6"><h2 className="mb-4 font-bold text-ink-900">مصادر الزيارات</h2><BarChartWidget data={sources} /></div>
      </div>
    </div>
  );
}

function buildDaily(events: Event[], days: number) {
  const result: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ label: d.toLocaleDateString("en", { day: "numeric", month: "short" }), value: events.filter((e) => e.created_at.slice(0, 10) === key).length });
  }
  return result;
}

function topEntity(events: Event[]) {
  const counts = new Map<string, number>();
  events.forEach((e) => { if (e.entity_id) counts.set(e.entity_id, (counts.get(e.entity_id) ?? 0) + 1); });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([, v], i) => ({ label: `#${i + 1}`, value: v }));
}

function topSource(events: Event[]) {
  const counts = new Map<string, number>();
  events.forEach((e) => { const s = e.utm_source || (e.referrer ? "direct/referrer" : "direct"); counts.set(s, (counts.get(s) ?? 0) + 1); });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k, value: v }));
}
