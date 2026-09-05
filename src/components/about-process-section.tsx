"use client";

import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import { localize } from "@/lib/utils";
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

      <div dir={isAr ? "rtl" : "ltr"} className="relative mx-auto max-w-4xl">
        {/* central glowing line (desktop) */}
        <div className="pointer-events-none absolute inset-y-0 start-4 w-px bg-gradient-to-b from-transparent via-brand-300/60 to-transparent sm:start-1/2" aria-hidden="true">
          <span className="absolute inset-x-[-2px] top-0 h-full w-1 bg-brand-400/30 blur-sm" />
        </div>

        <div className="space-y-10">
          {steps.map((s, i) => {
            const t = localize(locale, s.ar.title, s.en.title);
            const d = localize(locale, s.ar.desc, s.en.desc);
            const even = i % 2 === 0;
            return (
              <Reveal key={i} delay={i * 60}>
                <div className={`relative flex items-start gap-5 sm:gap-8 ${i === 0 ? "" : ""}`}>
                  {/* node on the line */}
                  <div className="absolute start-4 top-1 z-10 -translate-x-1/2 sm:start-1/2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-300/40 bg-white shadow-soft">
                      <span className="node-pulse h-2.5 w-2.5 rounded-full bg-brand-500" style={{ animationDuration: `${2.5 + i * 0.6}s` }} />
                    </span>
                  </div>

                  {/* card */}
                  <div className={`card card-hover w-full p-6 sm:w-[calc(50%-2rem)] ${isAr ? "ps-14 sm:ps-6" : "ps-14 sm:ps-0"} ${even ? "sm:ms-auto" : ""}`}>
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
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
