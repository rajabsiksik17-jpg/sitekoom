"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Icon } from "@/components/icon";
import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { Service } from "@/lib/types";

export function ServiceCard({ service }: { service: Service }) {
  const { locale, dir } = useLocale();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group card flex h-full flex-col gap-4 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-glow"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white transition-transform group-hover:scale-110">
        <Icon name={service.icon} className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-ink-900">{localize(locale, service.title_ar, service.title_en)}</h3>
      <p className="text-sm leading-relaxed text-gray-600">
        {localize(locale, service.short_desc_ar, service.short_desc_en)}
      </p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-brand-700">
        <span>{localize(locale, "اعرف المزيد", "Learn more")}</span>
        <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
