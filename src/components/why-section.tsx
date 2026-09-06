"use client";

import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { Icon } from "@/components/icon";
import type { WhyItem } from "@/lib/types";

export function WhySection({ items, locale = "ar" }: { items: WhyItem[]; locale?: "ar" | "en" }) {
  const [expanded, setExpanded] = useState(false);
  const isAr = locale === "ar";

  if (items.length === 0) return null;

  // Mobile: show first 4, then "view more". Desktop/tablet show all.
  const visible = expanded || items.length <= 4 ? items : items.slice(0, 4);
  const showToggle = items.length > 4;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((w, i) => (
          <Reveal key={i} delay={i * 50}>
            <div className="card card-hover h-full p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={w.icon} className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-ink-900">{w.title}</h3>
              <p className="text-sm text-gray-600">{w.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
      {showToggle && (
        <div className="mt-6 text-center sm:hidden">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="btn-secondary px-6 py-2.5 text-sm"
          >
            {expanded ? (isAr ? "عرض أقل" : "Show Less") : (isAr ? "عرض المزيد" : "View More")}
          </button>
        </div>
      )}
    </div>
  );
}
