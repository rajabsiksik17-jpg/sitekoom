import { Icon } from "@/components/icon";
import { localize } from "@/lib/utils";
import type { ProjectFeature } from "@/lib/types";

export function ProjectFeatures({ features, locale }: { features: ProjectFeature[]; locale: "ar" | "en" }) {
  if (features.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-extrabold text-ink-900">{locale === "ar" ? "مميزات العمل" : "Project Features"}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.id} className="card h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name={f.icon} className="h-6 w-6" />
            </span>
            <h3 className="mb-2 font-bold text-ink-900">{localize(locale, f.title_ar, f.title_en)}</h3>
            {(f.description_ar || f.description_en) && <p className="text-sm leading-relaxed text-gray-600">{localize(locale, f.description_ar, f.description_en)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
