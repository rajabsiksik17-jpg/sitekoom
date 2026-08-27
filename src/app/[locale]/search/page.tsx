import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { ServiceCard } from "@/components/service-card";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { localizePath } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import type { Service, Project } from "@/lib/types";

interface ArticleRow {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  cover_image: string | null;
  published_at: string | null;
}

export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { locale: "ar" | "en" };
  searchParams: { q?: string };
}) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const p = (path: string) => localizePath(path, locale);
  const query = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let services: Service[] = [];
  let projects: Project[] = [];
  let articles: ArticleRow[] = [];

  if (query) {
    const like = `%${query}%`;
    const [s, p, a] = await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("status", "published")
        .is("deleted_at", null)
        .or(`title_ar.ilike.${like},title_en.ilike.${like},short_desc_ar.ilike.${like},short_desc_en.ilike.${like}`),
      supabase
        .from("projects")
        .select("*")
        .eq("status_field", "published")
        .is("deleted_at", null)
        .or(`title_ar.ilike.${like},title_en.ilike.${like},short_desc_ar.ilike.${like},short_desc_en.ilike.${like}`),
      supabase
        .from("articles")
        .select("id,title_ar,title_en,slug,excerpt_ar,excerpt_en,cover_image,published_at")
        .eq("status", "published")
        .is("deleted_at", null)
        .or(`title_ar.ilike.${like},title_en.ilike.${like},excerpt_ar.ilike.${like},excerpt_en.ilike.${like}`),
    ]);
    services = (s.data ?? []) as Service[];
    projects = (p.data ?? []) as Project[];
    articles = (a.data ?? []) as ArticleRow[];
  }

  const total = services.length + projects.length + articles.length;

  return (
    <>
      <PageHero
        pageKey="search"
        title={dict.search.title}
        subtitle={query ? `${dict.search.resultsFor} "${query}"` : undefined}
      />
      <div className="container-site py-12">
        {!query ? (
          <p className="py-16 text-center text-gray-500">{dict.common.searchPlaceholder}</p>
        ) : total === 0 ? (
          <p className="py-16 text-center text-gray-500">{dict.common.noResults}</p>
        ) : (
          <div className="space-y-12">
            {services.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-extrabold text-ink-900">{dict.search.services}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => (
                    <ServiceCard key={s.id} service={s} />
                  ))}
                </div>
              </section>
            )}
            {projects.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-extrabold text-ink-900">{dict.search.projects}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </div>
              </section>
            )}
            {articles.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-extrabold text-ink-900">{dict.search.articles}</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((a) => (
                    <Reveal key={a.id}>
                      <Link href={p(`/blog/${a.slug}`)} className="card block overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow">
                        <div className="aspect-[16/9] overflow-hidden bg-brand-50">
                          {a.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.cover_image} alt={localize(locale, a.title_ar, a.title_en)} loading="lazy" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-ink-900">{localize(locale, a.title_ar, a.title_en)}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{localize(locale, a.excerpt_ar, a.excerpt_en)}</p>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
