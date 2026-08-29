import { PageHero } from "@/components/page-hero";
import { ProjectList } from "@/components/project-list";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getProjects, getServiceCategories, getServices, getHomepageSections } from "@/lib/queries";

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const dict = locale === "ar" ? ar : en;
  const [projects, categories, services, sections] = await Promise.all([
    getProjects(),
    getServiceCategories(),
    getServices(),
    getHomepageSections(),
  ]);
  const sec = sections.find((s) => s.key === "projects");

  // Only show services that actually have at least one published work.
  const projectServiceIds = new Set(projects.map((p) => p.service_id).filter(Boolean) as string[]);
  const servicesWithWork = services.filter((s) => projectServiceIds.has(s.id));

  return (
    <>
      <PageHero
        pageKey="projects"
        title={localize(locale, sec?.title_ar, sec?.title_en) ?? dict.nav.projects}
        subtitle={localize(locale, sec?.description_ar, sec?.description_en) ?? dict.home.projectsSubtitle}
      />
      <section className="container-site py-16">
        <ProjectList projects={projects} categories={categories} services={servicesWithWork} />
      </section>
    </>
  );
}
