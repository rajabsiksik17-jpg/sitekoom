"use client";

import { useLocale } from "@/components/providers";
import { localize } from "@/lib/utils";
import type { MarqueeMessage } from "@/lib/types";

/**
 * Infinite seamless marquee. The track is duplicated into two identical,
 * self-contained groups (A → B → A → B …) so `translateX(±50%)` moves exactly
 * one group width — a real gapless loop with no jump, no white gap and no
 * half-word cut.
 *
 * The direction is locale-aware: English lays out and scrolls LTR
 * (`translateX(0 → -50%)`), Arabic lays out and scrolls RTL
 * (`translateX(0 → +50%)`). No hardcoded `dir="ltr"` on the animated track.
 */
export function Marquee({ messages }: { messages: MarqueeMessage[] }) {
  const { locale } = useLocale();
  if (messages.length === 0) return null;
  const isAr = locale === "ar";

  const items = messages.map((m) => localize(locale, m.text_ar, m.text_en));

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="overflow-hidden border-y border-brand-100 bg-brand-50/50 py-4">
      <div className={`flex w-max will-change-transform ${isAr ? "animate-marquee-rtl" : "animate-marquee"}`}>
        {[0, 1].map((dup) => (
          <div
            key={dup}
            aria-hidden={dup === 1 || undefined}
            className="flex shrink-0 items-center gap-8 pe-8 sm:gap-10 sm:pe-10"
          >
            {items.map((text, i) => (
              <span
                key={i}
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
