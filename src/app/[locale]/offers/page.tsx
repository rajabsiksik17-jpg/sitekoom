import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Reveal } from "@/components/reveal";
import { OfferCard } from "@/components/offer-card";
import { ar, en } from "@/lib/i18n/dictionaries";
import { getOffers } from "@/lib/queries";

export default async function OffersPage({ params }: { params: { locale: "ar" | "en" } }) {
  const locale = params.locale;
  const dict = locale === "ar" ? ar : en;
  const offers = await getOffers();

  return (
    <>
      <PageHero title={locale === "ar" ? "العروض" : "Offers"} subtitle={locale === "ar" ? "عروض أسعار مميزة لحلولنا الرقمية" : "Special offers on our digital solutions"} pageKey="offers" />
      <div className="container-site py-12">
        <Breadcrumbs locale={locale} items={[{ name: locale === "ar" ? "العروض" : "Offers", path: "/offers" }]} />
        {offers.length === 0 ? (
          <p className="py-16 text-center text-gray-500">{locale === "ar" ? "لا توجد عروض حالية." : "No offers available right now."}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o, i) => (
              <Reveal key={o.id} delay={i * 50}><OfferCard offer={o} locale={locale} /></Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
