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
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f, i) => (
          <Reveal key={f.id} delay={i * 60}>
            <div className="group card card-hover h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300/80 hover:shadow-glow">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-soft transition-transform duration-300 group-hover:scale-110">
                <Icon name={f.icon} className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-ink-900">{localize(locale, f.title_ar, f.title_en)}</h3>
              {(f.description_ar || f.description_en) && (
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{localize(locale, f.description_ar, f.description_en)}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
