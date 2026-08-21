"use client";

import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { MarqueeMessage } from "@/lib/types";

export function Marquee({ messages }: { messages: MarqueeMessage[] }) {
  const { locale } = useLocale();
  if (messages.length === 0) return null;

  const items = messages.map((m) => localize(locale, m.text_ar, m.text_en));

  return (
    <div className="overflow-hidden border-y border-brand-100 bg-brand-50/50 py-4">
      <div className="flex w-max animate-marquee gap-12" dir="ltr">
        {[...items, ...items].map((text, i) => (
          <span key={i} className="flex items-center gap-12 whitespace-nowrap text-sm font-semibold text-brand-800">
            <span>{text}</span>
            <span className="text-brand-300">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
