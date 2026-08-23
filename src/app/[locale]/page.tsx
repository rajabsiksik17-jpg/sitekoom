import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { Marquee } from "@/components/home/marquee";
import { Reveal } from "@/components/reveal";
import { ProjectCard } from "@/components/project-card";
import { Icon } from "@/components/icon";
import { ContactForm } from "@/components/contact-form";
import { CompanyVideoSection } from "@/components/home/company-video-section";
import { StatisticsSection } from "@/components/home/statistics-section";
import { CtaSection } from "@/components/home/cta-section";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { localizePath } from "@/lib/i18n/config";
import {
  getSliders,
  getMarqueeMessages,
  getHomepageSections,
  getServices,
  getServiceCategories,
  getProjects,
  getCompanyInfo,
  getStatistics,
  getSocialLinks,
} from "@/lib/queries";

export default async function HomePage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const p = (path: string) => localizePath(path, locale);

  const [sliders, marquee, sections, services, categories, projects, company, stats, social] = await Promise.all([
    getSliders(),
    getMarqueeMessages(),
    getHomepageSections(),
    getServices(),
    getServiceCategories(),
    getProjects(),
    getCompanyInfo(),
    getStatistics(),
    getSocialLinks(),
  ]);

  const sectionMap = Object.fromEntries(sections.map((s) => [s.key, s]));
  const isActive = (key: string) => sectionMap[key]?.is_active !== false;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const whyItems = (locale === "ar" ? company?.why_ar : company?.why_en) ?? [];
  const featuredProjects = projects.slice(0, 6);

  return (
    <>
      {isActive("hero") && <HeroSlider slides={sliders} />}

      {isActive("marquee") && <Marquee messages={marquee} />}

      {isActive("services") && (
        <section className="container-site py-20">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
              {localize(locale, sectionMap.services?.title_ar, sectionMap.services?.title_en) ?? dict.home.servicesTitle}
            </h2>
            <p className="mt-3 text-gray-600">
              {localize(locale, sectionMap.services?.description_ar, sectionMap.services?.description_en) ??
                dict.home.servicesSubtitle}
            </p>
          </Reveal>

          <div className="grid gap-8 lg:grid-cols-2">
            {categories.map((cat) => {
              const catServices = services.filter((s) => s.category_id === cat.id).slice(0, 6);
              return (
                <Reveal key={cat.id}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-brand-100/60 bg-white p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow">
                    <div className="pointer-events-none absolute -end-12 -top-12 h-44 w-44 rounded-full bg-brand-50 blur-3xl transition-opacity group-hover:opacity-100" />
                    <div className="relative">
                      <div className="mb-4 flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                          <Icon name={cat.icon} className="h-7 w-7" />
                        </span>
                        <h3 className="text-2xl font-extrabold text-ink-900">{localize(locale, cat.name_ar, cat.name_en)}</h3>
                      </div>
                      <p className="text-gray-600">{localize(locale, cat.description_ar, cat.description_en)}</p>

                      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {catServices.map((s) => (
                          <li key={s.id}>
                            <Link
                              href={p(`/services/${s.slug}`)}
                              className="flex items-center gap-3 rounded-xl border border-brand-100 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                                <Icon name={s.icon} className="h-4 w-4" />
                              </span>
                              <span className="text-sm font-semibold text-ink-900">{localize(locale, s.title_ar, s.title_en)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>

                      <Link href={p(`/services/category/${cat.slug}`)} className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
                        {locale === "ar" ? `رؤية خدمات ${localize(locale, cat.name_ar, cat.name_en)}` : `View ${localize(locale, cat.name_ar, cat.name_en)} services`}
                        <Arrow className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href={p("/services")} className="btn-primary px-6 py-3">
              {dict.home.viewMoreServices}
              <Arrow className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {isActive("statistics") && stats.length > 0 && (
        <StatisticsSection
          locale={locale}
          title={localize(locale, sectionMap.statistics?.title_ar, sectionMap.statistics?.title_en) ?? dict.home.statsTitle}
          stats={stats}
          data={sectionMap.statistics?.data ?? {}}
        />
      )}

      {isActive("why") && whyItems.length > 0 && (
        <section className="container-site py-20">
          <Reveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
              {localize(locale, sectionMap.why?.title_ar, sectionMap.why?.title_en) ?? dict.home.whyTitle}
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((w, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="card h-full p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon name={w.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-ink-900">{w.title}</h3>
                  <p className="text-sm text-gray-600">{w.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {company && company.video_url && (
        <CompanyVideoSection locale={locale} company={company} social={social} dict={dict} />
      )}

      {isActive("projects") && featuredProjects.length > 0 && (
        <section className="bg-brand-50/40 py-20">
          <div className="container-site">
            <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
                  {localize(locale, sectionMap.projects?.title_ar, sectionMap.projects?.title_en) ??
                    dict.home.projectsTitle}
                </h2>
                <p className="mt-3 text-gray-600">
                  {localize(locale, sectionMap.projects?.description_ar, sectionMap.projects?.description_en) ??
                    dict.home.projectsSubtitle}
                </p>
              </div>
              <Link href={p("/projects")} className="btn-secondary px-5 py-2.5">
                {dict.common.viewAll}
                <Arrow className="h-4 w-4" />
              </Link>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((p, i) => (
                <Reveal key={p.id} delay={i * 60}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {isActive("cta") && (
        <CtaSection
          locale={locale}
          title={localize(locale, sectionMap.cta?.title_ar, sectionMap.cta?.title_en) ?? dict.home.ctaTitle}
          subtitle={dict.home.ctaSubtitle}
          ctaText={dict.common.startProject}
          ctaHref={p("/contact")}
          data={sectionMap.cta?.data ?? {}}
        />
      )}

      {isActive("contact") && (
        <section className="container-site pb-24">
          <div className="mx-auto max-w-2xl">
            <Reveal className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-ink-900">{dict.contact.title}</h2>
              <p className="mt-3 text-gray-600">{dict.contact.subtitle}</p>
            </Reveal>
            <Reveal>
              <ContactForm context={{ source: "home", sourcePage: "/" }} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
