"use client";

import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { localize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AboutProcessSection } from "@/lib/content-sections";

export function AboutProcessSectionView({ data, locale }: { data: AboutProcessSection; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const steps = data.steps ?? [];

  return (
    <section className="container-site py-16 sm:py-20">
      <Reveal className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{title}</h2>
        {desc && <p className="mt-4 leading-relaxed text-gray-600">{desc}</p>}
      </Reveal>

      <div dir={isAr ? "rtl" : "ltr"} className="relative mx-auto max-w-5xl">
        {/* Central vertical line (absolute, behind rows) — desktop */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-brand-300/50 to-transparent sm:block" aria-hidden="true" />

        {/* Desktop: alternating grid rows */}
        <div className="relative hidden space-y-6 sm:block sm:space-y-10">
          {steps.map((s, i) => {
            const t = localize(locale, s.ar.title, s.en.title);
            const d = localize(locale, s.ar.desc, s.en.desc);
            const left = i % 2 === 0;
            return (
              <div key={i} className="group relative">
                <Reveal delay={i * 50}>
                  <div className="relative grid items-center sm:grid-cols-[1fr_3.5rem_1fr]">
                    {/* Card */}
                    <div className={cn("row-start-1", left ? "col-start-1" : "col-start-3")}>
                      <div className="card card-hover p-6 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-brand-300">
                        <div className="flex items-center gap-4">
                          <span className="pointer-events-none select-none text-5xl font-extrabold leading-none text-brand-100 sm:text-6xl">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white">
                            <Icon name={s.icon || "check-circle"} className="h-6 w-6" />
                          </span>
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-ink-900">{t}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{d}</p>
                      </div>
                    </div>

                    {/* Middle: node + connector */}
                    <div className="relative col-start-2 row-start-1 flex h-full items-center justify-center">
                      <span className={cn("absolute top-1/2 h-px w-2 -translate-y-1/2 bg-gradient-to-r from-brand-300/60 to-brand-300/10", left ? "end-0" : "start-0")} aria-hidden="true" />
                      <span className="relative z-10 h-9 w-9 rounded-full border border-brand-300/40 bg-white shadow-soft transition-all duration-300 group-hover:border-brand-400 group-hover:shadow-glow" />
                    </div>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical rail layout */}
        <div className="relative mt-2 space-y-6 sm:hidden">
          <div className="pointer-events-none absolute inset-y-0 start-4 w-px bg-gradient-to-b from-transparent via-brand-300/50 to-transparent" aria-hidden="true" />
          {steps.map((s, i) => {
            const t = localize(locale, s.ar.title, s.en.title);
            const d = localize(locale, s.ar.desc, s.en.desc);
            return (
              <Reveal key={i} delay={i * 40}>
                <div className="relative flex items-start gap-4">
                  <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-300/40 bg-white shadow-soft">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  </span>
                  <div className="card card-hover flex-1 p-5">
                    <div className="flex items-center gap-3">
                      <span className="select-none text-4xl font-extrabold leading-none text-brand-100">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-white">
                        <Icon name={s.icon || "check-circle"} className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-ink-900">{t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{d}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
