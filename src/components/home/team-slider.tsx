"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TeamMember } from "@/lib/types";
import { TeamCard } from "@/components/home/team-card";

/**
 * Team carousel. Shows N members at once (4 desktop, 2 tablet, 1 mobile) and
 * moves one member at a time. Supports autoplay (with configurable speed) and
 * manual arrows. Direction (and the arrow positions/icons) follows the locale.
 */
export function TeamSlider({
  members,
  locale,
  autoplay,
  speed,
}: {
  members: TeamMember[];
  locale: "ar" | "en";
  autoplay: boolean;
  speed: number;
}) {
  const isAr = locale === "ar";
  const [perView, setPerView] = useState(4);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 4);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, members.length - perView);

  // Keep the index valid when the viewport / member count changes.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, members.length - perView)));
  }, [perView, members.length]);

  const next = useCallback(() => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (!autoplay || paused) return;
    const ms = Math.max(1000, (speed || 5) * 1000);
    const id = setInterval(next, ms);
    return () => clearInterval(id);
  }, [autoplay, paused, speed, next]);

  const step = 100 / perView;
  // RTL: to advance we shift the track right (positive X); LTR: left (negative).
  const offset = (isAr ? index : -index) * step;
  const showArrows = members.length > perView;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden">
        <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${offset}%)` }}>
          {members.map((m) => (
            <div key={m.id} className="shrink-0 px-2" style={{ flex: `0 0 ${step}%` }}>
              <TeamCard member={m} locale={locale} />
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={isAr ? "التالي" : "Previous"}
            className="absolute start-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-md transition-colors hover:bg-brand-50"
          >
            {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={isAr ? "السابق" : "Next"}
            className="absolute end-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-md transition-colors hover:bg-brand-50"
          >
            {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </>
      )}
    </div>
  );
}
