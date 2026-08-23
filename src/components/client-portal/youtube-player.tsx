"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { localize } from "@/lib/utils";

function extractId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    if (u.pathname.startsWith("/embed/")) return u.pathname.slice(7);
    if (u.pathname.startsWith("/shorts/")) return u.pathname.slice(8);
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Custom Sitekoom player facade. The video is served by YouTube via the
 * official embed player (full controls + fullscreen), but the surrounding
 * container, poster, play button, title and description are Sitekoom's own UI.
 */
export function YouTubePlayer({
  url,
  title,
  description,
  locale,
}: {
  url: string;
  title: string;
  description: string | null;
  locale: "ar" | "en";
}) {
  const [playing, setPlaying] = useState(false);
  const id = extractId(url);
  const isAr = locale === "ar";

  if (!id) {
    return (
      <div className="card overflow-hidden">
        <div className="flex aspect-video w-full items-center justify-center bg-ink-900 text-sm text-white">
          {isAr ? "رابط الفيديو غير صالح" : "Invalid video link"}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden bg-ink-900">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full" aria-label={isAr ? "تشغيل الفيديو" : "Play video"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-ink-900/40 transition-colors group-hover:bg-ink-900/30" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow transition-transform duration-200 group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="font-bold text-ink-900">{title}</p>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  );
}
