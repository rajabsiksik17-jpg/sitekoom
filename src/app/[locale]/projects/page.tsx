import { PageHero } from "@/components/page-hero";
import { ProjectList } from "@/components/project-list";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getProjects, getProjectCategories, getHomepageSections } from "@/lib/queries";

export default async function ProjectsPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const [projects, categories, sections] = await Promise.all([
    getProjects(),
    getProjectCategories(),
    getHomepageSections(),
  ]);
  const sec = sections.find((s) => s.key === "projects");

  return (
    <>
      <PageHero
        pageKey="projects"
        title={localize(locale, sec?.title_ar, sec?.title_en) ?? dict.nav.projects}
        subtitle={localize(locale, sec?.description_ar, sec?.description_en) ?? dict.home.projectsSubtitle}
      />
      <section className="container-site py-16">
        <ProjectList projects={projects} categories={categories} />
      </section>
    </>
  );
}
