import { PageHero } from "@/components/page-hero";
import { ServiceCategories } from "@/components/service-categories";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getServices, getServiceCategories, getHomepageSections } from "@/lib/queries";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as "ar" | "en";
  const dict = locale === "ar" ? ar : en;
  const [services, categories, sections] = await Promise.all([
    getServices(),
    getServiceCategories(),
    getHomepageSections(),
  ]);
  const sec = sections.find((s) => s.key === "services");

  return (
    <>
      <PageHero
        pageKey="services"
        title={localize(locale, sec?.title_ar, sec?.title_en) ?? dict.home.servicesTitle}
        subtitle={localize(locale, sec?.description_ar, sec?.description_en) ?? dict.home.servicesSubtitle}
      />
      <section className="container-site py-16">
        <ServiceCategories categories={categories} services={services} />
      </section>
    </>
  );
}
