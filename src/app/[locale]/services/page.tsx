import { PageHero } from "@/components/page-hero";
import { ServiceList } from "@/components/service-list";
import { localize } from "@/lib/utils";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getServices, getHomepageSections } from "@/lib/queries";

export default async function ServicesPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const [services, sections] = await Promise.all([getServices(), getHomepageSections()]);
  const sec = sections.find((s) => s.key === "services");

  return (
    <>
      <PageHero
        pageKey="services"
        title={localize(locale, sec?.title_ar, sec?.title_en) ?? dict.home.servicesTitle}
        subtitle={localize(locale, sec?.description_ar, sec?.description_en) ?? dict.home.servicesSubtitle}
      />
      <section className="container-site py-16">
        <ServiceList services={services} />
      </section>
    </>
  );
}
