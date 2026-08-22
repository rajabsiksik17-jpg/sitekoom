"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, LayoutGrid } from "lucide-react";
import { ServiceCard } from "@/components/service-card";
import { Icon } from "@/components/icon";
import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/lib/types";

export function ServiceCategories({ categories, services }: { categories: ServiceCategory[]; services: Service[] }) {
  const { locale, dir } = useLocale();
  const isAr = locale === "ar";
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const [active, setActive] = useState<string>("all");

  const servicesFor = (categoryId: string) => services.filter((s) => s.category_id === categoryId);

  const visibleCategories = active === "all" ? categories : categories.filter((c) => c.id === active);

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${active === "all" ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
        >
          {isAr ? "الكل" : "All"}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c.id)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${active === c.id ? "bg-brand-gradient text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
          >
            {localize(locale, c.name_ar, c.name_en)}
          </button>
        ))}
      </div>

      {visibleCategories.map((category) => {
        const list = servicesFor(category.id);
        if (list.length === 0) return null;
        return (
          <section key={category.id} className="mb-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <Icon name={category.icon} className="h-7 w-7" />
                </span>
                <div>
                  <h2 className="text-2xl font-extrabold text-ink-900">{localize(locale, category.name_ar, category.name_en)}</h2>
                  {category.description_ar && (
                    <p className="mt-1 text-gray-600">{localize(locale, category.description_ar, category.description_en)}</p>
                  )}
                </div>
              </div>
              <Link href={`/services/category/${category.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                {isAr ? `رؤية خدمات ${localize(locale, category.name_ar, category.name_en)}` : `View ${localize(locale, category.name_ar, category.name_en)} services`}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>
        );
      })}

      {active !== "all" && (
        <div className="text-center">
          <Link href="/services" className="btn-secondary px-6 py-3">
            <LayoutGrid className="h-4 w-4" />
            {isAr ? "رؤية جميع الخدمات" : "View all services"}
          </Link>
        </div>
      )}
    </div>
  );
}
