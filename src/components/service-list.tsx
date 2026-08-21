"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ServiceCard } from "@/components/service-card";
import { useLocale } from "@/components/providers";
import type { Service } from "@/lib/types";

export function ServiceList({ services }: { services: Service[] }) {
  const { dict } = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.title_ar.toLowerCase().includes(q) ||
        s.title_en.toLowerCase().includes(q) ||
        (s.short_desc_ar ?? "").toLowerCase().includes(q) ||
        (s.short_desc_en ?? "").toLowerCase().includes(q),
    );
  }, [services, query]);

  return (
    <div>
      <div className="mb-8 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            className="input ps-10"
            placeholder={dict.common.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-gray-500">{dict.common.noResults}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
