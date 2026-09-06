"use client";

import { useCallback, useRef, useState } from "react";
import type { Project } from "@/lib/types";

export function ClientLogos({ logos, locale, title }: { logos: Project[]; locale: "ar" | "en"; title?: { ar: string; en: string } }) {
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAr = locale === "ar";
  const heading = (title ?? { ar: "عملاؤنا وشركاؤنا", en: "Our Clients & Partners" });
  const headingText = isAr ? heading.ar : heading.en;

  const pause = useCallback(() => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    pauseTimer.current = setTimeout(() => setPaused(false), 400);
  }, []);

  if (logos.length === 0) return null;

  // Single logo → static, elegant presentation.
  if (logos.length === 1) {
    const single = logos[0];
    return (
      <section className="container-site py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{headingText}</h2>
        <div className="flex justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-100 bg-white p-3 shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={single.logo!} alt={single.title_ar || single.title_en} loading="lazy" className="h-full w-full object-contain" />
          </span>
        </div>
      </section>
    );
  }

  const loop = [...logos, ...logos];

  return (
    <section className="container-site py-14">
      <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{headingText}</h2>
      <div
        className="relative overflow-hidden"
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <div className="absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-white to-transparent" aria-hidden="true" />
        <div className="absolute inset-y-0 end-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" aria-hidden="true" />
        <div
          className="flex w-max"
          style={{ animation: `logos 30s linear infinite`, animationPlayState: paused ? "paused" : "running" }}
        >
          {loop.map((p, i) => (
            <span
              key={`${p.id}-${i}`}
              className="mx-3 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white p-2.5 shadow-soft transition-all duration-300 hover:border-brand-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo!} alt={p.title_ar || p.title_en} loading="lazy" className="h-full w-full object-contain" />
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes logos { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </section>
  );
}
