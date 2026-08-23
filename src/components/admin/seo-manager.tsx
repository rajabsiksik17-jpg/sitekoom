"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { SeoFields } from "@/components/admin/seo-fields";
import { cn } from "@/lib/utils";
import type { Service, Project, Article, SeoMetadata } from "@/lib/types";

const staticPages = [
  { key: "home", label: "الرئيسية" },
  { key: "about", label: "من نحن" },
  { key: "services", label: "الخدمات" },
  { key: "projects", label: "الأعمال" },
  { key: "blog", label: "الأخبار" },
  { key: "request-project", label: "طلب مشروع" },
  { key: "contact", label: "اتصل بنا" },
];

const SENTINEL = "00000000-0000-0000-0000-000000000000";

type Health = "complete" | "partial" | "missing";

function seoHealth(rows: SeoMetadata[], entityType: string, entityId: string | null): Health {
  const id = entityId ?? SENTINEL;
  const relevant = rows.filter((r) => r.entity_type === entityType && r.entity_id === id);
  const ar = relevant.find((r) => r.locale === "ar");
  const en = relevant.find((r) => r.locale === "en");
  const arOk = !!(ar?.seo_title && ar?.meta_description);
  const enOk = !!(en?.seo_title && en?.meta_description);
  if (arOk && enOk) return "complete";
  if (arOk || enOk || relevant.length > 0) return "partial";
  return "missing";
}

const healthMeta: Record<Health, { label: string; color: string }> = {
  complete: { label: "مكتمل", color: "bg-green-100 text-green-700" },
  partial: { label: "يحتاج تحسين", color: "bg-amber-100 text-amber-700" },
  missing: { label: "ناقص", color: "bg-red-100 text-red-700" },
};

export function SeoManager() {
  const [tab, setTab] = useState("pages");
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [seoRows, setSeoRows] = useState<SeoMetadata[]>([]);
  const [active, setActive] = useState<{ type: string; id?: string | null; label: string }>({ type: "home", id: null, label: "الرئيسية" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("services").select("id,title_ar,title_en").is("deleted_at", null).order("sort"),
      supabase.from("projects").select("id,title_ar,title_en").is("deleted_at", null).order("sort"),
      supabase.from("articles").select("id,title_ar,title_en").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("seo_metadata").select("*"),
    ]).then(([s, p, a, seo]) => {
      setServices((s.data ?? []) as Service[]);
      setProjects((p.data ?? []) as Project[]);
      setArticles((a.data ?? []) as Article[]);
      setSeoRows((seo.data ?? []) as SeoMetadata[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const groups: { key: string; label: string; count: number; counts: Record<Health, number> }[] = [
    { key: "pages", label: "الصفحات", count: staticPages.length, counts: { complete: 0, partial: 0, missing: 0 } },
    { key: "services", label: "الخدمات", count: services.length, counts: { complete: 0, partial: 0, missing: 0 } },
    { key: "projects", label: "الأعمال", count: projects.length, counts: { complete: 0, partial: 0, missing: 0 } },
    { key: "articles", label: "المقالات", count: articles.length, counts: { complete: 0, partial: 0, missing: 0 } },
  ];

  for (const p of staticPages) groups[0].counts[seoHealth(seoRows, p.key, null)]++;
  for (const s of services) groups[1].counts[seoHealth(seoRows, "service", s.id)]++;
  for (const pr of projects) groups[2].counts[seoHealth(seoRows, "project", pr.id)]++;
  for (const a of articles) groups[3].counts[seoHealth(seoRows, "article", a.id)]++;

  return (
    <div>
      <PageTitle title="SEO" description="إدارة تحسين محركات البحث لكل الصفحات والمحتوى." />
      <div className="mb-6 flex gap-2">
        {[
          { key: "pages", label: "الصفحات" },
          { key: "services", label: "الخدمات" },
          { key: "projects", label: "الأعمال" },
          { key: "articles", label: "المقالات" },
          { key: "health", label: "الصحة" },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-lg px-4 py-2 text-sm font-semibold", tab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{t.label}</button>
        ))}
      </div>

      {tab === "health" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.key} className="card p-5">
              <p className="font-bold text-ink-900">{g.label}</p>
              <p className="mt-1 text-3xl font-extrabold text-ink-900">{g.count}</p>
              <div className="mt-3 space-y-1.5">
                {(Object.keys(healthMeta) as Health[]).map((h) => (
                  <div key={h} className="flex items-center justify-between text-sm">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", healthMeta[h].color)}>{healthMeta[h].label}</span>
                    <span className="font-semibold text-gray-600">{g.counts[h]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="card p-3">
            <ul className="space-y-1">
              {tab === "pages" && staticPages.map((p) => (
                <li key={p.key}>
                  <button type="button" onClick={() => setActive({ type: p.key, id: null, label: p.label })} className={cn("w-full rounded-lg px-3 py-2 text-start text-sm font-medium", active.type === p.key && active.id === null ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50")}>{p.label}</button>
                </li>
              ))}
              {tab === "services" && services.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setActive({ type: "service", id: s.id, label: s.title_ar })} className={cn("w-full rounded-lg px-3 py-2 text-start text-sm font-medium", active.type === "service" && active.id === s.id ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50")}>{s.title_ar}</button>
                </li>
              ))}
              {tab === "projects" && projects.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setActive({ type: "project", id: p.id, label: p.title_ar })} className={cn("w-full rounded-lg px-3 py-2 text-start text-sm font-medium", active.type === "project" && active.id === p.id ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50")}>{p.title_ar}</button>
                </li>
              ))}
              {tab === "articles" && articles.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setActive({ type: "article", id: a.id, label: a.title_ar })} className={cn("w-full rounded-lg px-3 py-2 text-start text-sm font-medium", active.type === "article" && active.id === a.id ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50")}>{a.title_ar}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6 lg:col-span-3">
            <h2 className="mb-4 text-lg font-bold text-ink-900">{active.label}</h2>
            <SeoFields entityType={active.type} entityId={active.id} />
          </div>
        </div>
      )}
    </div>
  );
}
