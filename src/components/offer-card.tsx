import Link from "next/link";
import { Calculator, ArrowLeft, ArrowRight } from "lucide-react";
import { localize } from "@/lib/utils";
import { localizePath } from "@/lib/i18n/config";
import type { Offer } from "@/lib/types";

export function OfferCard({ offer, locale }: { offer: Offer; locale: "ar" | "en" }) {
  const p = (path: string) => localizePath(path, locale);
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const title = localize(locale, offer.title_ar, offer.title_en);
  const desc = localize(locale, offer.short_desc_ar, offer.short_desc_en);

  const priceLabel = () => {
    if (offer.price_display === "request_quote") return isAr ? "اطلب عرض سعر" : "Request a quote";
    if (offer.price_display === "hide") return null;
    if (offer.price_display === "starting_from") return `${isAr ? "يبدأ من" : "Starting from"} ${offer.base_price} ${offer.currency}`;
    return `${offer.base_price} ${offer.currency}`;
  };

  const isDynamic = ["options", "addons", "packages", "custom_quote"].includes(offer.pricing_type);

  return (
    <div className="card group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
      {offer.is_featured && (
        <span className="absolute end-4 top-4 z-10 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-white shadow-glow">
          {isAr ? "مميز" : "Featured"}
        </span>
      )}
      {offer.main_image && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-brand-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offer.main_image} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-lg font-extrabold text-ink-900">{title}</h3>
        {desc && <p className="mb-4 line-clamp-2 text-sm text-gray-600">{desc}</p>}
        <div className="mt-auto">
          {priceLabel() && (
            <p className="text-2xl font-extrabold text-brand-700">{priceLabel()}</p>
          )}
          {offer.duration && <p className="mt-1 text-xs text-gray-500">{offer.duration}</p>}
          <Link
            href={p(`/offers/${offer.slug}`)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:opacity-95"
          >
            {isAr ? "عرض تفاصيل العرض" : "View offer details"}
            <Arrow className="h-4 w-4" />
          </Link>
          {isDynamic && (
            <Link href={p(`/offers/${offer.slug}`)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 px-5 py-2.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50">
              <Calculator className="h-4 w-4" />
              {isAr ? "احسب السعر" : "Calculate price"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
