"use client";

import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { MarqueeMessage } from "@/lib/types";

export function Marquee({ messages }: { messages: MarqueeMessage[] }) {
  const { locale } = useLocale();
  if (messages.length === 0) return null;

  const items = messages.map((m) => localize(locale, m.text_ar, m.text_en));
  // Duplicate the set so `translateX(-50%)` produces a seamless, gapless loop.
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-brand-100 bg-brand-50/50 py-4">
      <div className="flex w-max animate-marquee" dir="ltr">
        {loop.map((text, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap pe-3 text-sm font-semibold text-brand-800"
          >
            <span>{text}</span>
            <span className="text-brand-300">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
