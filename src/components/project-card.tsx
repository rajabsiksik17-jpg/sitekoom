"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/components/providers";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import { localize } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const { locale } = useLocale();
  const href = useLocalizedHref();
  const title = localize(locale, project.title_ar, project.title_en);
  const short = localize(locale, project.short_desc_ar, project.short_desc_en);
  const service = localize(locale, project.service?.title_ar, project.service?.title_en);
  const category = localize(locale, project.category?.name_ar, project.category?.name_en);
  const badge = service || category;

  return (
    <Link
      href={href(`/projects/${project.slug}`)}
      className="group card flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-50">
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-gradient text-white">
            <ArrowUpRight className="h-10 w-10 opacity-50" />
          </div>
        )}
        {badge && (
          <span className="absolute top-3 start-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-bold text-ink-900 group-hover:text-brand-700">{title}</h3>
        {short && <p className="line-clamp-2 text-sm text-gray-600">{short}</p>}
      </div>
    </Link>
  );
}
