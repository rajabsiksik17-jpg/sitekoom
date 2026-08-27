import Link from "next/link";
import { localize } from "@/lib/utils";
import { localizePath } from "@/lib/i18n/config";
import type { Offer } from "@/lib/types";

export function OfferCard({ offer, locale }: { offer: Offer; locale: "ar" | "en" }) {
  const p = (path: string) => localizePath(path, locale);
  const title = localize(locale, offer.title_ar, offer.title_en);
  const desc = localize(locale, offer.short_desc_ar, offer.short_desc_en);

  const priceLabel = () => {
    if (offer.price_display === "request_quote") return locale === "ar" ? "اطلب عرض سعر" : "Request a quote";
    if (offer.price_display === "hide") return null;
    if (offer.price_display === "starting_from") return `${locale === "ar" ? "يبدأ من" : "Starting from"} ${offer.base_price} ${offer.currency}`;
    return `${offer.base_price} ${offer.currency}`;
  };

  return (
    <Link href={p(`/offers/${offer.slug}`)} className="card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
      {offer.main_image && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-brand-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offer.main_image} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-lg font-bold text-ink-900">{title}</h3>
        {desc && <p className="mb-4 line-clamp-2 text-sm text-gray-600">{desc}</p>}
        <div className="mt-auto">
          {priceLabel() && <p className="text-xl font-extrabold text-brand-700">{priceLabel()}</p>}
          {offer.duration && <p className="mt-1 text-xs text-gray-500">{offer.duration}</p>}
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-700">{locale === "ar" ? "عرض التفاصيل" : "View details"}</span>
        </div>
      </div>
    </Link>
  );
}
