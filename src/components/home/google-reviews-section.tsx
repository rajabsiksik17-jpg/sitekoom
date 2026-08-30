"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function GoogleReviewsSection({ reviews, settings, locale, total, average }: { reviews: GoogleReview[]; settings: GoogleReviewsSettings; locale: "ar" | "en"; total?: number; average?: number }) {
  const isAr = locale === "ar";
  const N = reviews.length;
  const [perView, setPerView] = useState(3);
  const [index, setIndex] = useState(N);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = localize(locale, settings.title_ar, settings.title_en);
  const desc = localize(locale, settings.description_ar, settings.description_en);
  const mapsHref = settings.google_maps_uri || settings.maps_url;

  // Stats are computed dynamically from active reviews (manual + Google), never from Google API alone.
  const avg = average ?? (N ? Math.round((reviews.reduce((s, r) => s + Number(r.rating), 0) / N) * 10) / 10 : 0);
  const tot = total ?? N;

  // Responsive cards-per-view.
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const duplicated = useMemo(() => {
    if (N === 0) return [];
    return [...reviews, ...reviews, ...reviews];
  }, [reviews, N]);

  const next = useCallback(() => {
    setAnim(true);
    setIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    setAnim(true);
    setIndex((i) => i - 1);
  }, []);

  // Seamless wrap: when we reach the end of the middle copy, jump back without animation.
  useEffect(() => {
    if (!N) return;
    if (index >= N * 2) {
      const id = setTimeout(() => {
        setAnim(false);
        setIndex(index - N);
      }, 520);
      return () => clearTimeout(id);
    }
    if (index < 0) {
      const id = setTimeout(() => {
        setAnim(false);
        setIndex(index + N);
      }, 520);
      return () => clearTimeout(id);
    }
  }, [index, N]);

  // Re-enable transition after the jump.
  useEffect(() => {
    if (anim) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    return () => cancelAnimationFrame(id);
  }, [anim]);

  // Autoplay.
  useEffect(() => {
    if (paused || N === 0) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next, N]);

  function pause() {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    setPaused(true);
  }
  function resume() {
    pauseTimer.current = setTimeout(() => setPaused(false), 300);
  }

  if (N === 0) return null;

  const step = 100 / perView;
  const activeDot = ((index % N) + N) % N;

  return (
    <section className="container-site py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>
          {desc && <p className="mt-3 text-gray-600">{desc}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-white/70 px-4 py-2 shadow-soft backdrop-blur-sm">
            <Stars rating={avg || 5} />
            <span className="text-sm font-bold text-ink-900">{avg.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({tot})</span>
          </div>
          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn-secondary whitespace-nowrap px-4 py-2.5 text-sm">
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{isAr ? "رؤية موقعنا على Google" : "View Us on Google"}</span>
              <span className="sm:hidden">{isAr ? "رؤيتنا على Google" : "View on Google"}</span>
            </a>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={prev} className="btn-secondary h-10 w-10 p-0" aria-label={isAr ? "السابق" : "Previous"}>
              {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button type="button" onClick={next} className="btn-secondary h-10 w-10 p-0" aria-label={isAr ? "التالي" : "Next"}>
              {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Outer clip with generous vertical padding so card shadow/translate is never cut off */}
      <div className="overflow-hidden py-4" onMouseEnter={pause} onMouseLeave={resume}>
        <div
          dir="ltr"
          className="flex"
          style={{
            transform: `translateX(-${index * step}%)`,
            transition: anim ? "transform 0.5s cubic-bezier(0.16,1,0.3,1)" : "none",
          }}
        >
          {duplicated.map((r, i) => (
            <div key={`${r.id}-${i}`} className="shrink-0 px-3" style={{ flexBasis: `${step}%`, maxWidth: `${step}%` }}>
              <div className="card card-hover flex h-full flex-col p-6" dir={isAr ? "rtl" : "ltr"}>
                <div className="mb-3 flex items-center gap-3">
                  {r.author_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.author_photo} alt={r.author_name ?? ""} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">{(r.author_name ?? "G").charAt(0)}</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink-900">{r.author_name ?? "Google User"}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
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
                  {(r.review_url || mapsHref) && (
                    <a href={r.review_url || mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-brand-700 hover:underline">
                      {isAr ? "عرض التقييم على Google" : "View on Google"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="mt-5 flex justify-center gap-1.5">
        {reviews.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setAnim(true); setIndex(N + i); }}
            aria-label={`Slide ${i + 1}`}
            className={cn("h-2 rounded-full transition-all", i === activeDot ? "w-6 bg-brand-600" : "w-2 bg-brand-200 hover:bg-brand-300")}
          />
        ))}
      </div>
    </section>
  );
}
