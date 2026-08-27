import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { localize } from "@/lib/utils";
import { localizePath } from "@/lib/i18n/config";
import { getAchievementDetails, getServices } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: { locale: "ar" | "en"; slug: string } }): Promise<Metadata> {
  const { achievement } = (await getAchievementDetails(params.slug)) ?? {};
  if (!achievement) return {};
  const supabase = createClient();
  const { data: seo } = await supabase.from("seo_metadata").select("*").eq("entity_type", "achievement").eq("entity_id", achievement.id).eq("locale", params.locale).maybeSingle();
  const title = localize(params.locale, achievement.title_ar, achievement.title_en);
  const canonical = params.locale === "ar" ? `/achievements/${achievement.slug}` : `/en/achievements/${achievement.slug}`;
  return {
    title: seo?.seo_title || title,
    description: seo?.meta_description || localize(params.locale, achievement.short_desc_ar, achievement.short_desc_en) || undefined,
    openGraph: { title: seo?.og_title || title, description: seo?.og_description || undefined, images: (seo?.og_image || achievement.main_image) ? [{ url: seo?.og_image || achievement.main_image! }] : undefined },
    alternates: { canonical, languages: { ar: `/achievements/${achievement.slug}`, en: `/en/achievements/${achievement.slug}` } },
  };
}

export default async function AchievementDetailPage({ params }: { params: { locale: "ar" | "en"; slug: string } }) {
  const locale = params.locale;
  const p = (path: string) => localizePath(path, locale);
  const details = await getAchievementDetails(params.slug);
  if (!details) notFound();
  const { achievement, images, features } = details;

  const title = localize(locale, achievement.title_ar, achievement.title_en);
  const fullDesc = localize(locale, achievement.full_desc_ar, achievement.full_desc_en);
  const challenge = localize(locale, achievement.challenge_ar, achievement.challenge_en);
  const solution = localize(locale, achievement.solution_ar, achievement.solution_en);
  const results = localize(locale, achievement.results_ar, achievement.results_en);
  const services = await getServices();
  const relatedServices = services.filter((s) => achievement.service_ids?.includes(s.id)).slice(0, 4);

  return (
    <>
      <PageHero title={title} subtitle={localize(locale, achievement.short_desc_ar, achievement.short_desc_en)} pageKey="achievements" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: locale === "ar" ? "الإنجازات" : "Achievements", path: "/achievements" }, { name: title, path: `/achievements/${achievement.slug}` }]} />

        {achievement.main_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={achievement.main_image} alt={title} className="mb-10 w-full rounded-2xl object-cover shadow-card" />
        )}

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {fullDesc && <div className="prose-site" dangerouslySetInnerHTML={{ __html: fullDesc }} />}
            {challenge && (
              <section>
                <h2 className="mb-3 text-xl font-extrabold text-ink-900">{locale === "ar" ? "التحدي" : "Challenge"}</h2>
                <div className="prose-site" dangerouslySetInnerHTML={{ __html: challenge }} />
              </section>
            )}
            {solution && (
              <section>
                <h2 className="mb-3 text-xl font-extrabold text-ink-900">{locale === "ar" ? "الحل" : "Solution"}</h2>
                <div className="prose-site" dangerouslySetInnerHTML={{ __html: solution }} />
              </section>
            )}
            {results && (
              <section>
                <h2 className="mb-3 text-xl font-extrabold text-ink-900">{locale === "ar" ? "النتائج" : "Results"}</h2>
                <div className="prose-site" dangerouslySetInnerHTML={{ __html: results }} />
              </section>
            )}

            {achievement.display_website && achievement.iframe_url && (
              <section>
                <h2 className="mb-3 text-xl font-extrabold text-ink-900">{locale === "ar" ? "معاينة الموقع" : "Live preview"}</h2>
                <div className="overflow-hidden rounded-2xl border border-brand-100 bg-ink-900">
                  <iframe src={achievement.iframe_url} title={title} className="h-[520px] w-full bg-white" loading="lazy" />
                </div>
              </section>
            )}

            {features.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-extrabold text-ink-900">{locale === "ar" ? "مميزات المشروع" : "Project features"}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((f) => (
                    <div key={f.id} className="flex items-start gap-3 rounded-xl border border-brand-100 p-3">
                      <Icon name={f.icon} className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-sm font-bold text-ink-900">{localize(locale, f.title_ar, f.title_en)}</p>
                        {(f.description_ar || f.description_en) && <p className="text-xs text-gray-500">{localize(locale, f.description_ar, f.description_en)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {images.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-extrabold text-ink-900">{locale === "ar" ? "معرض الصور" : "Gallery"}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img.id} src={img.url} alt={img.alt ?? title} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {achievement.technologies.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 font-bold text-ink-900">{locale === "ar" ? "التقنيات" : "Technologies"}</h3>
                <div className="flex flex-wrap gap-2">
                  {achievement.technologies.map((t) => (
                    <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {relatedServices.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 font-bold text-ink-900">{locale === "ar" ? "الخدمات المرتبطة" : "Related services"}</h3>
                <div className="space-y-2">
                  {relatedServices.map((s) => (
                    <Link key={s.id} href={p(`/services/${s.slug}`)} className="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">{localize(locale, s.title_ar, s.title_en)}</Link>
                  ))}
                </div>
              </div>
            )}
            {(achievement.website_url || achievement.external_url) && (
              <a href={achievement.website_url || achievement.external_url!} target="_blank" rel="noopener noreferrer" className="btn-primary w-full px-5 py-3">
                {locale === "ar" ? "زيارة الموقع" : "Visit website"}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
