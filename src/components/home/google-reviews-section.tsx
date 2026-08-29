"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, ExternalLink } from "lucide-react";
import { localize, cn } from "@/lib/utils";
import type { GoogleReview } from "@/lib/types";
import type { GoogleReviewsSettings } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-4 w-4", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
      ))}
    </div>
  );
}

export function GoogleReviewsSection({ reviews, settings, locale }: { reviews: GoogleReview[]; settings: GoogleReviewsSettings; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [autoplay, setAutoplay] = useState(true);

  const title = localize(locale, settings.title_ar, settings.title_en);
  const desc = localize(locale, settings.description_ar, settings.description_en);

  function updateArrows() {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  function scrollBy(dir: number) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  useEffect(() => {
    updateArrows();
    if (!autoplay) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollBy(1);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [autoplay]);

  if (!reviews.length) return null;

  return (
    <section className="container-site py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>
          {desc && <p className="mt-3 text-gray-600">{desc}</p>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-white/70 px-4 py-2 shadow-soft backdrop-blur-sm">
            <Stars rating={settings.rating || 5} />
            <span className="text-sm font-bold text-ink-900">{Number(settings.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-gray-500">({settings.total || reviews.length})</span>
          </div>
          {(settings.google_maps_uri || settings.maps_url) && (
            <a
              href={settings.google_maps_uri || settings.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2.5 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              {isAr ? "رؤية موقعنا على Google" : "View Us on Google"}
            </a>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => scrollBy(-1)} disabled={!canPrev} className="btn-secondary h-10 w-10 p-0 disabled:opacity-40" aria-label={isAr ? "السابق" : "Previous"}>
              {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => scrollBy(1)} disabled={!canNext} className="btn-secondary h-10 w-10 p-0 disabled:opacity-40" aria-label={isAr ? "التالي" : "Next"}>
              {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div ref={trackRef} onScroll={updateArrows} className="-mx-2 flex gap-4 overflow-x-auto scroll-smooth px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reviews.map((r) => (
          <div key={r.id} data-review-card className="card card-hover flex w-[85%] shrink-0 snap-start flex-col p-6 sm:w-[420px]">
            <div className="mb-3 flex items-center gap-3">
              {r.author_photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.author_photo} alt={r.author_name ?? ""} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">{(r.author_name ?? "G").charAt(0)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold text-ink-900">{r.author_name ?? "Google User"}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Stars rating={r.rating} />
                  {r.review_date && <span className="text-xs text-gray-400">{r.review_date}</span>}
                </div>
              </div>
            </div>
            {(r.text_ar || r.text_en || r.text) && <p className="line-clamp-4 text-sm leading-relaxed text-gray-600">{localize(locale, r.text_ar, r.text_en) || r.text}</p>}
            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_74x24dp.png" alt="Google" className="h-4" />
              </span>
              {r.review_url ? (
                <a href={r.review_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                  {isAr ? "عرض التقييم على Google" : "View on Google"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : settings.maps_url ? (
                <a href={settings.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                  {isAr ? "عرض التقييم على Google" : "View on Google"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
