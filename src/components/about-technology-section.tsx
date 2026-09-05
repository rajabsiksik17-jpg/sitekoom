"use client";

import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import type { AboutPhilosophySection } from "@/lib/content-sections";

export function AboutTechnologySection({ data, locale }: { data: AboutPhilosophySection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const highlight = localize(locale, data.highlight_ar, data.highlight_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const items = data.items ?? [];

  return (
    <section className="container-site py-16 sm:py-20">
      <div dir={isAr ? "rtl" : "ltr"} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text side */}
        <Reveal>
          <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg font-bold text-brand-700">{highlight}</p>
          <p className="mt-4 leading-relaxed text-gray-600">{desc}</p>

          {/* Mobile: stacked cards */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:hidden">
            {items.map((it, i) => {
              const t = localize(locale, it.ar.title, it.en.title);
              const d = localize(locale, it.ar.desc, it.en.desc);
              return (
                <div key={i} className="card card-hover p-4">
                  <span className="block text-sm font-extrabold text-brand-600">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-1.5 font-bold text-ink-900">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{d}</p>
                </div>
              );
            })}
          </div>

          {/* Desktop: number + title + desc list beside text */}
          <ul className="mt-8 hidden space-y-4 lg:block">
            {items.map((it, i) => {
              const t = localize(locale, it.ar.title, it.en.title);
              const d = localize(locale, it.ar.desc, it.en.desc);
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{t}</p>
                    <p className="text-sm leading-relaxed text-gray-600">{d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* Orbital visual (desktop only) */}
        <Reveal className="hidden lg:block">
          <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
            {/* radial glow */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-brand-gradient opacity-[0.08] blur-3xl" aria-hidden="true" />
            {/* rings */}
            <div className="orbit-spin absolute inset-[14%] rounded-full border border-dashed border-brand-200/40" style={{ animationDuration: "70s" }} aria-hidden="true" />
            <div className="orbit-spin-rev absolute inset-[30%] rounded-full border border-brand-100/50" style={{ animationDuration: "50s" }} aria-hidden="true" />

            {/* central node */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-40 w-40 flex-col items-center justify-center rounded-full border border-brand-200/60 bg-white/90 text-center shadow-glow backdrop-blur-sm">
                <span className="absolute inset-[-8px] rounded-full border border-brand-100/40" aria-hidden="true" />
                <span className="text-xl font-extrabold tracking-tight text-brand-700" dir="ltr">SITEKOOM</span>
                <span className="mt-1 text-xs text-gray-500">{isAr ? "مشروعك" : "Your Business"}</span>
              </div>
            </div>

            {/* 5 orbiting nodes (equally spaced, no overlap) */}
            {items.map((it, i) => {
              const t = localize(locale, it.ar.title, it.en.title);
              const angle = (i / items.length) * 360 - 90;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-47%)` }}
                >
                  <div
                    className="w-36 rounded-2xl border border-white/60 bg-white/85 px-4 py-3 text-center shadow-soft backdrop-blur-md"
                    style={{ transform: `rotate(${-angle}deg)` }}
                  >
                    <span className="block text-xs font-extrabold text-brand-600">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-1 block text-sm font-semibold leading-snug text-ink-900">{t}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Mobile central brand */}
        <Reveal className="lg:hidden">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border border-brand-200/60 bg-white/80 shadow-soft backdrop-blur-sm">
              <span className="text-lg font-extrabold text-brand-700" dir="ltr">SITEKOOM</span>
              <span className="text-xs text-gray-500">{isAr ? "مشروعك" : "Your Business"}</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
