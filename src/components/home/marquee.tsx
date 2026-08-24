"use client";

import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { MarqueeMessage } from "@/lib/types";

export function Marquee({ messages }: { messages: MarqueeMessage[] }) {
  const { locale } = useLocale();
  if (messages.length === 0) return null;
  const isAr = locale === "ar";

  const items = messages.map((m) => localize(locale, m.text_ar, m.text_en));
  // Duplicate the set. Combined with a trailing `pr-*` equal to the flex `gap`,
  // `translateX(±50%)` scrolls exactly one full set → a real, gapless loop.
  // LTR scrolls leftward, Arabic (RTL) scrolls rightward.
  const loop = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-brand-100 bg-brand-50/50 py-4">
      <div className={`flex w-max gap-8 pr-8 sm:gap-10 sm:pr-10 ${isAr ? "animate-marquee-reverse" : "animate-marquee"}`} dir="ltr">
        {loop.map((text, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-semibold text-brand-800"
          >
            <span>{text}</span>
            <span className="text-brand-300">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
