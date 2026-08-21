"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-brand-100 bg-white">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-semibold text-ink-900"
            aria-expanded={open === i}
          >
            {item.question}
            <ChevronDown className={cn("h-5 w-5 shrink-0 text-brand-500 transition-transform", open === i && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <p className="px-5 pb-4 text-sm leading-relaxed text-gray-600">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
