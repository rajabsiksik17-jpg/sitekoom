"use client";

import { useState } from "react";
import { cn, localize } from "@/lib/utils";
import { ProjectCard } from "@/components/project-card";
import { useLocale } from "@/components/providers";
import type { Project, ProjectCategory } from "@/lib/types";

export function ProjectList({
  projects,
  categories,
}: {
  projects: Project[];
  categories: ProjectCategory[];
}) {
  const { dict, locale } = useLocale();
  const [active, setActive] = useState<string>("all");

  const filtered =
    active === "all" ? projects : projects.filter((p) => p.category_id === active);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            active === "all" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100",
          )}
        >
          {dict.common.all}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              active === c.id ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100",
            )}
          >
            {c.name_ar ? localize(locale, c.name_ar, c.name_en) : ""}
          </button>
        ))}
      </div>

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
