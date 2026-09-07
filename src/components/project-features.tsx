"use client";

import { Icon } from "@/components/icon";
import { Reveal } from "@/components/reveal";
import { localize } from "@/lib/utils";
import type { ProjectFeature } from "@/lib/types";

export function ProjectFeatures({ features, locale }: { features: ProjectFeature[]; locale: "ar" | "en" }) {
  if (features.length === 0) return null;

  return (
    <section>
      <h3 className="mb-5 text-lg font-extrabold text-ink-900">{locale === "ar" ? "مميزات العمل" : "Project Features"}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
        {features.map((f, i) => (
          <Reveal key={f.id} delay={i * 60}>
            <div className="group card card-hover h-full p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/80 hover:shadow-glow sm:p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-soft transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:h-12 sm:w-12 sm:rounded-xl">
                <Icon name={f.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="break-words text-sm font-bold text-ink-900 sm:text-base">{localize(locale, f.title_ar, f.title_en)}</h3>
              {(f.description_ar || f.description_en) && (
                <p className="mt-1.5 break-words text-xs leading-relaxed text-gray-600 sm:mt-2 sm:text-sm">{localize(locale, f.description_ar, f.description_en)}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
