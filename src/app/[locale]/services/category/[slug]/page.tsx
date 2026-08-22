import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ServiceCard } from "@/components/service-card";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getServiceCategoryBySlug, getServices } from "@/lib/queries";

export async function generateMetadata({ params }: { params: { locale: "ar" | "en"; slug: string } }): Promise<Metadata> {
  const category = await getServiceCategoryBySlug(params.slug);
  if (!category) return {};
  const title = params.locale === "ar" ? category.seo_title_ar || category.name_ar : category.seo_title_en || category.name_en;
  return {
    title,
    description: params.locale === "ar" ? category.meta_description_ar || category.description_ar || undefined : category.meta_description_en || category.description_en || undefined,
    openGraph: {
      title,
      description: (params.locale === "ar" ? category.meta_description_ar : category.meta_description_en) || undefined,
      images: category.og_image ? [{ url: category.og_image }] : undefined,
    },
    alternates: { canonical: `/services/category/${category.slug}` },
  };
}

export default async function ServiceCategoryPage({ params }: { params: { locale: "ar" | "en"; slug: string } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const category = await getServiceCategoryBySlug(params.slug);
  if (!category) notFound();

  const services = (await getServices()).filter((s) => s.category_id === category.id);

  return (
    <>
      <PageHero
        pageKey="services"
        title={localize(locale, category.name_ar, category.name_en)}
        subtitle={localize(locale, category.description_ar, category.description_en)}
      />
      <div className="container-site py-12">
        <Breadcrumbs
          locale={locale}
          items={[
            { name: dict.nav.services, path: "/services" },
            { name: localize(locale, category.name_ar, category.name_en), path: `/services/category/${category.slug}` },
          ]}
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </div>
    </>
  );
}
