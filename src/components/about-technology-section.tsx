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

          <ul className="mt-8 space-y-5">
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

        {/* Orbital visual (all breakpoints; scales down on mobile) */}
        <Reveal delay={100}>
          <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-[30rem]">
            {/* radial glow */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-brand-gradient opacity-[0.08] blur-3xl" aria-hidden="true" />
            {/* rings */}
            <div className="orbit-spin absolute inset-[14%] rounded-full border border-dashed border-brand-200/40" style={{ animationDuration: "70s" }} aria-hidden="true" />
            <div className="orbit-spin-rev absolute inset-[30%] rounded-full border border-brand-100/50" style={{ animationDuration: "50s" }} aria-hidden="true" />

            {/* central node */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border border-brand-200/60 bg-white/90 text-center shadow-glow backdrop-blur-sm sm:h-40 sm:w-40">
                <span className="absolute inset-[-8px] rounded-full border border-brand-100/40" aria-hidden="true" />
                <span className="text-lg font-extrabold tracking-tight text-brand-700 sm:text-xl" dir="ltr">SITEKOOM</span>
                <span className="mt-1 text-[11px] text-gray-500 sm:text-xs">{isAr ? "مشروعك" : "Your Business"}</span>
              </div>
            </div>

            {/* 5 orbiting nodes (equally spaced, no overlap) */}
            {items.map((it, i) => {
              const t = localize(locale, it.ar.title, it.en.title);
              const angle = (i / items.length) * 360 - 90;
              return (
                <div
                  key={i}
                  className="pointer-events-none absolute inset-0"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  <div className="absolute left-1/2 top-[6%] -translate-x-1/2 -translate-y-1/2">
                    <div
                      className="pointer-events-auto w-28 max-w-[46%] rounded-2xl border border-white/60 bg-white/85 px-2.5 py-2 text-center shadow-soft backdrop-blur-md transition-all duration-300 hover:border-brand-300 hover:shadow-glow sm:w-32 sm:px-3 sm:py-2.5 lg:w-36 lg:px-4 lg:py-3"
                      style={{ transform: `rotate(${-angle}deg)` }}
                    >
                      <span className="block text-[11px] font-extrabold text-brand-600 sm:text-xs">{String(i + 1).padStart(2, "0")}</span>
                      <span className="mt-1 block text-xs font-semibold leading-snug text-ink-900 sm:text-sm">{t}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
