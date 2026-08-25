"use client";

import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { MarqueeMessage } from "@/lib/types";

/**
 * Infinite seamless marquee. The animated track is duplicated into two
 * identical, self-contained groups (A → B → A → B …). Because each group
 * carries its own trailing padding, `translateX(±50%)` moves exactly one group
 * width — a real gapless loop with no jump, no white gap and no half-word cut.
 *
 * The track is always laid out `dir="ltr"` so the physical `translateX`
 * math stays correct; the text itself uses `dir="auto"` so Arabic renders RTL.
 * LTR scrolls leftward, Arabic (RTL) scrolls rightward via the reverse keyframe.
 */
export function Marquee({ messages }: { messages: MarqueeMessage[] }) {
  const { locale } = useLocale();
  if (messages.length === 0) return null;
  const isAr = locale === "ar";

  const items = messages.map((m) => localize(locale, m.text_ar, m.text_en));

  return (
    <div className="overflow-hidden border-y border-brand-100 bg-brand-50/50 py-4">
      <div
        dir="ltr"
        className={`flex w-max will-change-transform ${isAr ? "animate-marquee-reverse" : "animate-marquee"}`}
      >
        {[0, 1].map((dup) => (
          <div
            key={dup}
            aria-hidden={dup === 1 || undefined}
            className="flex shrink-0 items-center gap-8 pe-8 sm:gap-10 sm:pe-10"
          >
            {items.map((text, i) => (
              <span
                key={i}
                dir="auto"
                className="flex shrink-0 items-center gap-3 whitespace-nowrap text-sm font-semibold text-brand-800"
              >
                <span>{text}</span>
                <span aria-hidden className="text-brand-300">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
