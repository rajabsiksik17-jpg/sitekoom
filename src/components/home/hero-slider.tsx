"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, localize } from "@/lib/utils";
import { useLocale } from "@/components/providers";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import type { HomepageSlider } from "@/lib/types";

export function HeroSlider({ slides }: { slides: HomepageSlider[] }) {
  const { locale, dir } = useLocale();
  const href = useLocalizedHref();
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const go = (i: number) => setIndex((i + count) % count);
  const slide = slides[index];

  // Communicate the hero theme to the fixed header.
  useEffect(() => {
    const theme = slide.header_theme === "light" ? "light" : "dark";
    document.body.dataset.headerTheme = theme;
    window.dispatchEvent(new Event("header-theme-change"));
    return () => {
      delete document.body.dataset.headerTheme;
      window.dispatchEvent(new Event("header-theme-change"));
    };
  }, [slide]);

  const title = localize(locale, slide.title_ar, slide.title_en);
  const subtitle = localize(locale, slide.subtitle_ar, slide.subtitle_en);
  const description = localize(locale, slide.description_ar, slide.description_en);
  const ctaText = localize(locale, slide.cta_text_ar, slide.cta_text_en);
  const cta2Text = localize(locale, slide.cta2_text_ar, slide.cta2_text_en);

  const isRtl = dir === "rtl";
  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  return (
    <section className="relative overflow-hidden bg-ink-900">
      <div className="absolute inset-0 bg-hero-gradient" />

      {/* Background image (desktop default; mobile/tablet via CSS responsive src) */}
      {slide.desktop_image && (
        <picture className="absolute inset-0 h-full w-full">
          {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
          {slide.tablet_image && <source media="(max-width: 1024px)" srcSet={slide.tablet_image} />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.desktop_image}
            alt={title}
            className="h-full w-full object-cover opacity-25"
            fetchPriority="high"
          />
        </picture>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />

      <div className="container-site relative flex min-h-[560px] items-center py-24 lg:min-h-[680px]">
        <div key={slide.id} className="max-w-2xl animate-fade-up">
          {subtitle && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1.5 text-sm font-medium text-brand-200">
              {subtitle}
            </span>
          )}
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">{description}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {ctaText && slide.cta_url && (
              <Link href={href(slide.cta_url)} className="btn-primary px-6 py-3 text-base">
                {ctaText}
              </Link>
            )}
            {cta2Text && slide.cta2_url && (
              <Link href={href(slide.cta2_url)} className="btn-secondary bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20">
                {cta2Text}
              </Link>
            )}
          </div>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute start-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur hover:bg-white/20 md:block"
            aria-label="Previous slide"
          >
            <Prev className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute end-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white backdrop-blur hover:bg-white/20 md:block"
            aria-label="Next slide"
          >
            <Next className="h-5 w-5" />
          </button>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-8 bg-brand-400" : "w-2 bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
