import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { CompanyVideoSection } from "@/components/home/company-video-section";
import { CompanyInfoSection } from "@/components/home/company-info-section";
import { CounterValue } from "@/components/home/counter";
import { TeamCard } from "@/components/home/team-card";
import { TeamSlider } from "@/components/home/team-slider";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getCompanyInfo, getTeamMembers, getStatistics, getSocialLinks } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getAppointmentSettings, formatWorkingHours } from "@/lib/appointments";
import { getContentSections } from "@/lib/content-sections";
import { AboutProcessSectionView } from "@/components/about-process-section";
import { AboutTechnologySection } from "@/components/about-technology-section";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const dict = locale === "ar" ? ar : en;

  const [company, team, stats, social, settings, appointmentSettings, contentSections] = await Promise.all([
    getCompanyInfo(),
    getTeamMembers(),
    getStatistics(),
    getSocialLinks(),
    getSettings(),
    getAppointmentSettings(),
    getContentSections(),
  ]);

  const workingHours = formatWorkingHours(appointmentSettings, locale);

  const about = localize(locale, company?.about_ar, company?.about_en);
  const mission = localize(locale, company?.mission_ar, company?.mission_en);
  const vision = localize(locale, company?.vision_ar, company?.vision_en);
  const values = (locale === "ar" ? company?.values_ar : company?.values_en) ?? [];
  const whyItems = (locale === "ar" ? company?.why_ar : company?.why_en) ?? [];

  return (
    <>
      <PageHero title={dict.nav.about} subtitle={about} pageKey="about" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: dict.nav.about, path: "/about" }]} />

        {contentSections.about_process.enabled && (
          <AboutProcessSectionView data={contentSections.about_process} locale={locale} />
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {(mission || vision) && (
            <>
              {mission && (
                <Reveal className="card card-hover p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white">
                    <Icon name="target" className="h-6 w-6" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-ink-900">
                    {locale === "ar" ? "رسالتنا" : "Our Mission"}
                  </h2>
                  <p className="leading-relaxed text-gray-600">{mission}</p>
                </Reveal>
              )}
              {vision && (
                <Reveal className="card card-hover p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white">
                    <Icon name="eye" className="h-6 w-6" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-ink-900">
                    {locale === "ar" ? "رؤيتنا" : "Our Vision"}
                  </h2>
                  <p className="leading-relaxed text-gray-600">{vision}</p>
                </Reveal>
              )}
            </>
          )}
        </div>

        {values.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-extrabold text-ink-900">
              {locale === "ar" ? "قيمنا" : "Our Values"}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {values.map((v, i) => (
                <Reveal key={i} delay={i * 40}>
                  <div className="card card-hover flex h-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 sm:h-9 sm:w-9">
                      <Icon name="check-circle" className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-ink-900 sm:text-base">{v}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {company && company.video_url && (
          <div className="mt-4">
            <CompanyVideoSection locale={locale} company={company} social={social} dict={dict} />
          </div>
        )}

        {whyItems.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-extrabold text-ink-900">{dict.home.whyTitle}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {whyItems.map((w, i) => (
                <Reveal key={i} delay={i * 50}>
                  <div className="card card-hover h-full p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon name={w.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-bold text-ink-900">{w.title}</h3>
                    <p className="text-sm text-gray-600">{w.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {team.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-extrabold text-ink-900">
              {locale === "ar" ? "فريق العمل" : "Our Team"}
            </h2>
            {settings.team.display_type === "slider" ? (
              <TeamSlider members={team} locale={locale} autoplay={settings.team.autoplay} speed={settings.team.speed} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {team.map((m, i) => (
                  <Reveal key={m.id} delay={i * 50}>
                    <TeamCard member={m} locale={locale} />
                  </Reveal>
                ))}
              </div>
            )}
          </section>
        )}

        {stats.length > 0 && (
          <section className="mt-16 rounded-3xl bg-ink-900 p-6 sm:p-10">
            <div className="grid grid-cols-2 gap-4 text-center lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-white/20">
                  <p className="text-4xl font-extrabold text-brand-300">
                    <CounterValue value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-sm text-white/70">{localize(locale, s.label_ar, s.label_en)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {contentSections.about_technology.enabled && (
          <AboutTechnologySection data={contentSections.about_technology} locale={locale} />
        )}

        <CompanyInfoSection locale={locale} settings={settings.general} social={social} dict={dict} workingHours={workingHours} />
      </div>
    </>
  );
}
