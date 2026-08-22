import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { Marquee } from "@/components/home/marquee";
import { Reveal } from "@/components/reveal";
import { ServiceCard } from "@/components/service-card";
import { ProjectCard } from "@/components/project-card";
import { Icon } from "@/components/icon";
import { ContactForm } from "@/components/contact-form";
import { CompanyVideoSection } from "@/components/home/company-video-section";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { localizePath } from "@/lib/i18n/config";
import {
  getSliders,
  getMarqueeMessages,
  getHomepageSections,
  getServices,
  getProjects,
  getCompanyInfo,
  getStatistics,
  getSocialLinks,
} from "@/lib/queries";

export default async function HomePage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const p = (path: string) => localizePath(path, locale);

  const [sliders, marquee, sections, services, projects, company, stats, social] = await Promise.all([
    getSliders(),
    getMarqueeMessages(),
    getHomepageSections(),
    getServices(),
    getProjects(),
    getCompanyInfo(),
    getStatistics(),
    getSocialLinks(),
  ]);

  const sectionMap = Object.fromEntries(sections.map((s) => [s.key, s]));
  const isActive = (key: string) => sectionMap[key]?.is_active !== false;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const whyItems = (locale === "ar" ? company?.why_ar : company?.why_en) ?? [];
  const featuredServices = services.filter((s) => s.is_featured).slice(0, 4);
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((s, i) => (
              <Reveal key={s.id} delay={i * 60}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
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
        <section className="bg-brand-gradient py-16 text-white">
          <div className="container-site">
            <h2 className="mb-10 text-center text-3xl font-extrabold">
              {localize(locale, sectionMap.statistics?.title_ar, sectionMap.statistics?.title_en) ??
                dict.home.statsTitle}
            </h2>
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s) => (
                <Reveal key={s.id} className="text-center">
                  <Icon name={s.icon} className="mx-auto mb-3 h-8 w-8 text-white/80" />
                  <p className="text-4xl font-extrabold">
                    {s.value}
                    {s.suffix}
                  </p>
                  <p className="mt-1 text-sm text-white/80">{localize(locale, s.label_ar, s.label_en)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
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

      {company?.video_url && (
        <CompanyVideoSection locale={locale} videoUrl={company.video_url} social={social} dict={dict} />
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
        <section className="container-site py-20">
          <Reveal className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-16 text-center text-white">
            <div className="absolute inset-0 bg-hero-gradient" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                {localize(locale, sectionMap.cta?.title_ar, sectionMap.cta?.title_en) ?? dict.home.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">{dict.home.ctaSubtitle}</p>
              <Link href={p("/contact")} className="btn-primary mt-8 px-8 py-3.5 text-base">
                {dict.common.startProject}
              </Link>
            </div>
          </Reveal>
        </section>
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
