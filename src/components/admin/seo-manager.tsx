"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageTitle, Spinner } from "@/components/admin/ui";
import { SeoFields } from "@/components/admin/seo-fields";
import { cn } from "@/lib/utils";
import type { Service, Project, Article } from "@/lib/types";

const staticPages = [
  { key: "home", label: "الرئيسية" },
  { key: "about", label: "من نحن" },
  { key: "services", label: "الخدمات" },
  { key: "projects", label: "الأعمال" },
  { key: "blog", label: "الأخبار" },
  { key: "request-project", label: "طلب مشروع" },
  { key: "contact", label: "اتصل بنا" },
];

export function SeoManager() {
  const [tab, setTab] = useState("pages");
  const [services, setServices] = useState<Service[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [active, setActive] = useState<{ type: string; id?: string | null; label: string }>({ type: "home", id: null, label: "الرئيسية" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("services").select("id,title_ar,title_en").is("deleted_at", null).order("sort"),
      supabase.from("projects").select("id,title_ar,title_en").is("deleted_at", null).order("sort"),
      supabase.from("articles").select("id,title_ar,title_en").is("deleted_at", null).order("created_at", { ascending: false }),
    ]).then(([s, p, a]) => {
      setServices((s.data ?? []) as Service[]);
      setProjects((p.data ?? []) as Project[]);
      setArticles((a.data ?? []) as Article[]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <PageTitle title="SEO" description="إدارة تحسين محركات البحث لكل الصفحات والمحتوى." />
      <div className="mb-6 flex gap-2">
        {[
          { key: "pages", label: "الصفحات" },
          { key: "services", label: "الخدمات" },
          { key: "projects", label: "الأعمال" },
          { key: "articles", label: "المقالات" },
        ].map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("rounded-lg px-4 py-2 text-sm font-semibold", tab === t.key ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700")}>{t.label}</button>
        ))}
      </div>

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
    </div>
  );
}
