import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { Marquee } from "@/components/home/marquee";
import { Reveal } from "@/components/reveal";
import { ProjectCard } from "@/components/project-card";
import { OfferCard } from "@/components/offer-card";
import { AchievementCard } from "@/components/achievement-card";
import { Icon } from "@/components/icon";
import { ContactForm } from "@/components/contact-form";
import { CompanyVideoSection } from "@/components/home/company-video-section";
import { StatisticsSection } from "@/components/home/statistics-section";
import { CtaSection } from "@/components/home/cta-section";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { localizePath } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
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
  getOffers,
  getAchievements,
} from "@/lib/queries";

export async function generateMetadata({ params }: { params: { locale: "ar" | "en" } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: seo } = await supabase
    .from("seo_metadata")
    .select("seo_title, meta_description, keywords, og_title, og_description, og_image")
    .eq("entity_type", "home")
    .is("entity_id", null)
    .eq("locale", params.locale)
    .maybeSingle();

  return {
    title: seo?.seo_title || undefined,
    description: seo?.meta_description || undefined,
    keywords: seo?.keywords ?? undefined,
    openGraph: {
      title: seo?.og_title || seo?.seo_title || undefined,
      description: seo?.og_description || seo?.meta_description || undefined,
      images: seo?.og_image ? [{ url: seo.og_image }] : undefined,
    },
    alternates: {
      canonical: params.locale === "ar" ? "/" : "/en",
      languages: {
        ar: "/",
        en: "/en",
      },
    },
  };
}

export default async function HomePage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const p = (path: string) => localizePath(path, locale);

  const [sliders, marquee, sections, services, categories, projects, company, stats, social, offers, achievements] = await Promise.all([
    getSliders(),
    getMarqueeMessages(),
    getHomepageSections(),
    getServices(),
    getServiceCategories(),
    getProjects(),
    getCompanyInfo(),
    getStatistics(),
    getSocialLinks(),
    getOffers(),
    getAchievements(),
  ]);

  const sectionMap = Object.fromEntries(sections.map((s) => [s.key, s]));
  const isActive = (key: string) => sectionMap[key]?.is_active !== false;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const whyItems = (locale === "ar" ? company?.why_ar : company?.why_en) ?? [];
  const featuredProjects = projects.slice(0, 6);
  const featuredOffers = offers.slice(0, Number(sectionMap.offers?.data?.limit ?? 3));
  const featuredAchievements = achievements.slice(0, Number(sectionMap.achievements?.data?.limit ?? 6));

  const offersData = sectionMap.offers?.data ?? {};
  const offersBgType = String(offersData.bg_type ?? "gradient");
  let offersBgStyle: React.CSSProperties = {};
  let offersBgImage: string | null = null;
  let offersBgImageOpacity = 1;
  if (offersBgType === "solid") {
    offersBgStyle = { backgroundColor: String(offersData.bg_color ?? "#0b0a1a") };
  } else if (offersBgType === "image" && offersData.bg_image) {
    offersBgImage = String(offersData.bg_image);
    offersBgImageOpacity = Number(offersData.bg_image_opacity ?? 100) / 100;
  } else {
    const colors = (offersData.bg_colors as string[] | undefined) ?? ["#0b0a1a", "#2c036e"];
    offersBgStyle = { backgroundImage: `linear-gradient(${Number(offersData.bg_angle ?? 135)}deg, ${colors.join(", ")})` };
  }
  const offersOverlayColor = String(offersData.bg_overlay_color ?? "");
  const offersOverlayOpacity = Number(offersData.bg_overlay_opacity ?? 0) / 100;

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

      {isActive("offers") && featuredOffers.length > 0 && (
        <section className="relative overflow-hidden py-20" style={offersBgStyle}>
          {offersBgImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offersBgImage} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: offersBgImageOpacity }} loading="lazy" />
          )}
          {offersOverlayColor && offersOverlayOpacity > 0 && (
            <div className="absolute inset-0" style={{ backgroundColor: offersOverlayColor, opacity: offersOverlayOpacity }} />
          )}
          <div className="container-site relative">
            <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  {localize(locale, sectionMap.offers?.title_ar, sectionMap.offers?.title_en) ?? (locale === "ar" ? "عروض مميزة" : "Featured Offers")}
                </h2>
                <p className="mt-3 text-white/70">
                  {localize(locale, sectionMap.offers?.description_ar, sectionMap.offers?.description_en) ?? (locale === "ar" ? "عروض أسعار مميزة لحلولنا الرقمية" : "Special pricing on our digital solutions")}
                </p>
              </div>
              {offers.length > featuredOffers.length && (
                <Link href={p("/offers")} className="btn-secondary bg-white/10 px-5 py-2.5 text-white hover:bg-white/20">
                  {locale === "ar" ? "رؤية جميع العروض" : "View all offers"}
                  <Arrow className="h-4 w-4" />
                </Link>
              )}
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredOffers.map((o, i) => (
                <Reveal key={o.id} delay={i * 60}>
                  <OfferCard offer={o} locale={locale} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {offers.length > 0 ? (
        <>
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

          {isActive("statistics") && stats.length > 0 && (
            <StatisticsSection
              locale={locale}
              title={localize(locale, sectionMap.statistics?.title_ar, sectionMap.statistics?.title_en) ?? dict.home.statsTitle}
              stats={stats}
              data={sectionMap.statistics?.data ?? {}}
            />
          )}
        </>
      ) : (
        <>
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
        </>
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

      {isActive("achievements") && featuredAchievements.length > 0 && (
        <section className="container-site py-20">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
                {localize(locale, sectionMap.achievements?.title_ar, sectionMap.achievements?.title_en) ?? (locale === "ar" ? "إنجازاتنا" : "Our Achievements")}
              </h2>
              <p className="mt-3 text-gray-600">
                {localize(locale, sectionMap.achievements?.description_ar, sectionMap.achievements?.description_en) ?? (locale === "ar" ? "مشاريع وتجارب نفخر بها" : "Projects and experiences we are proud of")}
              </p>
            </div>
            {achievements.length > featuredAchievements.length && (
              <Link href={p("/achievements")} className="btn-secondary px-5 py-2.5">
                {locale === "ar" ? "رؤية المزيد" : "View more"}
                <Arrow className="h-4 w-4" />
              </Link>
            )}
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAchievements.map((a, i) => (
              <Reveal key={a.id} delay={i * 60}>
                <AchievementCard achievement={a} locale={locale} />
              </Reveal>
            ))}
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
