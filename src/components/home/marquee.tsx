"use client";

import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { MarqueeMessage } from "@/lib/types";

export function Marquee({ messages }: { messages: MarqueeMessage[] }) {
  const { locale } = useLocale();
  if (messages.length === 0) return null;

  const items = messages.map((m) => localize(locale, m.text_ar, m.text_en));
  // Duplicate the set so `translateX(-50%)` scrolls exactly one full set and
  // loops seamlessly, with no gap at the wrap point.
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-brand-100 bg-brand-50/50 py-4">
      <div className="flex w-max animate-marquee" dir="ltr">
        {loop.map((text, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center whitespace-nowrap text-sm font-semibold text-brand-800"
          >
            <span>{text}</span>
            <span className="mx-6 text-brand-300 sm:mx-8">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
