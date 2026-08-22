"use client";

import { useState } from "react";
import { cn, localize } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";
import { useLocale } from "@/components/providers";
import type { Project, Service, ServiceCategory } from "@/lib/types";

export function ProjectList({
  projects,
  categories,
  services,
}: {
  projects: Project[];
  categories: ServiceCategory[];
  services: Service[];
}) {
  const { dict, locale } = useLocale();
  const [categoryId, setCategoryId] = useState("all");
  const [serviceId, setServiceId] = useState("all");

  const categoryServices = categoryId === "all" ? services : services.filter((s) => s.category_id === categoryId);

  const filtered = projects.filter((p) => {
    if (categoryId !== "all" && p.service?.category_id !== categoryId) return false;
    if (serviceId !== "all" && p.service_id !== serviceId) return false;
    return true;
  });

  function selectCategory(id: string) {
    setCategoryId(id);
    setServiceId("all");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => selectCategory("all")}
          className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-colors", categoryId === "all" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100")}
        >
          {dict.common.all}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCategory(c.id)}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-colors", categoryId === c.id ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100")}
          >
            {localize(locale, c.name_ar, c.name_en)}
          </button>
        ))}
      </div>

      {categoryServices.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categoryServices.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className={cn("rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors", serviceId === s.id ? "border-brand-500 bg-brand-50 text-brand-700" : "border-brand-100 text-gray-600 hover:border-brand-300")}
            >
              {localize(locale, s.title_ar, s.title_en)}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-gray-500">{dict.common.noResults}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
