"use client";

import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";
import { TeamCard } from "@/components/home/team-card";

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
  const loop = [...members, ...members];

  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-6 pr-6 hover:[animation-play-state:paused]",
          isAr ? "animate-marquee-reverse" : "animate-marquee",
          !autoplay && "[animation-play-state:paused]",
        )}
        dir="ltr"
        style={{ animationDuration: `${speed}s` }}
      >
        {loop.map((m, i) => (
          <div key={`${m.id}-${i}`} className="w-64 shrink-0 sm:w-72">
            <TeamCard member={m} locale={locale} />
          </div>
        ))}
      </div>
    </div>
  );
}
