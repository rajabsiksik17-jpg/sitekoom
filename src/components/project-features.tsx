import { Icon } from "@/components/icon";
import { localize } from "@/lib/utils";
import type { ProjectFeature } from "@/lib/types";

export function ProjectFeatures({ features, locale }: { features: ProjectFeature[]; locale: "ar" | "en" }) {
  if (features.length === 0) return null;

  return (
    <section>
      <h3 className="mb-4 text-lg font-extrabold text-ink-900">{locale === "ar" ? "مميزات العمل" : "Project Features"}</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        {features.map((f) => (
          <div key={f.id} className="card card-hover p-4">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name={f.icon} className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-bold text-ink-900">{localize(locale, f.title_ar, f.title_en)}</h3>
            {(f.description_ar || f.description_en) && <p className="mt-1 text-xs leading-relaxed text-gray-600">{localize(locale, f.description_ar, f.description_en)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
