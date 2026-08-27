import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { FaqAccordion } from "@/components/faq-accordion";
import { ProjectCard } from "@/components/project-card";
import { ProjectRequestForm } from "@/components/project-request-form";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { localizePath } from "@/lib/i18n/config";
import { getServiceDetails, getProjects, getServices, getServiceCategories } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { faqSchema, serviceSchema, jsonLdToString } from "@/lib/seo";
import type { ServiceFeature } from "@/lib/types";

export async function generateMetadata({ params }: { params: { locale: "ar" | "en"; slug: string } }): Promise<Metadata> {
  const { service } = (await getServiceDetails(params.slug)) ?? {};
  if (!service) return {};
  const supabase = createClient();
  const { data: seo } = await supabase
    .from("seo_metadata")
    .select("*")
    .eq("entity_type", "service")
    .eq("entity_id", service.id)
    .eq("locale", params.locale)
    .maybeSingle();

  const title = params.locale === "ar" ? service.title_ar : service.title_en;
  const canonical = params.locale === "ar" ? `/services/${service.slug}` : `/en/services/${service.slug}`;
  return {
    title: seo?.seo_title || title,
    description: seo?.meta_description || (params.locale === "ar" ? service.short_desc_ar : service.short_desc_en) || undefined,
    keywords: seo?.keywords,
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || undefined,
      images: seo?.og_image || service.main_image ? [{ url: seo?.og_image || service.main_image! }] : undefined,
    },
    alternates: {
      canonical,
      languages: {
        ar: `/services/${service.slug}`,
        en: `/en/services/${service.slug}`,
      },
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: { locale: "ar" | "en"; slug: string };
}) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const p = (path: string) => localizePath(path, locale);

  const details = await getServiceDetails(params.slug);
  if (!details) notFound();
  const { service, images, features, faqs } = details;

  const title = localize(locale, service.title_ar, service.title_en);
  const fullDesc = localize(locale, service.full_desc_ar, service.full_desc_en);
  const shortDesc = localize(locale, service.short_desc_ar, service.short_desc_en);

  const byKind = (kind: ServiceFeature["kind"]) =>
    features.filter((f) => f.kind === kind).map((f) => ({
      icon: f.icon,
      title: localize(locale, f.title_ar, f.title_en).replace(/^\d+[.)\-]?\s*/, ""),
      description: localize(locale, f.description_ar, f.description_en),
    }));

  const [allProjects, allServices, allCategories] = await Promise.all([getProjects(), getServices(), getServiceCategories()]);
  const relatedProjects = allProjects.filter((p) => p.service_id === service.id).slice(0, 3);
  const fallbackProjects = relatedProjects.length ? relatedProjects : allProjects.slice(0, 3);

  const faqItems = faqs.map((f) => ({
    question: localize(locale, f.question_ar, f.question_en),
    answer: localize(locale, f.answer_ar, f.answer_en),
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sitekoom.com";

  return (
    <>
      <PageHero title={title} subtitle={shortDesc} pageKey="service">
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={p(`/request-project?service=${service.slug}`)} className="btn-primary px-6 py-3">
            {dict.common.getQuote}
          </Link>
          <Link href={p("/projects")} className="btn-secondary bg-white/10 px-6 py-3 text-white hover:bg-white/20">
            {dict.nav.projects}
          </Link>
        </div>
      </PageHero>

      <div className="container-site py-12">
        <Breadcrumbs
          locale={locale}
          items={[
            { name: dict.nav.services, path: "/services" },
            { name: title, path: `/services/${service.slug}` },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {service.main_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.main_image}
                alt={title}
                className="mb-8 w-full rounded-2xl object-cover shadow-card"
              />
            )}
            {fullDesc && (
              <div
                className="prose-site"
                dangerouslySetInnerHTML={{ __html: fullDesc }}
              />
            )}

            {images.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.alt ?? title}
                    loading="lazy"
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {byKind("feature").length > 0 && (
              <Reveal className="card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink-900">
                  <Icon name="check-circle" className="h-5 w-5 text-brand-600" />
                  {dict.service.features}
                </h3>
                <ul className="space-y-3">
                  {byKind("feature").map((f, i) => (
                    <li key={i} className="group flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-brand-50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-gradient group-hover:text-white">
                        <Icon name={f.icon || "check-circle"} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{f.title}</p>
                        {f.description && <p className="text-xs text-gray-600">{f.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {byKind("benefit").length > 0 && (
              <Reveal className="card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink-900">
                  <Icon name="trending-up" className="h-5 w-5 text-brand-600" />
                  {dict.service.benefits}
                </h3>
                <ul className="space-y-3">
                  {byKind("benefit").map((f, i) => (
                    <li key={i} className="group flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-brand-50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-gradient group-hover:text-white">
                        <Icon name={f.icon || "check-circle"} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{f.title}</p>
                        {f.description && <p className="text-xs text-gray-600">{f.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            {byKind("technology").length > 0 && (
              <Reveal className="card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink-900">
                  <Icon name="code" className="h-5 w-5 text-brand-600" />
                  {dict.service.technologies}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {byKind("technology").map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-600 hover:bg-brand-600 hover:text-white">
                      <Icon name={f.icon || "code"} className="h-3.5 w-3.5" />
                      {f.title}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}
          </aside>
        </div>

        {byKind("process").length > 0 && (
          <section className="mt-16">
            <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{dict.service.process}</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {byKind("process").map((f, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className="card group relative h-full p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow sm:p-6">
                    <div className="mb-3 flex items-center gap-3 sm:mb-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-base font-extrabold text-white sm:h-12 sm:w-12 sm:text-lg">
                        {i + 1}
                      </span>
                      {i < byKind("process").length - 1 && (
                        <span className="hidden h-px flex-1 bg-brand-200 lg:block" />
                      )}
                    </div>
                    <h3 className="mb-2 text-sm font-bold text-ink-900 sm:text-base">{f.title}</h3>
                    {f.description && <p className="text-xs text-gray-600 sm:text-sm">{f.description}</p>}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {faqItems.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-extrabold text-ink-900">{dict.service.faqs}</h2>
            <FaqAccordion items={faqItems} />
          </section>
        )}
      </div>

      {fallbackProjects.length > 0 && (
        <section className="bg-brand-50/40 py-16">
          <div className="container-site">
            <h2 className="mb-8 text-2xl font-extrabold text-ink-900">{dict.service.relatedProjects}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-site py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-ink-900">{dict.quote.title}</h2>
          <p className="mb-8 text-center text-gray-600">{dict.quote.subtitle}</p>
          <div className="card p-8">
            <ProjectRequestForm services={allServices} categories={allCategories} initialServiceId={service.id} />
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdToString(serviceSchema({ name: title, description: shortDesc, url: `${siteUrl}/services/${service.slug}` })),
        }}
      />
      {faqItems.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdToString(faqSchema(faqItems)) }} />
      )}
    </>
  );
}
