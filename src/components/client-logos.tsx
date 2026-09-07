"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/config";
import type { Project } from "@/lib/types";

export function ClientLogos({ logos, locale, title }: { logos: Project[]; locale: "ar" | "en"; title?: { ar: string; en: string } }) {
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAr = locale === "ar";
  const heading = title ?? { ar: "عملاؤنا وشركاؤنا", en: "Our Clients & Partners" };
  const headingText = isAr ? heading.ar : heading.en;

  const pause = useCallback(() => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    pauseTimer.current = setTimeout(() => setPaused(false), 400);
  }, []);

  // De-duplicate by project id — each client appears once (technically duplicated
  // only below for the seamless marquee loop).
  const unique = Array.from(new Map(logos.map((p) => [p.id, p])).values()).filter((p) => p.logo);

  if (unique.length === 0) return null;

  const logoItem = (p: Project, i: number) => (
    <Link
      key={`${p.id}-${i}`}
      href={localizePath(`/projects/${p.slug}`, locale)}
      aria-label={p.title_ar || p.title_en || "Project"}
      className="group relative mx-3 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-brand-200/70 bg-white p-1.5 shadow-soft ring-2 ring-brand-500/10 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-glow hover:ring-brand-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
    >
      {/* wavy/dotted premium inner ring */}
      <span className="pointer-events-none absolute inset-1 rounded-full border border-dashed border-brand-200/60" aria-hidden="true" />
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.logo!} alt="" loading="lazy" className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
      </span>
    </Link>
  );

  if (unique.length === 1) {
    return (
      <section className="container-site py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{headingText}</h2>
        <div className="flex justify-center">{logoItem(unique[0], 0)}</div>
      </section>
    );
  }

  // Seamless ticker: duplicate the list and translate by exactly 50% of the track
  // so the loop restarts with the first logo without a jump.
  const loop = [...unique, ...unique];
  const dir = isAr ? "rtl" : "ltr";

  return (
    <section className="container-site py-14">
      <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{headingText}</h2>
      <div
        dir={dir}
        className="relative overflow-hidden py-2"
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <div className={isAr ? "absolute inset-y-0 end-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" : "absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-white to-transparent"} aria-hidden="true" />
        <div className={isAr ? "absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-white to-transparent" : "absolute inset-y-0 end-0 z-10 w-10 bg-gradient-to-l from-white to-transparent"} aria-hidden="true" />
        <div
          className="flex w-max"
          style={{ animation: isAr ? `logos-rtl 30s linear infinite` : `logos 30s linear infinite`, animationPlayState: paused ? "paused" : "running" }}
        >
          {loop.map((p, i) => logoItem(p, i))}
        </div>
      </div>
      <style>{`
        @keyframes logos { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes logos-rtl { from { transform: translateX(0); } to { transform: translateX(50%); } }
      `}</style>
    </section>
  );
}
