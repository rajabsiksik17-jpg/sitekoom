 "use client";

import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import type { AboutPhilosophySection } from "@/lib/content-sections";

export function AboutTechnologySection({
  data,
  locale,
}: {
  data: AboutPhilosophySection;
  locale: "ar" | "en";
}) {
  const isAr = locale === "ar";
  const title = localize(locale, data.title_ar, data.title_en);
  const highlight = localize(locale, data.highlight_ar, data.highlight_en);
  const desc = localize(locale, data.desc_ar, data.desc_en);
  const items = data.items ?? [];

  return (
    <section className="container-site overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-20"
      >
        {/* Text side */}
        <Reveal className="min-w-0">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-[2.5rem]">
              {title}
            </h2>

            {highlight ? (
              <p className="mt-4 text-lg font-bold leading-relaxed text-brand-700 sm:text-xl">
                {highlight}
              </p>
            ) : null}

            {desc ? (
              <p className="mt-4 max-w-xl text-base leading-8 text-gray-600 sm:text-lg">
                {desc}
              </p>
            ) : null}

            {items.length > 0 ? (
              <ul className="mt-8 space-y-4 sm:mt-10 sm:space-y-5">
                {items.map((it, i) => {
                  const t = localize(locale, it.ar.title, it.en.title);
                  const d = localize(locale, it.ar.desc, it.en.desc);

                  return (
                    <li
                      key={`${t}-${i}`}
                      className="flex min-w-0 items-start gap-3.5 sm:gap-4"
                    >
                      <span
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700 ring-1 ring-inset ring-brand-100 sm:h-9 sm:w-9 sm:text-xs"
                        aria-hidden="true"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-6 text-ink-900">
                          {t}
                        </p>
                        {d ? (
                          <p className="mt-0.5 text-sm leading-6 text-gray-600 sm:text-[15px]">
                            {d}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </Reveal>

        {/* Visual side */}
        <Reveal delay={100} className="min-w-0">
          <div
            className="relative mx-auto aspect-square w-full max-w-[20rem] sm:max-w-[25rem] lg:max-w-[29rem] xl:max-w-[32rem]"
            aria-label={isAr ? "منظومة سايتكم التقنية" : "Sitekoom technology ecosystem"}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-[10%] rounded-full bg-brand-gradient opacity-[0.08] blur-3xl"
              aria-hidden="true"
            />

            {/* Static orbit rings - animation is intentionally applied only to rings */}
            <div
              className="orbit-spin pointer-events-none absolute inset-[12%] rounded-full border border-dashed border-brand-200/45"
              style={{ animationDuration: "70s" }}
              aria-hidden="true"
            />
            <div
              className="orbit-spin-rev pointer-events-none absolute inset-[29%] rounded-full border border-brand-100/60"
              style={{ animationDuration: "50s" }}
              aria-hidden="true"
            />

            {/* Additional subtle ring */}
            <div
              className="pointer-events-none absolute inset-[42%] rounded-full border border-brand-100/35"
              aria-hidden="true"
            />

            {/* Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border border-brand-200/70 bg-white/95 px-3 text-center shadow-glow backdrop-blur-md sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                <span
                  className="pointer-events-none absolute inset-[-7px] rounded-full border border-brand-100/45"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-[-14px] rounded-full border border-brand-50/70"
                  aria-hidden="true"
                />

                <span
                  className="text-base font-extrabold tracking-tight text-brand-700 sm:text-lg lg:text-xl"
                  dir="ltr"
                >
                  SITEKOOM
                </span>
                <span className="mt-1 text-[10px] font-medium text-gray-500 sm:text-xs">
                  {isAr ? "مشروعك" : "Your Business"}
                </span>
              </div>
            </div>

            {/* Orbit nodes */}
            {items.map((it, i) => {
              const t = localize(locale, it.ar.title, it.en.title);
              const count = items.length;
              const angle = count > 0 ? (i / count) * 360 - 90 : 0;

              return (
                <div
                  key={`orbit-${t}-${i}`}
                  className="pointer-events-none absolute inset-0"
                  style={{ transform: `rotate(${angle}deg)` }}
                  aria-hidden="true"
                >
                  <div className="absolute left-1/2 top-[5%] -translate-x-1/2 -translate-y-1/2">
                    <div
                      className="pointer-events-auto w-[6.9rem] max-w-[30vw] rounded-2xl border border-white/70 bg-white/90 px-2.5 py-2 text-center shadow-soft backdrop-blur-md transition duration-300 hover:border-brand-300 hover:shadow-glow sm:w-32 sm:px-3 sm:py-2.5 lg:w-36 lg:px-4 lg:py-3"
                      style={{ transform: `rotate(${-angle}deg)` }}
                    >
                      <span className="block text-[10px] font-extrabold text-brand-600 sm:text-xs">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block break-words text-[11px] font-semibold leading-[1.35] text-ink-900 sm:text-sm">
                        {t}
                      </span>
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
