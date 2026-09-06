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

  if (logos.length === 0) return null;

  // Circular-ish logo item — full project link.
  const logoLink = (p: Project, i: number) => (
    <Link
      key={`${p.id}-${i}`}
      href={localizePath(`/projects/${p.slug}`, locale)}
      aria-label={p.title_ar || p.title_en || "Project"}
      className="group mx-3 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-white p-2 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.logo!} alt="" loading="lazy" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
    </Link>
  );

  // Single logo → static presentation.
  if (logos.length === 1) {
    return (
      <section className="container-site py-14">
        <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{headingText}</h2>
        <div className="flex justify-center">{logoLink(logos[0], 0)}</div>
      </section>
    );
  }

  const loop = [...logos, ...logos];

  return (
    <section className="container-site py-14">
      <h2 className="mb-8 text-center text-2xl font-extrabold text-ink-900 sm:text-3xl">{headingText}</h2>
      <div
        className="relative overflow-hidden py-2"
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
          {loop.map((p, i) => logoLink(p, i))}
        </div>
      </div>
      <style>{`
        @keyframes logos { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </section>
  );
}
