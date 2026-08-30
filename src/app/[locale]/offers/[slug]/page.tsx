import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { OfferPricing } from "@/components/offer-pricing";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getOfferDetails, getDynamicFormFields, getDynamicFormOptions, getDynamicFormRules } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { offer } = (await getOfferDetails((await params).slug)) ?? {};
  if (!offer) return {};
  const supabase = await createClient();
  const { data: seo } = await supabase.from("seo_metadata").select("*").eq("entity_type", "offer").eq("entity_id", offer.id).eq("locale", (await params).locale).maybeSingle();
  const title = localize((await params).locale, offer.title_ar, offer.title_en);
  const canonical = (await params).locale === "ar" ? `/offers/${offer.slug}` : `/en/offers/${offer.slug}`;
  return {
    title: seo?.seo_title || title,
    description: seo?.meta_description || localize((await params).locale, offer.short_desc_ar, offer.short_desc_en) || undefined,
    keywords: seo?.keywords,
    openGraph: { title: seo?.og_title || title, description: seo?.og_description || undefined, images: (seo?.og_image || offer.main_image) ? [{ url: seo?.og_image || offer.main_image! }] : undefined },
    alternates: { canonical, languages: { ar: `/offers/${offer.slug}`, en: `/en/offers/${offer.slug}` } },
  };
}

export default async function OfferDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const dict = locale === "ar" ? ar : en;
  const details = await getOfferDetails((await params).slug);
  if (!details) notFound();
  const { offer, images, stages, included, features, optionGroups, optionValues, addons, packages } = details;

  let formConfig: { fields: Awaited<ReturnType<typeof getDynamicFormFields>>; options: Awaited<ReturnType<typeof getDynamicFormOptions>>; rules: Awaited<ReturnType<typeof getDynamicFormRules>> } | null = null;
  const supabase = await createClient();
  let formId = offer.form_id;
  if (!formId) {
    const { data: defaultForm } = await supabase.from("dynamic_forms").select("id").eq("placement", "offer").eq("is_active", true).order("sort").limit(1).maybeSingle();
    formId = defaultForm?.id ?? null;
  }
  if (formId) {
    const [fields, opts, rules] = await Promise.all([getDynamicFormFields(formId), getDynamicFormOptions(formId), getDynamicFormRules(formId)]);
    formConfig = { fields, options: opts, rules };
  }
  const { data: pricingRules } = await supabase.from("offer_pricing_rules").select("*").eq("offer_id", offer.id).eq("enabled", true).order("sort");

  const title = localize(locale, offer.title_ar, offer.title_en);
  const fullDesc = localize(locale, offer.full_desc_ar, offer.full_desc_en);
  const activeIncluded = included.filter((x) => x.enabled);
  const activeStages = stages.filter((x) => x.enabled);

  return (
    <>
      <PageHero title={title} subtitle={localize(locale, offer.short_desc_ar, offer.short_desc_en)} pageKey="offers" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: locale === "ar" ? "العروض" : "Offers", path: "/offers" }, { name: title, path: `/offers/${offer.slug}` }]} />

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {offer.main_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={offer.main_image} alt={title} className="w-full rounded-2xl object-cover shadow-card" />
            )}
            {fullDesc && <div className="prose-site" dangerouslySetInnerHTML={{ __html: fullDesc }} />}

            {activeIncluded.length > 0 && (
              <section>
                <h2 className="mb-6 text-2xl font-extrabold text-ink-900">{locale === "ar" ? "ماذا يشمل العرض" : "What's included"}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeIncluded.map((x) => (
                    <div key={x.id} className="card card-hover flex items-center gap-3 p-3">
                      <Icon name={x.icon} className="h-5 w-5 text-brand-600" />
                      <span className="text-sm font-semibold text-ink-900">{localize(locale, x.title_ar, x.title_en)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeStages.length > 0 && (
              <section>
                <h2 className="mb-6 text-2xl font-extrabold text-ink-900">{locale === "ar" ? "مراحل العمل" : "Process"}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeStages.map((s, i) => (
                    <div key={s.id} className="card card-hover flex items-center gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white">{i + 1}</span>
                      <div>
                        <p className="font-bold text-ink-900">{localize(locale, s.title_ar, s.title_en)}</p>
                        {s.duration && <p className="text-xs text-gray-500">{s.duration}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div>
            {offer.duration && (
              <div className="glass-premium mb-5 flex items-center gap-3 rounded-2xl p-5 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-400">{locale === "ar" ? "مدة تنفيذ المشروع" : "Project duration"}</p>
                  <p className="mt-0.5 font-bold text-ink-900">{offer.duration}</p>
                </div>
              </div>
            )}
            <OfferPricing offer={offer} optionGroups={optionGroups} optionValues={optionValues} addons={addons} packages={packages} pricingRules={(pricingRules ?? []) as { id: string; title_ar: string; title_en: string; condition: Record<string, unknown>; price_delta: number }[]} formConfig={formConfig} locale={locale} />
          </div>
        </div>
      </div>
    </>
  );
}
