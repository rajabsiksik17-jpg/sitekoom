import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProjectCard } from "@/components/project-card";
import { Reveal } from "@/components/reveal";
import { localize, formatDate } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getProjectBySlug, getProjects, getProjectPortfolioItems, getServices, getServiceCategories } from "@/lib/queries";
import { ProjectPortfolio } from "@/components/project-portfolio";
import { ProjectRequestForm } from "@/components/project-request-form";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: { locale: "ar" | "en"; slug: string } }): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return {};
  const supabase = createClient();
  const { data: seo } = await supabase
    .from("seo_metadata")
    .select("*")
    .eq("entity_type", "project")
    .eq("entity_id", project.id)
    .eq("locale", params.locale)
    .maybeSingle();
  const title = params.locale === "ar" ? project.title_ar : project.title_en;
  return {
    title: seo?.seo_title || title,
    description: seo?.meta_description || (params.locale === "ar" ? project.short_desc_ar : project.short_desc_en) || undefined,
    openGraph: {
      title: seo?.og_title || title,
      images: (seo?.og_image || project.cover_image || project.thumbnail)
        ? [{ url: seo?.og_image || project.cover_image || project.thumbnail! }]
        : undefined,
    },
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { locale: "ar" | "en"; slug: string };
}) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;

  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const settings = await getSettings();
  const [allServices, allCategories] = await Promise.all([getServices(), getServiceCategories()]);

  const title = localize(locale, project.title_ar, project.title_en);
  const fullDesc = localize(locale, project.full_desc_ar, project.full_desc_en);
  const shortDesc = localize(locale, project.short_desc_ar, project.short_desc_en);
  const category = localize(locale, project.category?.name_ar, project.category?.name_en);
  const service = localize(locale, project.service?.title_ar, project.service?.title_en);

  const gallery = project.images ?? [];
  const portfolioItems = await getProjectPortfolioItems(project.id);

  const allProjects = await getProjects();
  const related = allProjects
    .filter((p) => p.id !== project.id && (p.category_id === project.category_id || p.service_id === project.service_id))
    .slice(0, 3);
  const fallbackRelated = related.length ? related : allProjects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <>
      <PageHero title={title} subtitle={shortDesc} pageKey="project">
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {category && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">{category}</span>
          )}
          {service && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">{service}</span>
          )}
          {project.completion_date && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
              {formatDate(project.completion_date, locale)}
            </span>
          )}
        </div>
      </PageHero>

      <div className="container-site py-12">
        <Breadcrumbs
          locale={locale}
          items={[
            { name: dict.nav.projects, path: "/projects" },
            { name: title, path: `/projects/${project.slug}` },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {portfolioItems.length > 0 ? (
              <ProjectPortfolio items={portfolioItems} description={fullDesc ?? undefined} locale={locale} />
            ) : (
              <>
                {fullDesc && (
                  <div className="prose-site" dangerouslySetInnerHTML={{ __html: fullDesc }} />
                )}

                {gallery.length > 0 && (
                  <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {gallery.map((img) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={img.id} src={img.url} alt={img.alt ?? title} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="space-y-6">
            {project.technologies.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 font-bold text-ink-900">{dict.service.technologies}</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((t) => (
                    <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.project_url && (
              <a
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full px-5 py-3"
              >
                {dict.common.viewProject}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </aside>
        </div>
      </div>

      {fallbackRelated.length > 0 && (
        <section className="bg-brand-50/40 py-16">
          <div className="container-site">
            <h2 className="mb-8 text-2xl font-extrabold text-ink-900">{dict.service.relatedProjects}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackRelated.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.general.show_project_cta !== false && (
        <section className="container-site py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-2 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{dict.common.startProject}</h2>
            <p className="mb-8 text-center text-gray-600">{dict.quote.subtitle}</p>
            <div className="card p-6 sm:p-8">
              <ProjectRequestForm
                services={allServices}
                categories={allCategories}
                initialServiceId={project.service_id ?? undefined}
                context={{
                  source: "portfolio",
                  sourcePage: `/projects/${project.slug}`,
                  sourceRefId: project.id,
                  sourceType: "portfolio",
                  sourceWorkId: project.id,
                  sourceWorkTitle: title,
                }}
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
